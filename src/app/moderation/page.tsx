import { notFound } from 'next/navigation';
import { requireAccount } from '@/lib/payroll/session';
import { moderatorAllowed } from '@/lib/opinions/moderation';
import { ModerationQueue } from '@/components/moderation-queue';
export const dynamic='force-dynamic';
export default async function ModerationPage(){
 const id=await requireAccount();if(!moderatorAllowed(id))notFound();
 return <ModerationQueue/>;
}
