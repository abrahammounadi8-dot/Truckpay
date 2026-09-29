# Production source reconciliation — 2026-09-29

The previous GitHub main (`06617353c8beb0949d17a137c0ff27547cb0d933`) was behind the source deployed through the Vercel CLI. Vercel is not connected to GitHub automatic deployment.

The source of deployment `dpl_8QYYPXmmZjy3okypv79qeoPpDbRB` was recovered from a local release directory. All 254 deployed files matched their Vercel SHA-1 identifiers. The public salary publication pause was then deployed as `dpl_9zHXLhvc4BSstiwDR74w6zNnmgai`; its 254 source files were also verified against Vercel.

This reconciliation brings that published application into GitHub, including verified email authentication, PostgreSQL document storage, retention tooling, payroll corrections, consent settings and the publication pause. Existing main-only request limits and Permissions-Policy are retained. Node 24 CI runs unit tests, account isolation, the synthetic complete payroll flow, lint and the Next build.

Repository code therefore includes the published source **plus** the retained API guards, CI and documentation changes. Merging this work does not deploy those additions. Do not claim GitHub and Vercel are byte-identical after reconciliation.

A Neon snapshot was created and restored to a separate branch before the public pause. The live and restored payroll/profile documents matched by grouped row fingerprints, and live fingerprints were unchanged after deployment. This verifies those documents, not a complete authentication disaster recovery exercise. No production database contents, credentials or authentication state belong in this repository.

## Verification

- 157 unit tests: 156 pass, one OCR test skipped because Tesseract is not installed locally.
- Real authentication and API isolation tests pass with in-memory SQLite/PGlite and synthetic identities. Oversized requests are rejected without bypassing authentication.
- Synthetic PDF → captured test email → real session → extraction → signed amount receipt → three-period private analysis → reload/history → second-account isolation passes. No real email is sent.
- Full ESLint passes. Local Windows sandbox cannot spawn the usual build worker, so local builds use temporary in-process TypeScript/worker settings; committed production configuration is unchanged by that workaround. CI performs the ordinary build.

The inherited rate limiter is in-memory per process and relies on forwarded headers; it is not a distributed abuse limit. The inherited JSON size check uses Content-Length, not a streaming body limit. Retaining these checks avoids regressing main but does not claim complete request hardening.

Public salary publication remains paused. See [publication review](publication-review.md). Issue #7 remains open.
