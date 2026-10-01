import { database, usesDatabase } from '@/lib/persistence/database';
import { OpinionsRepository } from '@/lib/opinions/repository';
import type { Metadata } from 'next';
import { listDirectoryCompanies } from '@/lib/directory-store';
import { OpinionsHub } from '@/components/opinions-hub';
export const metadata:Metadata={title:'Opiniones · MyTruckPay'};
export const dynamic='force-dynamic';
export default async function OpinionsPage({searchParams}:{searchParams:Promise<{company?:string;tab?:string}>}) {
 const params=await searchParams;
 const directory=(await listDirectoryCompanies()).map(({slug,name})=>({slug,name}));
 const approved=usesDatabase()?await new OpinionsRepository(database()).companies():[];
 const companies=Array.from(new Map([...approved,...directory].map(c=>[c.slug,c])).values());
 return <OpinionsHub companies={companies} initialCompany={params.company??''} initialTab={params.tab==='platform'?'platform':'company'}/>;
}
