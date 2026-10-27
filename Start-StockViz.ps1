$ErrorActionPreference = "Stop"

$root = "C:\Users\Acer\Downloads\StockViz-Real-Time-Stock-Market-main\StockViz-Real-Time-Stock-Market-main"
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

if (!(Test-Path "$backend\.venv\Scripts\python.exe")) {
    Write-Host "Backend Python environment nahi mila." -ForegroundColor Red
    exit 1
}

if (!(Test-Path "$frontend\package.json")) {
    Write-Host "Frontend package.json nahi mila." -ForegroundColor Red
    exit 1
}

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backend'; & '.\.venv\Scripts\python.exe' -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8001"
)

Start-Sleep -Seconds 3

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontend'; `$env:PORT='3001'; npm.cmd start"
)

Start-Sleep -Seconds 5
Start-Process "http://localhost:3001"
