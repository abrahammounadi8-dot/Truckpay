import { DocumentRepository, type Queryable } from "./documents";

/** Caller must authenticate the owner and run this inside one transaction. */
export async function erasePrivateData(db: Queryable, userId: string, verifiedAccount: boolean): Promise<number> {
  const removed = await new DocumentRepository(db).wipe(userId);
  if (verifiedAccount) {
    // Include links requested from other devices, whose proposed ID is different.
    await db.query(
      `DELETE FROM truckpay_login_links WHERE proposed_user_id = $1
       OR email IN (SELECT email FROM truckpay_accounts WHERE user_id = $1)`, [userId],
    );
    // Sessions are revoked by the account foreign key's ON DELETE CASCADE.
    await db.query("DELETE FROM truckpay_accounts WHERE user_id = $1", [userId]);
  } else {
    await db.query("DELETE FROM truckpay_login_links WHERE proposed_user_id = $1", [userId]);
  }
  return removed;
}
