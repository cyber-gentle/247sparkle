# 247Sparkle Operations Runbook

## Scope

This runbook covers the application-level operations baseline introduced for 247Sparkle. It is intentionally designed not to expose credentials, customer data, database connection details, or internal error messages through public probe endpoints.

## Health and readiness probes

| Endpoint             | Purpose                                                                                                  | Expected success response                                | Failure response                                                 | Safe to monitor publicly |
| -------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| `GET /api/health`    | Liveness: confirms the application process can serve requests. It does not query the database.           | `200` with `status: "ok"`                                | A proxy or platform failure if the process cannot answer.        | Yes                      |
| `GET /api/readiness` | Readiness: verifies that the application can complete a short PostgreSQL query before receiving traffic. | `200` with `status: "ready"` and `checks.database: "ok"` | `503` with `status: "not_ready"` and `checks.database: "failed"` | Yes                      |

Both endpoints return `Cache-Control: no-store`. Neither endpoint includes a database URL, driver error, stack trace, user identifier, payment reference, or secret.

> Use `/api/health` for a simple uptime check. Use `/api/readiness` for deployment gates and alerts because it verifies the database dependency.

## Structured logging

In production, the application installs a console bridge during server instrumentation. Existing server-side `console.info`, `console.warn`, and `console.error` calls are emitted as JSON records instead of unstructured text. The bridge also handles unhandled promise rejections and uncaught exceptions.

| Field         | Meaning                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`   | UTC time when the record was emitted.                                                                                                                      |
| `level`       | `info`, `warn`, or `error`.                                                                                                                                |
| `event`       | Stable event name, such as `readiness_check_failed`, `unhandled_rejection`, or `legacy_console_output`.                                                    |
| `service`     | Always `247Sparkle`.                                                                                                                                       |
| `environment` | Active `NODE_ENV` value.                                                                                                                                   |
| `metadata`    | Sanitized context. Keys such as passwords, tokens, cookies, secrets, API keys, email addresses, phone numbers, addresses, and account fields are redacted. |

For a non-production troubleshooting environment, set `STRUCTURED_LOGGING=true` to enable the same JSON console bridge. This setting is optional; production enables it automatically.

## Alert and response procedure

| Signal                                                         | First action                                                                                                                                       | Escalation and recovery                                                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/api/health` unavailable                                      | Check the deployment platform status and recent deployment logs.                                                                                   | Roll back to the latest verified release if the process cannot start.                                                               |
| `/api/readiness` returns `503`                                 | Inspect structured `readiness_check_failed` records and Supabase project health. Do not expose or paste database credentials into logs or tickets. | Verify the database connection settings in the deployment secret store, then recover the database service before reopening traffic. |
| Repeated `unhandled_rejection` or `uncaught_exception` records | Preserve the JSON event, deployment version, and timestamp; identify the originating route or worker path.                                         | Create a focused regression test, patch the defect, validate it locally, and deploy only a verified commit.                         |
| Payment or order errors                                        | Keep Paystack and order identifiers out of public status messages. Use the internal order record and payment event ledger for reconciliation.      | Treat any discrepancy as a financial-integrity incident; do not retry live payment capture manually.                                |

## Backup and restore launch gate

The application does not implement database backups itself. Before live launch, the service owner must configure and test a **Supabase backup and restore procedure** for the production project, including a documented restore owner, retention decision, recovery test cadence, and a non-production restore target. A backup claim is not sufficient until a restore rehearsal has succeeded.

## Validation commands

| Command                    | Purpose                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `npm test`                 | Runs the fast unit and regression suite, including health-route and logger-redaction tests. |
| `npm run test:integration` | Runs the guarded local PostgreSQL integration suite.                                        |
| `npm run type-check`       | Validates TypeScript contracts.                                                             |
| `npm run build`            | Verifies the production application build and Next.js instrumentation integration.          |
