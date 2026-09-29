import { emailLogoPng } from "./email-logo";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

/** No external images, tracking pixels, account details or payroll data. */
export function accessEmailTemplate(url: string, production = false) {
  const href = escapeHtml(url);
  const result = {
    subject: "MyTruckPay",
    text: `MyTruckPay · Acceso a tus nóminas / Access your payslips\n\nMyTruckPay te ayuda a consultar y organizar las nóminas que guardas, por empresa y fecha.\nMyTruckPay helps you view and organise the payslips you save, by employer and date.\n\nPrueba local / Local test\nAbre este enlace en el mismo ordenador donde MyTruckPay está arrancado. Caduca en 10 minutos y solo se puede usar una vez.\nOpen this link on the computer running MyTruckPay. It expires in 10 minutes and can only be used once.\n\n${url}\n\nEste correo no incluye tus nóminas. No compartas el enlace: permite acceder a tu cuenta. Si no lo solicitaste, ignora este correo.\nThis email does not include your payslips. Do not share the link: it grants access to your account. If you did not request it, ignore this email.`,
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso a MyTruckPay</title></head>
<body style="margin:0;background:#f2f4f6;color:#1e2a3a;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e6eb;border-radius:12px">
<tr><td style="padding:24px;background:#1e2a3a;border-radius:12px 12px 0 0">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="cid:mtp-brand" width="44" height="44" alt="Camión MyTruckPay" style="display:block;border:0"></td><td style="padding-left:10px"><div style="color:#e2b14a;font-size:11px;line-height:14px;font-weight:bold;letter-spacing:0.5px">MTP</div><div style="padding-top:3px;color:#ffffff;font-size:24px;line-height:26px;font-weight:bold">MyTruckPay</div></td></tr></table>
</td></tr>
<tr><td style="padding:28px 24px">
<p style="margin:0 0 12px;font-size:12px;font-weight:bold;color:#66501f;letter-spacing:1px">PRUEBA LOCAL · LOCAL TEST</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.2">Tus nóminas, a mano.</h1>
<p style="margin:0 0 22px;font-size:16px;line-height:1.6">Consulta y organiza las nóminas que guardas en MyTruckPay, por empresa y fecha.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td bgcolor="#e2b14a" style="border-radius:6px"><a href="${href}" style="display:inline-block;padding:16px 22px;font-size:16px;font-weight:bold;color:#1e2a3a;text-decoration:none">Entrar en MyTruckPay / Sign in</a></td></tr></table>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6"><span aria-hidden="true">&#128273;</span> <b>Acceso personal.</b> Abre el enlace en el ordenador donde está funcionando MyTruckPay.</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6"><span aria-hidden="true">&#9201;</span> <b>10 minutos · un solo uso.</b> El enlace caduca después de ese plazo.</p>
<p style="margin:0 0 22px;font-size:14px;line-height:1.6"><span aria-hidden="true">&#128196;</span> <b>Tus documentos.</b> Este correo no incluye tus nóminas. No compartas el enlace: permite acceder a tu cuenta.</p>
<div lang="en" style="border-top:1px solid #e2e6eb;padding-top:18px;font-size:13px;line-height:1.6;color:#485566"><b>Access your payslips.</b> MyTruckPay helps you view and organise the payslips you save, by employer and date. Open the link on the computer running MyTruckPay. It expires in 10 minutes and can only be used once. This email does not include your payslips. Do not share the link: it grants access to your account.</div>
<p style="font-size:12px;line-height:1.6;color:#485566">Si el botón no funciona, copia este enlace. / If the button does not work, copy this link:</p>
<p style="font-size:12px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere"><a href="${href}" style="color:#1e2a3a">${href}</a></p>
</td></tr><tr><td style="padding:20px 24px;background:#f7f8fa;border-radius:0 0 12px 12px;font-size:12px;line-height:1.6;color:#485566">Si no solicitaste este acceso, ignora el mensaje.<br><span lang="en">If you did not request this, ignore this email.</span><br><b>MyTruckPay · Ireland</b></td></tr>
</table></td></tr></table></body></html>`,
    attachments: [{ filename: "mytruckpay.png", content_type: "image/png", content_id: "mtp-brand", content: emailLogoPng }],
  };
  if (production) {
    result.text = result.text.replace("Prueba local / Local test", "Acceso seguro / Secure sign-in").replace("Abre este enlace en el mismo ordenador donde MyTruckPay está arrancado.", "Abre este enlace para entrar en MyTruckPay.").replaceAll("Open this link on the computer running MyTruckPay.", "Open this link to sign in to MyTruckPay.");
    result.html = result.html.replace("PRUEBA LOCAL · LOCAL TEST", "MYTRUCKPAY").replaceAll("Abre el enlace en el ordenador donde está funcionando MyTruckPay.", "Abre el enlace para entrar en MyTruckPay.").replaceAll("Open the link on the computer running MyTruckPay.", "Open the link to sign in to MyTruckPay.");
  }
  return result;

}
