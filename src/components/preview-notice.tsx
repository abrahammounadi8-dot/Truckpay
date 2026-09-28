"use client";
import Link from "next/link";
import { useT } from "./language-provider";
const copy = {
  es: ["Versión de prueba: usa solo documentos ficticios.", "Si no verificas tu correo en Cuenta, el acceso a las nóminas depende de este navegador. Perder la sesión no borra los datos guardados en el servidor.", "Privacidad y datos"],
  en: ["Test version: use synthetic documents only.", "Without a verified email in Account, access to payslips depends on this browser. Losing the session does not delete data stored on the server.", "Privacy and data"],
  pl: ["Wersja testowa: używaj tylko fikcyjnych dokumentów.", "Bez zweryfikowanego adresu e-mail na stronie konta dostęp do pasków wypłaty zależy od tej przeglądarki. Utrata sesji nie usuwa danych z serwera.", "Prywatność i dane"],
  pt: ["Versão de teste: usa apenas documentos fictícios.", "Sem um email verificado na Conta, o acesso aos recibos depende deste navegador. Perder a sessão não apaga os dados guardados no servidor.", "Privacidade e dados"],
  lt: ["Bandomoji versija: naudokite tik išgalvotus dokumentus.", "Nepatvirtinus el. pašto paskyroje, prieiga prie algalapių priklauso nuo šios naršyklės. Praradus seansą serveryje saugomi duomenys neištrinami.", "Privatumas ir duomenys"],
  ro: ["Versiune de test: folosește doar documente fictive.", "Fără un e-mail verificat în Cont, accesul la fluturașii de salariu depinde de acest browser. Pierderea sesiunii nu șterge datele de pe server.", "Confidențialitate și date"],
  ru: ["Тестовая версия: используйте только вымышленные документы.", "Без подтверждённого адреса электронной почты в аккаунте доступ к расчётным листкам зависит от этого браузера. Потеря сеанса не удаляет данные с сервера.", "Конфиденциальность и данные"],
};
export function PreviewNotice() {
  const { locale } = useT();
  const [title, detail, link] = copy[locale];
  return <aside className="border-b border-border bg-muted px-4 py-3 text-sm"><div className="mx-auto max-w-6xl"><strong>{title}</strong> <span>{detail}</span> <Link className="underline" href="/privacy">{link}</Link></div></aside>;
}
