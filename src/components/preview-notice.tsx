"use client";
import Link from "next/link";
import { useT } from "./language-provider";
const copy = {
  es: ["Versión de prueba: usa solo documentos ficticios.", "El acceso depende de este navegador. Aún no hay cuenta recuperable ni acceso entre dispositivos. Las cifras se guardan en el servidor; perder la sesión no las borra.", "Privacidad y datos"],
  en: ["Test version: use synthetic documents only.", "Access depends on this browser. Recoverable accounts and cross-device access are not available yet. Figures are stored on the server; losing the session does not delete them.", "Privacy and data"],
  pl: ["Wersja testowa: używaj tylko fikcyjnych dokumentów.", "Dostęp zależy od tej przeglądarki. Odzyskiwanie konta i dostęp z innych urządzeń nie są jeszcze dostępne. Dane są na serwerze; utrata sesji ich nie usuwa.", "Prywatność i dane"],
  pt: ["Versão de teste: usa apenas documentos fictícios.", "O acesso depende deste navegador. Ainda não há recuperação de conta nem acesso entre dispositivos. Os valores ficam no servidor; perder a sessão não os apaga.", "Privacidade e dados"],
  lt: ["Bandomoji versija: naudokite tik išgalvotus dokumentus.", "Prieiga priklauso nuo šios naršyklės. Paskyros atkūrimas ir prieiga iš kitų įrenginių dar negalimi. Duomenys saugomi serveryje; praradus seansą jie neištrinami.", "Privatumas ir duomenys"],
  ro: ["Versiune de test: folosește doar documente fictive.", "Accesul depinde de acest browser. Recuperarea contului și accesul de pe alte dispozitive nu sunt încă disponibile. Datele sunt pe server; pierderea sesiunii nu le șterge.", "Confidențialitate și date"],
  ru: ["Тестовая версия: используйте только вымышленные документы.", "Доступ зависит от этого браузера. Восстановление учётной записи и доступ с других устройств пока недоступны. Данные хранятся на сервере; потеря сеанса не удаляет их.", "Конфиденциальность и данные"],
};
export function PreviewNotice() {
  const { locale } = useT();
  const [title, detail, link] = copy[locale];
  return <aside className="border-b border-border bg-muted px-4 py-3 text-sm"><div className="mx-auto max-w-6xl"><strong>{title}</strong> <span>{detail}</span> <Link className="underline" href="/privacy">{link}</Link></div></aside>;
}
