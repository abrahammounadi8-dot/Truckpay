import { STATISTICS_REVIEW_RULES } from "@/lib/payroll/statistics-sharing";

export function StatisticsReviewNotice({ spanish }: { spanish: boolean }) {
  const { minimumPeoplePerCell, intervalEuros } = STATISTICS_REVIEW_RULES;
  return <div className="space-y-3 text-sm">
    <p>{spanish
      ? "Esta autorización es solo para preparar y revisar propuestas internas. No autoriza publicar tus datos. La publicación sigue en pausa; antes de activarla se solicitaría una autorización de publicación separada."
      : "This permission is only for preparing and reviewing internal proposals. It does not authorise publication of your data. Publication remains paused; separate publication permission would be requested before it is enabled."}</p>
    <p>{spanish
      ? `La propuesta usa el neto de tres nóminas consecutivas válidas de un trimestre cerrado, agrupado por empresa, frecuencia de pago y antigüedad declarada en esas fechas. Se ensayan intervalos de ${intervalEuros} EUR para la mediana, con un mínimo de ${minimumPeoplePerCell} personas revisadas en cada grupo. No incluye nóminas individuales, importes exactos ni recuentos públicos.`
      : `The proposal uses net pay from three valid consecutive payslips in a closed quarter, grouped by company, pay frequency and declared tenure at those dates. It tests ${intervalEuros} EUR median intervals with at least ${minimumPeoplePerCell} reviewed people in each group. It includes no individual payslips, exact amounts or public sample counts.`}</p>
    <p>{spanish
      ? "La revisión puede usar tus nóminas guardadas actuales y futuras mientras mantengas esta elección. Verificar un correo no demuestra que sea una persona distinta; las cuentas pendientes de esa revisión no se incluyen. No necesitas enviar documentos de identidad para marcar esta preferencia."
      : "The review may use your existing and future saved payslips while this choice remains enabled. A verified email does not establish a distinct person; accounts awaiting that review are excluded. You do not need to send identity documents to select this preference."}</p>
    <p>{spanish
      ? "Puedes retirar la autorización aquí sin perder tu análisis privado. La retirada excluye futuras preparaciones e invalida las revisiones pendientes afectadas. No recalculamos ni publicamos automáticamente un resultado al retirar un permiso. Conservamos el historial interno mínimo de revisiones para evitar reutilizar participantes; puedes consultar sobre su conservación o supresión en privacy@mytruckpay.com."
      : "You can withdraw here without losing private analysis. Withdrawal excludes future preparations and invalidates affected pending reviews. We do not automatically recalculate or publish a result after withdrawal. We retain the minimum internal review history to avoid reusing participants; contact privacy@mytruckpay.com about its retention or deletion."}</p>
  </div>;
}
