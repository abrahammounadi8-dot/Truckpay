// Synthetic fixtures only; never import from application routes.
import { PUBLICATION_POLICY, type PublicationInput } from "../publication-policy";
import { parsePayslipInput, toStoredPayslip } from "../parse";
import { toStoredProfile } from "../profile";

export function publicationFixture(count = 10): PublicationInput {
  const users = Array.from({ length: count }, (_, i) => `synthetic-${i}`);
  return {
    employerSlug: "synthetic-firm", publicEmployerSlugs: ["synthetic-firm"],
    period: { start: "2025-01-01", end: "2025-03-31" }, frozenAt: "2025-04-15T00:00:00.000Z", history: [],
    reviewedPeople: users.map(userId => ({ userId, personKey: `reviewed-${userId}` })),
    profiles: users.map(userId => ({ ...toStoredProfile(userId, { employerSlug: "synthetic-firm" }, "2025-04-01"),
      statisticsSharing: { enabled: true, noticeVersion: PUBLICATION_POLICY.noticeVersion, updatedAt: "2025-04-02T00:00:00.000Z" },
      employmentStarts: { "synthetic-firm": { employerName: "Synthetic Firm", startMonth: "2024-07", source: "user_declared" as const, updatedAt: "2025-04-01T00:00:00.000Z" } },
    })),
    payslips: users.flatMap(userId => ["2025-01-03", "2025-01-10", "2025-01-17"].map(paymentDate => ({
      ...toStoredPayslip(userId, parsePayslipInput({ employerName: "Synthetic Firm", paymentDate, payFrequency: "weekly", grossPay: 700, netPay: 543.21, deductions: [], allowances: [] }).input!),
      createdAt: "2025-04-01T00:00:00.000Z",
    }))),
  };
}
