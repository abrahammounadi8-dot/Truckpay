"use client";

import Link from "next/link";
import { accountCopy, accountStorageCopy } from "@/lib/auth/copy";
import { emailCopy } from "@/lib/auth/email-copy";
import { useT } from "@/components/language-provider";
import { StatisticsReviewNotice } from "./statistics-review-notice";

export function PrivacyCopy() {
  const { t, locale } = useT();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t("privacy.kicker")}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{t("privacy.title")}</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>{locale === "es" ? "Responsable del tratamiento: Ibrahim Mounadi Boujanna, persona física establecida en Irlanda que opera MyTruckPay." : "Data controller: Ibrahim Mounadi Boujanna, an individual based in Ireland operating MyTruckPay."}</p>
        {process.env.NODE_ENV !== "production" && <p>{emailCopy[locale].general}</p>}
        <div className="rounded-xl border border-border p-4 text-foreground">
          <p>{locale === "es" ? "Contacto de privacidad y solicitudes sobre tus datos: " : "Privacy contact and requests about your data: "}<a className="underline" href="mailto:privacy@mytruckpay.com">privacy@mytruckpay.com</a>.</p>
          <p className="mt-2 text-muted-foreground">{locale === "es" ? "Este correo utiliza ImprovMX para reenviar las consultas a un buzón de Google dedicado al proyecto. No envíes contraseñas ni documentos de identidad en tu primera consulta." : "This address uses ImprovMX to forward enquiries to a Google mailbox dedicated to the project. Do not send passwords or identity documents with your initial enquiry."}</p>
        </div>
        <p>{t("privacy.p2")}</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{accountStorageCopy[locale]}</li>
          <li>{locale === "es" ? "Los documentos y sus contraseñas se usan para extraer los datos. El lector no guarda el original ni la contraseña; las imágenes se envían al OCR en memoria." : "Documents and passwords are used for extraction. The reader does not retain the original or password; images are piped to OCR in memory."}</li>
          <li>{t("privacy.l3")}</li>
          <li>{t("privacy.l4")}</li>
          <li>{t("privacy.l5")}</li>
        </ol>
        <p>{locale === "es" ? "Las nuevas nóminas conservan categorías y cifras de deducciones y complementos, no sus etiquetas libres. Los registros antiguos pueden conservar etiquetas anteriores. Los formularios sin guardar no se conservan al recargar." : "New payslips retain deduction and allowance categories and amounts, not their free-text labels. Older records may retain earlier labels. Unsaved forms are not retained after reloading."}</p>
        <p>{locale === "es" ? "Puedes eliminar tu cuenta desde Mi cuenta. Se borran la identidad de acceso, las sesiones, las nóminas y el perfil de la base de datos activa. Borrar solo las nóminas y el perfil no elimina la cuenta. No prometemos borrado inmediato de copias de seguridad de proveedores." : "You can delete your account from My account. This removes the sign-in identity, sessions, payslips and profile from the active database. Deleting only payslips and the profile does not delete the account. We do not promise immediate removal from provider backups."}</p>
        <p>{locale === "es" ? "Usamos Vercel para alojar el servicio, Neon para la base de datos, Resend para enviar los enlaces de acceso y Google si conectas Gmail. El permiso de Gmail es de lectura y puede retirarse en tu cuenta de Google. Las estadísticas salariales y las empresas aportadas se publican solo con autorización de publicación vigente, incluso desde un participante. El análisis privado sigue disponible. Puedes retirar tu preferencia de participación desde Mi cuenta." : "We use Vercel for hosting, Neon for the database, Resend for sign-in emails and Google if you connect Gmail. Gmail access is read-only and can be revoked in your Google account. Salary statistics and contributed employers are published only with current publication permission, including from one contributor. Private analysis remains available. You can withdraw your sharing preference in My account."}</p>
        <p>{accountCopy[locale].deleteData}. {process.env.NODE_ENV !== "production" && accountCopy[locale].legacy}</p>
        <h2 className="text-xl font-semibold text-foreground">{locale === "es" ? "Participación voluntaria en estadísticas públicas" : "Optional public statistics"}</h2>
        <p>{locale === "es" ? "Consultar el catálogo y analizar tus nóminas no exige participar. En Mi cuenta puedes autorizar la publicación de estadísticas con este aviso, desactivada por defecto. Registramos tu elección, su fecha y la versión del aviso. Un permiso anterior no se transforma automáticamente en este permiso nuevo." : "Viewing the catalogue and analysing payslips do not require participation. In My account you can allow publication of statistics under this notice, disabled by default. We record your choice, its date and the notice version. An earlier permission is not automatically converted to this new permission."}</p>
        <StatisticsReviewNotice spanish={locale === "es"} />
        <p>{t("privacy.p5")}</p>
        <p>{t("privacy.p6")}</p>
        <h2 className="text-xl font-semibold text-foreground">{locale === "es" ? "Tus derechos" : "Your rights"}</h2>
        <p>{locale === "es" ? "Puedes solicitar acceso y una copia de tus datos, rectificación, supresión, limitación del tratamiento y, cuando corresponda, portabilidad u oposición. Escribe a privacy@mytruckpay.com desde el correo de tu cuenta. Verificaremos tu identidad de forma proporcionada, sin pedir documentación innecesaria. Respondemos normalmente en un mes; si se aplica una ampliación legal, te comunicaremos el motivo dentro de ese plazo." : "You can request access and a copy of your data, correction, erasure, restriction and, where applicable, portability or objection. Write to privacy@mytruckpay.com from your account email. We will verify your identity proportionately without requesting unnecessary documents. We normally respond within one month; if a lawful extension applies, we will explain it within that period."}</p>
        <p>{locale === "es" ? "Puedes presentar una reclamación ante la autoridad de protección de datos de tu lugar de residencia, trabajo o de la supuesta infracción, incluida la " : "You can complain to the data protection authority where you live, work or where an alleged infringement occurred, including the "}<a className="underline" href="https://www.dataprotection.ie/en/individuals/raising-concern-commission">Data Protection Commission</a>{locale === "es" ? " de Irlanda." : " in Ireland."}</p>
      </div>
      <Link href="/payslips" className="mt-8 inline-block text-sm font-medium underline">
        {t("privacy.openWorkspace")}
      </Link>
    </div>
  );
}
