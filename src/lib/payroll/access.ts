/** Verified analysis needs three distinct slips. Public directory, compare and rankings stay open. */
import { redirect } from "next/navigation";
import { readUserId, requireAccount } from "./session";
import { listPayslipsForUser } from "./store";
import { getProfile } from "./profile-store";
import { comparisonAccess } from "./access-state";

export async function getComparisonAccess() {
  const id = await readUserId();
  if (!id) return comparisonAccess([]);
  const [slips, profile] = await Promise.all([listPayslipsForUser(id), getProfile(id)]);
  return comparisonAccess(slips, profile);
}
export async function requireComparisonAccess() {
  await requireAccount();
  if (!(await getComparisonAccess()).unlocked) redirect("/welcome");
}
export async function comparisonDenied() {
  const access = await getComparisonAccess();
  return access.unlocked
    ? null
    : Response.json(
        {
          error:
            "Add three consecutive payslips of the same frequency from the same employer to unlock payroll analysis.",
          code: "PAYSLIPS_REQUIRED",
          ...access,
        },
        { status: 403, headers: { "Cache-Control": "private, no-store" } },
      );
}
