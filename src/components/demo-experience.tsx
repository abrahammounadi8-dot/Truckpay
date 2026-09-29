"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/language-provider";
import { SiteHeader } from "@/components/site-header";
import { demoCopy, historyCopy } from "@/lib/entry-copy";
import { localeMeta } from "@/lib/i18n";

// This module uses only invented fixtures and component state. It does not read
// or write the payroll/report APIs, browser storage, or real company records.
const names = ["Transportes Demo", "Demo Logistics", "Demo Freight", "Demo Haulage"];
const current = [{ date:"2026-09-04", net:650 }, { date:"2026-09-11", net:680 }, { date:"2026-09-18", net:660 }];
const previous = [{ date:"2026-08-21", net:620 }, { date:"2026-08-28", net:640 }];
type Slip = typeof current[number];
const views = ["slips", "home", "payslips", "companies", "analysis", "compare", "company"];
const url = (view:string) => `/demo?view=${view}`;

export function DemoExperience({view, query, company}:{view:string;query:string;company:string}) {
  const { locale, t } = useT();
  const d=demoCopy[locale]; const h=historyCopy[locale];
  const page=views.includes(view)?view:"slips";
  const [count,setCount]=useState(3);
  const money=(amount:number)=>new Intl.NumberFormat(locale,{style:"currency",currency:"EUR"}).format(amount);
  const date=(value:string)=>new Intl.DateTimeFormat(locale,{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));
  function renderHistory({name,slips,active}:{name:string;slips:Slip[];active:boolean}) {
    return <article className="mtp-history-card">
      <p className="mtp-history-status">{h[active?1:2]}</p><h3>{name}</h3>
      <p>{h[12]}: {date(active?"2026-09-01":"2026-06-01")} — {active?h[13]:date("2026-08-31")}</p>
      <p>{slips.length} {h[3]}</p><p>{h[4]}: {date(slips[slips.length-1].date)}</p>
      <details><summary>{h[14]}</summary><ul>{slips.map(s=><li key={s.date}><span>{date(s.date)}</span><strong>{money(s.net)}</strong></li>)}</ul></details>
    </article>;
  }
  function renderSlipPaper() {
    return <div className="mtp-off-paper"><p>{d[12]}</p><p className="mtp-off-amount">3 / 3</p><p>{d[3]}</p>
      {current.map((s,i)=><div key={s.date} className="mtp-off-paper-row"><span>{d[4+i]}</span><strong>{money(s.net)}</strong></div>)}
    </div>;
  }
  function renderCards({filter=""}:{filter?:string}) {
    const filtered=names.filter(n=>n.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
    return <div className="mtp-off-cards">{filtered.map(name=><article key={name} className="mtp-off-card"><h3>{name}</h3><p>{d[0]}</p><p>{t("home.hauliersDetail")}</p><Link className="mtp-off-card-link" href={`${url("company")}&company=${encodeURIComponent(name)}`}>{t("nav.companies")} →</Link></article>)}{!filtered.length&&<p>{t("home.noneYet")}</p>}</div>;
  }
  return <div className={`mtp-experience mtp-demo ${page!=="slips"?"mtp-expanded":""}`} lang={localeMeta[locale].htmlLang}>
    <div className="mtp-window">
      <SiteHeader key={page} demoView={page}/>
      {page==="slips" ? <div className="mtp-content">
        <p className="mtp-kicker">{d[0]}</p><h2>{d[1]}</h2><p className="mtp-lead">{d[2]}</p>{renderSlipPaper()}
        <Link className="mtp-main" href={url("home")}>{d[8]}</Link><Link href="/" className="mtp-demo-back">{d[9]}</Link>
      </div> : <>
        <aside className="mtp-demo-notice">{d[11]}</aside>
        {page==="home" ? <>
          <div className="mtp-off-hero"><div>
            <p className="mtp-off-kicker">{t("home.kicker")}</p><h1>{t("home.headline")}</h1><p className="mtp-off-lead">{t("home.lead")}</p>
            <form id="mtp-off-search" action="/demo"><input type="hidden" name="view" value="companies"/><input id="mtp-off-query" name="q" placeholder="Transportes Demo" aria-label={t("home.searchCompanies")}/><button className="mtp-off-primary" type="submit">{t("home.searchCompanies")}</button></form>
            <div className="mtp-off-actions"><Link className="mtp-off-primary" href={url("payslips")}>{t("home.addPayslip")}</Link><Link href={url("companies")}>{t("home.exploreCompanies")}</Link></div>
            <div className="mtp-off-stats"><div><strong>4</strong><span>{t("home.hauliersListed")}</span></div><div><strong>0</strong><span>{t("home.driverStubs")}</span></div><div><strong>—</strong><span>{t("home.avgGap")}</span></div></div>
          </div><div><p className="mtp-off-kicker">{d[0]}</p>{renderSlipPaper()}</div></div>
          <div className="mtp-off-minis"><div><small>{t("home.widestGap")}</small><h3>{t("home.noneYet")}</h3><p>{t("home.needsQuotedSlip")}</p></div><div><small>{t("home.highestTakeHome")}</small><h3>{t("home.noneYet")}</h3><p>{t("home.firstSlipSets")}</p></div><div><small>{t("home.hauliers")}</small><h3>4</h3><p>{d[0]}</p></div></div>
          <section className="mtp-off-directory"><h2>{t("home.hauliersTitle")}</h2><p>{t("home.hauliersDetail")}</p>{renderCards({})}</section>
          <section className="mtp-off-steps">{([['01','home.step1Title','home.step1Body'],['02','home.step2Title','home.step2Body'],['03','home.step3Title','home.step3Body']] as const).map(([n,title,body])=><div key={n}><small>{n}</small><h3>{t(title)}</h3><p>{t(body)}</p></div>)}</section>
        </> : <section className="mtp-off-subpage">
          <Link href="/">{d[9]}</Link>
          <h2>{page==="payslips"?t("nav.myTruckPay"):page==="analysis"?t("nav.analysis"):page==="compare"?t("nav.compare"):t("nav.companies")}</h2>
          {page==="payslips" && <><p>{h[11]}</p><div className="mtp-history-progress" aria-live="polite"><strong>{h[5]}: {count} {h[6]} 3</strong><progress max={3} value={count} aria-label={h[5]}/><p>{h[count===3?8:7]}</p></div><button type="button" onClick={()=>setCount(count===3?1:count+1)}>{h[count===3?10:9]}</button><h3 className="mtp-history-heading">{h[0]}</h3><div className="mtp-history-grid">{renderHistory({name:names[0],slips:current.slice(0,count),active:true})}{renderHistory({name:names[1],slips:previous,active:false})}</div></>}
          {page==="companies" && renderCards({filter:query})}
          {page==="company" && <article className="mtp-off-card"><h3>{names.includes(company)?company:names[0]}</h3><p>{d[0]}</p><p>{t("home.hauliersDetail")}</p><Link href={url("compare")}>{t("nav.compare")}</Link></article>}
          {page==="analysis" && <>{renderSlipPaper()}<div className="mtp-history-progress"><p>{d[13]}: <strong>{money(1990)}</strong></p><p>{d[14]}: <strong>{money(1990/3)}</strong></p></div></>}
          {page==="compare" && <div className="mtp-off-cards">{names.slice(0,2).map(name=><article className="mtp-off-card" key={name}><h3>{name}</h3><p>{d[0]}</p><p>{t("home.firstSlipSets")}</p></article>)}</div>}
        </section>}
      </>}
      <footer className="mtp-foot"><p>{h[11]}</p><Link href="/privacy" className="underline">{t("footer.privacy")} →</Link></footer>
    </div>
  </div>;
}


