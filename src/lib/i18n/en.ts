export type Messages = {
  language: { label: string };
  nav: {
    myTruckPay: string;
    companies: string;
    analysis: string;
    compare: string;
    addPayslip: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    tagline: string;
    myTruckPay: string;
    privatePayslips: string;
    payrollAnalysis: string;
    employmentProfile: string;
    privacy: string;
    faq: string;
    companies: string;
    directory: string;
    gaps: string;
    compare: string;
    publicSlip: string;
    listFirm: string;
    laterPhase: string;
  };
  home: {
    kicker: string;
    headline: string;
    lead: string;
    searchPlaceholder: string;
    searchCompanies: string;
    addPayslip: string;
    exploreCompanies: string;
    publicSlip: string;
    listFirm: string;
    hauliersListed: string;
    driverStubs: string;
    avgGap: string;
    boardEmpty: string;
    widestGapOnFile: string;
    widestGap: string;
    noneYet: string;
    needsQuotedSlip: string;
    underQuoted: string;
    highestTakeHome: string;
    avgFiled: string;
    firstSlipSets: string;
    hauliers: string;
    onTheBoard: string;
    publicHqOnly: string;
    gapsTitle: string;
    hauliersTitle: string;
    gapsDetail: string;
    hauliersDetail: string;
    fullRanking: string;
    openDirectory: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    checkPayslip: string;
  };
  access: {
    locked: string;
    unlocked: string;
    howItWorks: string;
    openAnalysis: string;
    addPayslip: string;
  };
  stub: {
    irelandWeekly: string;
    noSlips: string;
    noInvent: string;
    fileFirst: string;
    weeklySettlement: string;
    slip: string;
    slips: string;
    quotedWeekly: string;
    driversClear: string;
    shortOfQuote: string;
    aheadOfQuote: string;
    matchesQuote: string;
    fromFiled: string;
    underQuote: string;
    overQuote: string;
    averageOnly: string;
  };
  payslips: {
    kicker: string;
    title: string;
    lead: string;
    openAnalysis: string;
    profile: string;
    loading: string;
    emptyTitle: string;
    emptyBody: string;
    towardVerified: string;
    insurableWeeks: string;
    week: string;
    derived: string;
    weekNotAssigned: string;
    needsReview: string;
    loadError: string;
  };
  form: {
    kicker: string;
    title: string;
    lead: string;
    putHere: string;
    putHereHelp: string;
    chooseFile: string;
    reading: string;
    attached: string;
    notStored: string;
    photoAlt: string;
    afterFile: string;
    whoWhen: string;
    paymentDate: string;
    employer: string;
    employerPlaceholder: string;
    periodStart: string;
    periodEnd: string;
    frequency: string;
    freqUnknown: string;
    freqWeekly: string;
    freqFortnightly: string;
    freqLunar: string;
    freqMonthly: string;
    employmentWeeks: string;
    employmentWeeksPlaceholder: string;
    weekNumber: string;
    weekPlaceholder: string;
    basicOt: string;
    basicHours: string;
    basicRate: string;
    basicPay: string;
    overtimeHours: string;
    overtimeRate: string;
    overtimePay: string;
    holidayPay: string;
    totals: string;
    gross: string;
    net: string;
    cumulativeGross: string;
    cumulativeTax: string;
    cumulativePrsi: string;
    cumulativeUsc: string;
    cumulativePension: string;
    ytdWeeks: string;
    allowances: string;
    deductions: string;
    addLine: string;
    remove: string;
    allowancePlaceholder: string;
    deductionPlaceholder: string;
    deductionHelp: string;
    check: string;
    checking: string;
    duplicate: string;
    saveError: string;
    readError: string;
    fileRead: string;
  };
  detail: {
    kicker: string;
    paid: string;
    employerMissing: string;
    printedWeek: string;
    deleting: string;
    deleteSlip: string;
    deleteError: string;
    netOnSlip: string;
    gross: string;
    basicPay: string;
    overtimePay: string;
    insurableWeeks: string;
    hoursRates: string;
    hoursHelp: string;
    onDocument: string;
    notOnDocument: string;
    derived: string;
    allowances: string;
    deductions: string;
    noneEntered: string;
    needsReview: string;
    anomalyTitle: string;
    anomalyLead: string;
    noAnomalies: string;
    checks: string;
    checksLead: string;
    noChecks: string;
    back: string;
    expectedTitle: string;
    expectedLead: string;
    actualGross: string;
    expectedGross: string;
    variance: string;
    fact: string;
    inference: string;
    unknown: string;
    weekOf: string;
    derivedNotPrinted: string;
    notCalculated: string;
  };
  companies: {
    kicker: string;
    title: string;
    lead: string;
    search: string;
    searchPlaceholder: string;
    equipment: string;
    sort: string;
    allEquipment: string;
    curtain: string;
    reefer: string;
    flatbed: string;
    tanker: string;
    specialized: string;
    sortName: string;
    sortReports: string;
    sortPay: string;
    sortCounty: string;
    none: string;
    noneHint: string;
  };
  analysis: {
    kicker: string;
    title: string;
    lead: string;
  };
  profile: {
    kicker: string;
    title: string;
    lead: string;
  };
  compare: {
    kicker: string;
    title: string;
    lead: string;
    comparing: string;
    clear: string;
    open: string;
  };
  rankings: {
    kicker: string;
    title: string;
    lead: string;
  };
  privacy: {
    kicker: string;
    title: string;
    p1: string;
    p2: string;
    l1: string;
    l2: string;
    l3: string;
    l4: string;
    l5: string;
    p3: string;
    p4: string;
    p5: string;
    p6: string;
    openWorkspace: string;
  };
  wipe: {
    label: string;
    wiping: string;
  };
  notFound: {
    title: string;
    body: string;
    browse: string;
  };
};

export const en: Messages = {
  language: { label: "Language" },
  nav: {
    myTruckPay: "My TruckPay",
    companies: "Companies",
    analysis: "Analysis",
    compare: "Compare",
    addPayslip: "Add a payslip",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  footer: {
    tagline:
      "TruckPay understands your payslip, so you don’t have to. Ireland first. Private payroll and company intelligence grow together — never invented reviews.",
    myTruckPay: "My TruckPay",
    privatePayslips: "Private payslips",
    payrollAnalysis: "Payroll analysis",
    employmentProfile: "Employment profile",
    privacy: "Privacy",
    faq: "FAQ",
    companies: "TruckPay Companies",
    directory: "Haulier directory",
    gaps: "Driver-reported gaps",
    compare: "Side-by-side compare",
    publicSlip: "File a public slip",
    listFirm: "List your firm",
    laterPhase: "Company accounts and recruiters are a later phase. They will never see a driver’s private slips.",
  },
  home: {
    kicker: "Ireland · My TruckPay + Companies",
    headline: "TruckPay understands your payslip, so you don’t have to.",
    lead: "Check each new Irish haulage slip privately. Three unique payslips unlock verified analysis. A payment is not assumed to be one week. Company intelligence is aggregated separately — never invented reviews, never your identity on the board.",
    searchPlaceholder: "Search Nolan, Cork, reefer…",
    searchCompanies: "Search companies",
    addPayslip: "Add a payslip",
    exploreCompanies: "Explore companies",
    publicSlip: "File a public slip",
    listFirm: "List your firm",
    hauliersListed: "Hauliers listed",
    driverStubs: "Driver-reported stubs",
    avgGap: "Avg. quote gap",
    boardEmpty: "The board is empty until someone files",
    widestGapOnFile: "Widest quote gap on file",
    widestGap: "Widest gap",
    noneYet: "None yet",
    needsQuotedSlip: "Needs a slip that includes what they quoted",
    underQuoted: "{percent}% under the quoted weekly",
    highestTakeHome: "Highest take-home on file",
    avgFiled: "{amount} average from filed slips",
    firstSlipSets: "The first Irish slip sets this line",
    hauliers: "Hauliers",
    onTheBoard: "{count} on the board",
    publicHqOnly: "Public HQ, lanes and fleet notes only — no invented reviews",
    gapsTitle: "Gaps from filed slips",
    hauliersTitle: "Irish hauliers on the board",
    gapsDetail: "Sorted by quoted weekly versus take-home, using only slips drivers filed here.",
    hauliersDetail: "These files show what the firms publish about themselves. Pay appears when drivers file it.",
    fullRanking: "Full ranking",
    openDirectory: "Open directory",
    step1Title: "My TruckPay",
    step1Body: "Type each new slip. Three unique payslips, with dates and periods, unlock verified analysis. One slip is not assumed to be one week.",
    step2Title: "TruckPay Companies",
    step2Body: "Explore hauliers with public facts plus two evidence levels: driver reported, and payroll verified from real slips. Medians need sample size. Never a single ‘company salary’.",
    step3Title: "Later: firms and recruiters",
    step3Body: "Company accounts are not built yet. When they are, they will never see a driver’s private payslips, history or identity.",
    checkPayslip: "Check a payslip",
  },
  access: {
    locked: "{have} of {need} distinct payslips toward verified analysis. The haulier directory stays public.",
    unlocked: "Verified payroll analysis is unlocked in this browser.",
    howItWorks: "How My TruckPay works",
    openAnalysis: "Open analysis",
    addPayslip: "Add a payslip",
  },
  stub: {
    irelandWeekly: "Ireland · weekly settlement",
    noSlips: "No slips on the board yet",
    noInvent: "TruckPay does not invent reviews or take-home figures. The first Irish driver to file a real wage slip opens this board.",
    fileFirst: "File the first slip",
    weeklySettlement: "Weekly settlement",
    slip: "slip",
    slips: "slips",
    quotedWeekly: "Quoted weekly",
    driversClear: "Drivers actually clear",
    shortOfQuote: "Short of the quote",
    aheadOfQuote: "Ahead of the quote",
    matchesQuote: "Matches the quote",
    fromFiled: "From filed slips",
    underQuote: "{percent}% under the quote",
    overQuote: "{percent}% over the quote",
    averageOnly: "Average of driver-filed slips. No invented figures.",
  },
  payslips: {
    kicker: "My TruckPay · private",
    title: "My TruckPay",
    lead: "Your personal payroll workspace. Check each new slip. Verified analysis needs three unique payslips. Nothing here is published as “the company salary”. Delete anytime.",
    openAnalysis: "Open analysis",
    profile: "Employment profile",
    loading: "Loading your slips…",
    emptyTitle: "No payslips on this device yet",
    emptyBody: "Check the first of three unique slips. It is not posted to the public board.",
    towardVerified: "{have} of {need} unique slips toward TruckPay Verified Analysis. Duplicates are rejected. One slip is not one week.",
    insurableWeeks: "{count} insurable week(s)",
    week: "week {n}",
    derived: "(derived)",
    weekNotAssigned: "week not assigned",
    needsReview: "needs review",
    loadError: "Payslips could not be loaded.",
  },
  form: {
    kicker: "From the slip · not from memory of the week",
    title: "Add a payslip",
    lead: "Drop the PDF or photo at the top of the form. Then check the figures. Do not type a PPSN, licence or employee number. TruckPay does not assume one slip is one working week.",
    putHere: "Put your payslip here",
    putHereHelp: "Drop a PDF or a photo, or choose a file. TruckPay reads it and discards it — it is not stored.",
    chooseFile: "Choose PDF or photo",
    reading: "Reading…",
    attached: "Attached: {name}",
    notStored: "Not stored on the server",
    photoAlt: "Payslip photo you attached. Not stored on the server.",
    afterFile: "After the file, check the boxes below. Leave a box blank if it is not printed — TruckPay will store null and will not guess. TruckPay Verified Analysis needs your latest three unique payslips. A payslip is not assumed to be one week.",
    whoWhen: "Who and when",
    paymentDate: "Payment date",
    employer: "Employer as printed",
    employerPlaceholder: "Leave blank if not on the slip",
    periodStart: "Period start",
    periodEnd: "Period end",
    frequency: "Pay frequency as printed",
    freqUnknown: "Not stated on the slip",
    freqWeekly: "Weekly",
    freqFortnightly: "Fortnightly",
    freqLunar: "Lunar (4 weeks)",
    freqMonthly: "Monthly",
    employmentWeeks: "Employment / insurable weeks on this slip",
    employmentWeeksPlaceholder: "May be more than 1",
    weekNumber: "Week number as printed",
    weekPlaceholder: "Leave blank if not shown",
    basicOt: "Basic and overtime",
    basicHours: "Basic hours",
    basicRate: "Basic rate (€)",
    basicPay: "Basic pay (€)",
    overtimeHours: "Overtime hours",
    overtimeRate: "Overtime rate (€)",
    overtimePay: "Overtime pay (€)",
    holidayPay: "Holiday pay (€)",
    totals: "Gross, net, year to date",
    gross: "Gross pay (€)",
    net: "Net pay (€)",
    cumulativeGross: "Cumulative gross (€)",
    cumulativeTax: "Cumulative tax (€)",
    cumulativePrsi: "Cumulative PRSI (€)",
    cumulativeUsc: "Cumulative USC (€)",
    cumulativePension: "Cumulative pension (€)",
    ytdWeeks: "Total insurable weeks (YTD)",
    allowances: "Allowances",
    deductions: "Deductions",
    addLine: "Add line",
    remove: "Remove",
    allowancePlaceholder: "e.g. Night out, subsistence",
    deductionPlaceholder: "e.g. PAYE, PRSI, uniform",
    deductionHelp: "Copy the label exactly as printed. Unknown labels stay unknown and are flagged for review. TruckPay will not mark a deduction as illegal.",
    check: "Check this payslip",
    checking: "Checking…",
    duplicate: "That payslip looks like one you already entered (same dates and totals).",
    saveError: "Could not save the payslip.",
    readError: "Could not read that file.",
    fileRead: "File read. The original was not stored.",
  },
  detail: {
    kicker: "Private · Ireland",
    paid: "Paid {date}",
    employerMissing: "employer not on the slip",
    printedWeek: "printed week {n}",
    deleting: "Deleting…",
    deleteSlip: "Delete this slip",
    deleteError: "Could not delete this slip.",
    netOnSlip: "Net on this slip",
    gross: "Gross",
    basicPay: "Basic pay",
    overtimePay: "Overtime pay",
    insurableWeeks: "Insurable weeks",
    hoursRates: "Hours and rates",
    hoursHelp: "Figures below are from the document unless marked derived. Blank fields stay blank — TruckPay does not guess.",
    onDocument: "On the document",
    notOnDocument: "Not on the document",
    derived: "Derived",
    allowances: "Allowances",
    deductions: "Deductions",
    noneEntered: "None entered.",
    needsReview: "needs review",
    anomalyTitle: "Anomaly watch",
    anomalyLead: "Confirmed only with enough evidence. Otherwise TruckPay uses possible anomaly, needs review, or insufficient data. Nothing here is an accusation.",
    noAnomalies: "No anomaly flags on the figures you entered.",
    checks: "Checks",
    checksLead: "Every note is labelled Fact, Inference, or Unknown, with the figures it used. TruckPay does not accuse an employer of wrongdoing from an anomaly.",
    noChecks: "No arithmetic gaps or unknown labels on the figures you entered.",
    back: "Back to my slips",
    expectedTitle: "Expected vs actual (this week)",
    expectedLead: "Expected pay is derived from hours × rates when those figures are on the document. It is never presented as a printed payslip amount.",
    actualGross: "Actual gross (source)",
    expectedGross: "Expected gross (derived)",
    variance: "Variance",
    fact: "Fact",
    inference: "Inference",
    unknown: "Unknown",
    weekOf: "Week {n} of {year}",
    derivedNotPrinted: "Derived — not printed as a week number",
    notCalculated: "Not calculated",
  },
  companies: {
    kicker: "TruckPay Companies · Ireland",
    title: "Haulier directory",
    lead: "Public facts from the operator’s own site. Pay intelligence is split: driver-reported stubs are not the same as payroll-verified medians from My TruckPay. TruckPay will not invent a company salary.",
    search: "Search",
    searchPlaceholder: "Haulier, county, or lane",
    equipment: "Equipment",
    sort: "Sort",
    allEquipment: "All equipment",
    curtain: "Curtain / box",
    reefer: "Reefer",
    flatbed: "Flatbed",
    tanker: "Tanker",
    specialized: "Specialized",
    sortName: "Name",
    sortReports: "Reports",
    sortPay: "Pay",
    sortCounty: "County",
    none: "No hauliers match those filters.",
    noneHint: "Try a county, or clear equipment.",
  },
  analysis: {
    kicker: "My TruckPay · latest three slips",
    title: "Payroll analysis",
    lead: "Verified analysis needs three unique payslips for the current job, with pay date and period extracted. Missing periods are warned. Duplicates are rejected. Changes versus earlier slips keep unexplained remainder unexplained. This is not an accusation of the employer.",
  },
  profile: {
    kicker: "My TruckPay · this job",
    title: "Employment profile",
    lead: "Country is Ireland for now. Do not enter a PPSN, licence or employee number. Two people at the same haulier are not assumed to do the same work.",
  },
  compare: {
    kicker: "Side by side",
    title: "Compare",
    lead: "HQ, equipment and lanes sit on one line. Driver-reported take-home appears only if drivers have filed public stubs. That is not payroll-verified company pay.",
    comparing: "Comparing {names}",
    clear: "Clear",
    open: "Open compare",
  },
  rankings: {
    kicker: "Driver reported · Ireland",
    title: "Pay gap rankings",
    lead: "Ranked only when a driver filed both take-home and the weekly figure they were quoted. This is driver-reported evidence, not payroll-verified medians. TruckPay does not invent either number.",
  },
  privacy: {
    kicker: "Data minimisation",
    title: "Privacy",
    p1: "TruckPay splits identity from payroll. You are identified by a random UUID on this device — not a PPSN, driving licence, or employee number.",
    p2: "Five layers stay separate:",
    l1: "Account / identity — the random UUID only.",
    l2: "Original documents are uploaded for extraction. Temporary OCR files are deleted after processing; originals are not retained.",
    l3: "Extracted payroll — figures you type, private to My TruckPay.",
    l4: "Normalized payroll — categories and weekly equivalents for your analysis.",
    l5: "Aggregated analytical data — medians and sample sizes for TruckPay Companies, with no driver identity. This is pseudonymised aggregation, not a claim that the dataset is anonymous.",
    p3: "Deduction labels are stored as printed. Unknown lines are flagged for review. They are never classified as illegal or as proof an employer did something wrong.",
    p4: "You can delete a single slip or wipe every payslip on this device. Driver-reported public stubs are an older, separate flow and are labelled as such. They are not payroll-verified.",
    p5: "Company and recruiter accounts are a later phase. They must never gain access to an individual driver’s private payslips, payroll history or identity through the company intelligence layer.",
    p6: "Contact details on “List your firm” are operator enquiries, not driver payroll, and are not mixed into the payslip ledger.",
    openWorkspace: "Open My TruckPay",
  },
  wipe: {
    label: "Delete my payslips on this device",
    wiping: "Wiping…",
  },
  notFound: {
    title: "That haulier is not on the board",
    body: "The company file is missing, or the link is stale. Start from the directory.",
    browse: "Browse hauliers",
  },
};
