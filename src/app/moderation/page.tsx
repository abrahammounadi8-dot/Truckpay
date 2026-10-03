import { notFound, redirect } from 'next/navigation';
import { readUserId } from '@/lib/payroll/session';
import { moderatorAllowed } from '@/lib/opinions/moderation';
import { ModerationQueue } from '@/components/moderation-queue';
export const dynamic='force-dynamic';
export default async function ModerationPage(){
 const id=await readUserId();if(!id)redirect("/account?next=/moderation");if(!moderatorAllowed(id))notFound();
 return <ModerationQueue/>;
}
