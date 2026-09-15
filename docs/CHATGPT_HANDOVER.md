# ChatGPT Project Handover

Prepared: 15 September 2026

This handover preserves the essential product direction and working method so another ChatGPT account can resume without starting from zero.

## Working model

ChatGPT acts as technical/product coordinator: inspect the real repository state, identify the highest-value next step, review changes, diagnose failures, and keep the roadmap coherent. Cursor/Codex can implement code. Avoid overlapping agent changes without coordination.

Preferred loop: decide -> inspect GitHub -> implement -> test -> review -> deploy -> measure -> next task.

## TruckPay

Repository: `abrahammounadi8-dot/Truckpay`

Driver-focused salary transparency platform. Launch in Ireland first, with global expansion later. Compare what trucking companies advertise with what drivers actually receive, using anonymized evidence and structured working-condition data.

### Product principles

- Payslips are central evidence. Capture recent pay periods/weeks, hours, deductions, allowances, route/contract type, day/night work, base/location, tenure and other factors needed for fair comparisons.
- Verification identity should be separated from published salary analytics.
- Never seed production-facing comparisons with fabricated driver or payslip data.
- Minimize personal data and redact unnecessary payslip identifiers.
- Define retention/deletion rules and make anonymity clear.
- Do not expose individual records as company rankings. Use a minimum cohort before publishing aggregated company metrics. A prior product rule is at least three drivers per company.
- Show real effective pay and working conditions, including advertised/promised vs verified received pay.
- Design the data model for later expansion across countries, currencies, deductions and pay periods.

### Immediate priorities

Inspect current main/PR state; establish production-safe data/privacy boundaries; implement the real payslip submission and verification flow; ensure no fake production data; create aggregation rules; test end-to-end with controlled sample documents; then build the public comparison experience.

## Crypto Threat Signals API

Repository: `abrahammounadi8-dot/crypto-threat-signals-api` (private)

Web3 security/threat-signal API primarily for bots and AI agents. The objective is fast, structured, enriched and verifiable machine-consumable signals rather than simply relaying third-party alerts.

### Product principles

- Important schema fields include `id`, `protocol`, `severity`, `risk_score`, `loss_usd`.
- Enrich token name/symbol and useful identifiers when upstream data omits them.
- Prioritize freshness, independent-source diversity, on-chain verification, deduplication, normalization, confidence/quality scoring and provenance.
- Do not depend on RugCheck alone. RugCheck has been a principal Solana source; additional/considered sources include DeFiLlama, Meteora and Chainabuse.
- Target API response latency below one second where practical and measure p50/p95.
- Render + PostgreSQL have been used; GitHub Actions handles discovery/ingestion workflows.
- Authentication previously had 401 failures from API key/header naming inconsistencies; 404 GET failures have also occurred and need regression coverage.
- Bots, agents and automated trading/security systems are the primary audience.

### Immediate priorities

Verify current workflow health; validate freshness and provenance; enrich token identity; diversify genuinely independent sources; strengthen on-chain verification; measure latency; add automated auth/404/schema regression tests; only then push distribution/monetization harder.

## GoNow

Product concept/reference project. Social app for finding nearby people to run or walk with and coordinating date, time and meeting place. Later layers can include safety, matching and community. Keep the first MVP narrow: discover/join an activity, coordinate it, and establish enough trust/safety for real-world use.

No accessible GoNow repository was found during the handover check.

## Technical ecosystem

- Source control: GitHub
- Coding agents / IDE: Cursor, Codex
- Backend hosting: Render
- Database/backend: PostgreSQL; Supabase available where it fits
- API distribution under consideration: RapidAPI, but distribution must not substitute for product/data quality

## Instructions for the receiving ChatGPT account

1. Connect the same GitHub account and verify repository access before making claims about current code.
2. Read this handover, then inspect the repositories. Repositories are the source of truth for implementation state.
3. Do not assume remembered workflow status is current. Check Actions, branches, PRs, deployments and endpoints.
4. Keep Crypto Threat Signals focused on quality, verification, source independence and machine-consumable speed.
5. Keep TruckPay focused on verified real compensation, privacy, fair aggregation and Ireland-first launch.
6. Do not invent data, customers, deployment success or completed features.
7. Prefer one clearly defined next task at a time, with acceptance criteria and a test.

## First session after transfer

Verify GitHub access -> inspect latest commits/PRs/workflows -> check endpoints -> compare actual state with this handover -> create a short NOW / NEXT / LATER plan -> resume implementation.
