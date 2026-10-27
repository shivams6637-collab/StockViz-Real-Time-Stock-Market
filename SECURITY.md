# Security Policy

## Reporting

Do not publish credentials, private user data, or exploitable vulnerability details in public issues. Report security concerns privately to the repository maintainer.

## Secrets and Configuration

- Keep `.env` files out of Git.
- Use environment variables or a secrets manager.
- Rotate credentials that may have been exposed.
- Use a strong, unique JWT signing secret.
- Do not commit database files or user records.
- Never log passwords or authentication tokens.

## Before Deployment

Review CORS configuration, authentication and authorization, HTTPS, database permissions, dependency updates, rate limiting, and error handling.

This document is guidance, not a completed security audit.
