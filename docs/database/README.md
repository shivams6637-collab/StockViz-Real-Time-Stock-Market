# Database Design

## Database Layer

MongoDB connection and persistence code is located in:

- `backend/database/mongo_db.py`
- `backend/database/init_db.py`
- `backend/api/mongo_trading_db.py`

The local development setup has used MongoDB at `127.0.0.1:27017`.

## Configuration

Use local environment variables for database connection settings. Never commit `.env` files, database dumps, credentials, or private user records.

## Schema Documentation

Verify collection names, document fields, indexes, and relationships against the current database code before documenting them as definitive.

## Production Considerations

Review validation, indexes, access controls, backup and recovery, connection failures, and data consistency before production deployment.
