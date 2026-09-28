# Payroll privacy review — prelaunch working note

Status: draft for implementation and review. This is not a published privacy notice or a legal sign-off. Keep real payslips out of the public test deployment until the production configuration and deletion path have been verified.

## Observed in the repository

| Data or step | Current implementation | Verification needed before real documents |
| --- | --- | --- |
| Uploaded PDF or image | `/api/payslips/extract` accepts up to 8 MB and returns extracted fields. PDF bytes are processed in memory; OCR images are written to a temporary file and removed in `finally`. The original is not intentionally persisted by this extraction route. | Test failure and timeout handling in the deployed runtime; check hosting logs and any provider-side retention. |
| Browser draft | `payslip-form.tsx` keeps entered and extracted fields in `sessionStorage` under `truckpay.payslip-draft`. | Explain this local draft clearly; remove it when the user cancels, saves, or deletes their account, and check shared-device behaviour. |
| Confirmed payslip and profile | `DATABASE_URL` selects PostgreSQL. Without it, the Vercel path uses `/tmp` JSON, which is temporary and not a reliable durable store. | Check the production environment without exposing its secret; verify migrations, backups, restore, regional location, and records already present before any cutover. |
| Session and recovery | Main still uses an anonymous browser cookie. Email accounts live in draft PR #6 and require deployment configuration and migration checks. | Test account recovery in another browser and ensure legacy records are not stranded or claimed by another user. |
| Deletion | A slip can be deleted by owner ID. `DELETE /api/session` removes payslips and profile in the selected store and rotates the browser identity. | Test with synthetic records, verify browser draft cleanup, account deletion in PR #6, backups, and any separately stored public submissions. Do not promise immediate erasure of backup copies without a provider policy. |
| Aggregates and public pages | There are older public reports and company statistics outside the private payslip store. | Map every source and minimum cohort before claiming anonymity, or exposing any production aggregates. |

## Information the public privacy notice still needs

- Identity and contact details of the actual data controller, and a working privacy contact.
- Specific purposes and Article 6 legal basis for each operation: account access, private payslip analysis, support, optional publication of aggregated statistics, and any public submissions.
- Exact categories of data kept, including employer, dates, pay, deductions, manually entered profile details, authentication email and browser draft; distinguish original files from extracted fields.
- Named hosting, email and database providers, processor contracts, data location and any international transfers.
- A retention schedule for live records, dormant accounts, logs, temporary files and backups; a working process for access, export, correction and erasure requests.
- Explanation that pay analysis is indicative and not a legal or payroll certification. Identify whether any consequential automated decisions exist.
- A documented risk assessment for payroll data and public aggregates. Determine whether the proposed processing is likely high risk and needs a DPIA before launch.

## Release gate

1. Confirm which production store is actually used and inventory existing records. Do not infer emptiness from a local checkout.
2. Decide and document retention periods and backup deletion behaviour.
3. Verify authentication, isolation, extraction, deletion and restore with synthetic data.
4. Publish an accurate privacy notice and terms with controller details and working contact.
5. Only then accept real payslips. Do not merge or deploy this working note as a substitute for those checks.

## Cost boundary

Preparing this inventory and draft in the repository does not provision a paid service. A durable database, paid hosting/email tiers or external legal advice may cost money. Present the full recurring and one-off amounts for approval before provisioning.
