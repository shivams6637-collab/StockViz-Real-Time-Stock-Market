# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities privately to the repository maintainer.
Do not publish credentials, access tokens, personal data, or exploitable details
in public issues.

## Local Configuration

- Keep `.env` files out of version control.
- Use your own credentials in local environment variables.
- Never commit database files, passwords, API keys, or JWT secrets.
- Rotate any credential that may have been exposed.

## Trading and Market Data

StockViz is an educational market-visualization project. Verify market data
independently. Paper-trading features, where implemented, are simulations and
must not be treated as real brokerage execution.
