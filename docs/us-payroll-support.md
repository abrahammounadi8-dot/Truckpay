# Initial US employee payroll support

The United States market uses USD and separate employer identities (`us-…`). Private payroll lists and analysis select the active country. Every payslip detail formats its own stored currency, even when the current market changes.

## Supported initial input

One-page employee PDF or OCR text with explicit label/value lines. Dates are ISO or US month/day/four-digit-year. Weekly, biweekly and monthly frequencies are recognised. Current-period gross/net, regular/overtime fields, paid miles, USD per mile and mileage earnings can be read. Conflicting repeated labels, unlabelled multi-column rows and YTD sections are not guessed.

US deduction labels include federal/state/local withholding, Social Security, Medicare, retirement and health insurance. An ambiguous combined FICA amount stays unknown. Classification describes the printed label; it does not determine tax liability or whether a deduction is lawful.

Paid miles × printed rate is compared with printed mileage earnings, rounded to cents. Rates retain four decimal places. This is an arithmetic check; it does not treat mileage earnings as all gross earnings or infer hours from miles. Tax amounts and overtime entitlement are not calculated.

## Limits

Owner-operator / 1099 / carrier settlements, semi-monthly pay and unlabelled current/YTD tables are not supported in this initial reader. These inputs produce no guessed amounts. Gmail import remains available for the existing Irish flow only. A US employee uploads a PDF/photo and checks the extracted figures; the original monetary figures, country and currency are bound to the extraction receipt.

The existing Irish tax-week assignment does not run for US records. US pay-period dates remain stored, but no US week number is invented. No US salary catalogue or salary figures are seeded. Existing publication consent and consecutive-document requirements still apply.

Synthetic fixtures are marked TEST ONLY and are used only in automated tests. Production payroll/provider validation is still required before a broad US launch.

## Source references

- IRS employment tax categories: https://www.irs.gov/businesses/small-businesses-self-employed/understanding-employment-taxes
- US DOL motor-carrier overtime guidance (reason no automatic overtime entitlement is inferred): https://www.dol.gov/agencies/whd/fact-sheets/19-flsa-motor-carrier
