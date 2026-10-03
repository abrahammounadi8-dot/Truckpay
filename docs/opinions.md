# Opinions and private product feedback

`/opinions` has public company reviews and private feedback about MyTruckPay. Both require a signed-in account to submit. Public responses contain no account IDs, names, email addresses or payroll data. Company reviews are self-reported, not verified employment. Only approved company reviews contribute to the displayed average.

Company submissions require an explicit publication choice and a declaration of personal work experience. One review per account/company is enforced in PostgreSQL. Editing re-runs moderation, removing sensitive or unknown text from public view until reviewed again. Platform feedback is never public; the database rejects public statuses for platform submissions. Owners can remove either type. Messages stay in the editor on request failure; platform retries reuse the same request ID.

## Operator queue

Use the existing secure database environment. Never paste credentials into chat or commit them.

```
node scripts/review-opinions.mjs list
node scripts/review-opinions.mjs feedback
node scripts/review-opinions.mjs approve <id> <revision>
node scripts/review-opinions.mjs reject <id> <revision>
node scripts/review-opinions.mjs reviewed <id> <revision>
```

Read the entire entry before approval. Check for personal identifiers, irrelevant content and abuse. Editing or deletion invalidates an older moderation action. Approval is a content review, not verification of the claims. The public report link opens a message to the existing privacy inbox; no email is sent automatically.

## Deployment

Migration 006 adds only a new table, indexes and an account-deletion trigger. The authentication migration reapplies it after installing auth tables on fresh environments. Deleting an account (including retention deletion or restore reconciliation) removes contributions through this trigger. Deleting only payslips/profile does not remove contributions.

The feature requires PostgreSQL and never falls back to Vercel temporary files. An unavailable service is shown as an error, not an empty review list or a successful submission. The operator queue is a CLI, not a public moderation endpoint. The interface is Spanish/English, with English fallback for other current locales.

## Web moderation and conservative automatic filter

`/moderation` and `/api/moderation/opinions` require a verified existing account whose exact ID is in the server-only `MTP_OPINION_MODERATOR_IDS` comma-separated allowlist. Unset means no moderator access and automatic publication disabled. Set this through the existing secure production environment, never through a browser-supplied ID, client config, email in a form, or public repository. Confirm the intended account before granting access.

Once configured, new submissions and edits run local ES/EN rules without external API calls or cost. Short ordinary workplace wording can publish automatically; negative sentiment is not a rejection reason. Salary allegations, living conditions, possible personal identifiers, links, threats, other languages and unknown wording remain pending. Obvious advertising is rejected. This is deliberately narrow and is not an AI classifier, a fact check, or a guarantee that every harmful text is detected. Existing pending reviews are not auto-published retroactively.

The queue displays full comment text and the rule reason, without author identity, email or payroll. Read the whole entry before publishing. Decisions require the exact revision and pending status; changed, deleted and already-decided entries return conflict. Feedback about the platform remains private. The existing CLI remains available. Decisions emit an operational log of opinion ID, revision and decision, without comment contents. No schema migration is required.

Validation: moderation rule tests and PostgreSQL-compatible repository tests cover negative/positive parity, unknown wording, identifiers, allegations, private feedback, edit withdrawal and stale decisions. Configure the moderator allowlist and verify a real authenticated moderator can load the queue before rollout. Ordinary users must receive 403 and anonymous users 401 from the API.
