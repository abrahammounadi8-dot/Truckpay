import { moderatorAllowed } from "@/lib/opinions/moderation";
import { headers } from "next/headers";
import { accountReturnPath } from "@/lib/auth/return-path";
import { getProfile } from "@/lib/payroll/profile-store";
import { hasPublicPublicationConsent } from "@/lib/payroll/publication-consent";
import { readUserId } from "@/lib/payroll/session";
import { AccountPanel } from "@/components/account-panel";
import { localAuthEnabled, verifiedAccountId } from "@/lib/auth/config";
import { getLocalAuth, getDeliveryStatus } from "@/lib/auth/server";
export const metadata = { title: "My account", robots: { index: false, follow: false } };
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const callbackURL = accountReturnPath(params.next);
  const delivery = await getDeliveryStatus();
  const enabled = localAuthEnabled() && delivery.mode !== "invalid";
  const session = enabled ? await (await getLocalAuth()).api.getSession({ headers: await headers() }) : null;
  const id = verifiedAccountId(session) ? await readUserId() : null;
  const sharing = id ? hasPublicPublicationConsent(await getProfile(id)) : false;
  return <AccountPanel moderator={Boolean(id && moderatorAllowed(id))} sharesStatistics={sharing} callbackURL={callbackURL} delivery={delivery} enabled={enabled} email={id ? session!.user.email : null} failed={Boolean((await searchParams).error)} />;
}
