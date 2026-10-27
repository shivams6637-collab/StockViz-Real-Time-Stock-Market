
import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from . import mongo_trading_db as mongo
from .auth import current_user

router = APIRouter(prefix="/api/trading", tags=["Paper Trading"])

STARTING_BALANCE = 100000.0


class OrderRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=30)
    side: str = Field(min_length=1, max_length=10)
    quantity: int = Field(gt=0, le=100000)
    price: float = Field(gt=0, le=100000000)


class FundAmountRequest(BaseModel):
    amount: float = Field(gt=0, le=1000000)

def funds_collection():
    return mongo.db["funds"]


def ensure_funds(account_id: str):
    funds_collection().update_one(
        {"account_id": account_id},
        {
            "$setOnInsert": {
                "account_id": account_id,
                "balance": STARTING_BALANCE,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    return funds_collection().find_one({"account_id": account_id})


def clean_doc(doc):
    if not doc:
        return None
    doc.pop("_id", None)
    return doc


@router.get("/funds")
def get_funds(user: dict = Depends(current_user)):
    account_id = user["id"]
    doc = ensure_funds(account_id)

    return {
        "account_type": "paper_trading",
        "currency": "INR",
        "starting_balance": STARTING_BALANCE,
        "balance": round(doc["balance"], 2),
    }


@router.get("/orders")
def get_orders(user: dict = Depends(current_user)):
    account_id = user["id"]

    orders = list(
        mongo.db["orders"]
        .find({"account_id": account_id})
        .sort("created_at", -1)
        .limit(200)
    )
    return [clean_doc(order) for order in orders]


@router.get("/holdings")
def get_holdings(user: dict = Depends(current_user)):
    account_id = user["id"]

    holdings = list(
        mongo.db["holdings"].find({"account_id": account_id})
    )
    return [clean_doc(item) for item in holdings]


@router.get("/positions")
def get_positions(user: dict = Depends(current_user)):
    account_id = user["id"]

    holdings = list(
        mongo.db["holdings"].find({"account_id": account_id})
    )
    return [
        {
            "symbol": item["symbol"],
            "quantity": item["quantity"],
            "average_price": item["average_price"],
            "position_type": "LONG",
        }
        for item in holdings
    ]


@router.post("/orders")
def place_order(
    order: OrderRequest,
    user: dict = Depends(current_user),
):
    account_id = user["id"]

    if not math.isfinite(order.price):
        raise HTTPException(status_code=400, detail="Invalid price")

    symbol = order.symbol.strip().upper()
    side = order.side.strip().upper()

    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")

    if side not in ("BUY", "SELL"):
        raise HTTPException(
            status_code=400,
            detail="side must be BUY or SELL",
        )

    total = round(order.price * order.quantity, 2)
    holdings_col = mongo.db["holdings"]
    funds_col = funds_collection()

    funds = ensure_funds(account_id)
    holding = holdings_col.find_one(
        {"account_id": account_id, "symbol": symbol}
    )

    if side == "BUY":
        if funds["balance"] < total:
            raise HTTPException(
                status_code=400,
                detail="Insufficient virtual funds",
            )

        old_qty = holding["quantity"] if holding else 0
        old_avg = holding["average_price"] if holding else 0
        new_qty = old_qty + order.quantity
        new_avg = ((old_qty * old_avg) + total) / new_qty

        # Only debit funds if this user's balance is sufficient.
        debit = funds_col.update_one(
            {"account_id": account_id, "balance": {"$gte": total}},
            {"$inc": {"balance": -total}},
        )
        if debit.modified_count != 1:
            raise HTTPException(
                status_code=400,
                detail="Insufficient virtual funds",
            )

        holdings_col.update_one(
            {"account_id": account_id, "symbol": symbol},
            {
                "$set": {
                    "account_id": account_id,
                    "symbol": symbol,
                    "quantity": new_qty,
                    "average_price": round(new_avg, 2),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    else:
        if not holding or holding["quantity"] < order.quantity:
            raise HTTPException(
                status_code=400,
                detail="Not enough shares to sell",
            )

        remaining = holding["quantity"] - order.quantity

        if remaining == 0:
            holdings_col.delete_one(
                {
                    "account_id": account_id,
                    "symbol": symbol,
                    "quantity": holding["quantity"],
                }
            )
        else:
            updated = holdings_col.update_one(
                {
                    "account_id": account_id,
                    "symbol": symbol,
                    "quantity": holding["quantity"],
                },
                {
                    "$set": {
                        "quantity": remaining,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            if updated.modified_count != 1:
                raise HTTPException(
                    status_code=409,
                    detail="Holding changed. Please retry the order.",
                )

        funds_col.update_one(
            {"account_id": account_id},
            {"$inc": {"balance": total}},
        )

    record = {
        "account_id": account_id,
        "symbol": symbol,
        "side": side,
        "quantity": order.quantity,
        "price": order.price,
        "total": total,
        "status": "COMPLETED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = mongo.db["orders"].insert_one(record)
    record["id"] = str(result.inserted_id)
    record.pop("_id", None)

    return record

@router.post("/funds/add")
def add_demo_funds(
    request: FundAmountRequest,
    user: dict = Depends(current_user),
):
    if not math.isfinite(request.amount):
        raise HTTPException(status_code=400, detail="Invalid amount")

    amount = round(request.amount, 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    account_id = user["id"]
    funds = ensure_funds(account_id)

    funds_collection().update_one(
        {"account_id": account_id},
        {"$inc": {"balance": amount}},
    )

    updated_funds = funds_collection().find_one({"account_id": account_id})
    balance_after = round(updated_funds["balance"], 2)

    transaction = {
        "account_id": account_id,
        "type": "ADD_FUNDS",
        "amount": amount,
        "balance_after": balance_after,
        "mode": "DEMO",
        "status": "COMPLETED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = mongo.db["fund_transactions"].insert_one(transaction)

    return {
        "message": "Demo funds added successfully",
        "amount": amount,
        "balance": balance_after,
        "transaction_id": str(result.inserted_id),
        "mode": "DEMO",
    }


@router.post("/funds/withdraw")
def withdraw_demo_funds(
    request: FundAmountRequest,
    user: dict = Depends(current_user),
):
    if not math.isfinite(request.amount):
        raise HTTPException(status_code=400, detail="Invalid amount")

    amount = round(request.amount, 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    account_id = user["id"]
    ensure_funds(account_id)

    result = funds_collection().update_one(
        {
            "account_id": account_id,
            "balance": {"$gte": amount},
        },
        {"$inc": {"balance": -amount}},
    )

    if result.modified_count != 1:
        raise HTTPException(
            status_code=400,
            detail="Insufficient virtual funds",
        )

    updated_funds = funds_collection().find_one({"account_id": account_id})
    balance_after = round(updated_funds["balance"], 2)

    transaction = {
        "account_id": account_id,
        "type": "WITHDRAW",
        "amount": amount,
        "balance_after": balance_after,
        "mode": "DEMO",
        "status": "COMPLETED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    transaction_result = mongo.db["fund_transactions"].insert_one(transaction)

    return {
        "message": "Demo withdrawal successful",
        "amount": amount,
        "balance": balance_after,
        "transaction_id": str(transaction_result.inserted_id),
        "mode": "DEMO",
    }


@router.get("/funds/transactions")
def get_fund_transactions(user: dict = Depends(current_user)):
    account_id = user["id"]

    transactions = list(
        mongo.db["fund_transactions"]
        .find({"account_id": account_id})
        .sort("_id", -1)
        .limit(100)
    )

    for transaction in transactions:
        transaction["id"] = str(transaction.pop("_id"))

    return transactions
