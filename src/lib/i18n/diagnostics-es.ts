import { interpolate } from "./lookup";
type DiagnosticTranslation = readonly [source: string, target: string, translated?: readonly string[]];
export const diagnosticSpanish: readonly DiagnosticTranslation[] = [
  [
    "Gross pay is present but basic hours are recorded as zero, with no overtime, allowances or holiday pay on file. This may be a salary slip or incomplete extraction — not confirmed as missing hours.",
    "Hay salario bruto, pero las horas base figuran como cero y no constan horas extra, complementos ni vacaciones. Puede ser un salario fijo o una extracción incompleta; no confirma horas sin pagar."
  ],
  [
    "The hourly rate on this slip differs from the rate on a document-backed employment profile. Rates change for many lawful reasons. This is not confirmed as an incorrect rate.",
    "La tarifa por hora difiere de la indicada en un perfil laboral basado en documentos. Puede cambiar por distintos motivos legítimos; no se confirma que sea incorrecta."
  ],
  [
    "A profile rate exists but is not document-verified, so a rate difference is not treated as an anomaly.",
    "Hay una tarifa en el perfil, pero no está verificada documentalmente. La diferencia no se considera una anomalía."
  ],
  [
    "Overtime hours are present but overtime rate and overtime pay are not. Unpaid overtime cannot be confirmed.",
    "Constan horas extra, pero no su tarifa ni su importe. No se puede confirmar que estén sin pagar."
  ],
  [
    "Overtime hours are present and the overtime rate or overtime pay is recorded as zero. This may be unpaid overtime, a blended rate, or a line held elsewhere. Not confirmed.",
    "Constan horas extra con tarifa o importe cero. Podrían estar sin pagar, incluidas en una tarifa conjunta o en otra línea. No está confirmado."
  ],
  [
    "Deduction “{label}” is kept as written and needs review. It is not classified as incorrect or unlawful.",
    "La deducción «{label}» se conserva tal como está escrita y requiere revisión. No se clasifica como incorrecta ni ilegal."
  ],
  [
    "The basic hourly rate differs from the previous slip for the same employer. This is a difference, not a confirmed error.",
    "La tarifa base por hora difiere de la nómina anterior de la misma empresa. Se observa una diferencia, no un error confirmado."
  ],
  [
    "This payslip matches another stored slip (same dates and totals). Duplicate content is confirmed.",
    "Esta nómina coincide con otra guardada en fechas e importes. Se confirma que el contenido está duplicado."
  ],
  [
    "Irish tax weeks {weeks} of {year} are not on file between week {start} and week {end}. A gap is not confirmed as unpaid work — the driver may not have worked those weeks.",
    "No constan las semanas fiscales irlandesas {weeks} de {year}, entre las semanas {start} y {end}. Esto no confirma trabajo sin pagar: el conductor podría no haber trabajado esas semanas."
  ],
  [
    "Pay periods are missing on one or more slips, so missing weeks cannot be confirmed from dates.",
    "Faltan períodos de pago en una o más nóminas; las fechas no permiten confirmar semanas ausentes."
  ],
  [
    "Two slips for the same employer have overlapping pay periods and different gross pay. This needs a check; it is not confirmed as an error.",
    "Dos nóminas de la misma empresa tienen períodos solapados e importes brutos distintos. Requiere revisión; no es un error confirmado."
  ],
  [
    "This payslip is not treated as a single working week. Payment may cover more than one week, a lunar/monthly cycle, or more than one insurable week.",
    "Esta nómina no se trata como una sola semana de trabajo. Puede cubrir varias semanas, un ciclo de cuatro semanas o mensual, o varias semanas cotizadas."
  ],
  [
    "Gross minus the listed deductions does not equal net. A line may be missing, grouped, or labelled differently on the provider’s slip. This is not a finding of wrongdoing.",
    "El bruto menos las deducciones indicadas no coincide con el neto. Puede faltar una línea, estar agrupada o tener otra etiqueta. Esto no demuestra una actuación indebida."
  ],
  [
    "Deduction “{label}” is kept as written and flagged for review. It is not classified as incorrect or unlawful.",
    "La deducción «{label}» se conserva tal como está escrita y se marca para revisión. No se clasifica como incorrecta ni ilegal."
  ],
  [
    "The basic hourly rate on this slip differs from the previous slip for the same listed firm. Rates change for many lawful reasons. This is a difference, not an accusation.",
    "La tarifa base por hora difiere de la nómina anterior de la misma empresa. Puede cambiar por motivos legítimos. Es una diferencia, no una acusación."
  ],
  [
    "“{label}” also appeared on the previous slip. Recurring lines are noted so you can check them. Repetition is not proof of an error.",
    "«{label}» también figuraba en la nómina anterior. Se señala su repetición para que la compruebes; repetirse no demuestra un error."
  ],
  [
    "“{label}” did not appear on the previous slip. It is flagged as new so you can check it. A new line is not classified as illegal.",
    "«{label}» no figuraba en la nómina anterior. Se marca como nueva para que la revises; una línea nueva no se considera ilegal."
  ],
  [
    "{kind} hours × rate does not equal the {payKind} pay figure on this slip. That can be rounding, a blended rate, holiday pay, or a line that sits elsewhere. MyTruckPay does not treat this as employer wrongdoing.",
    "Las horas de {kind} multiplicadas por la tarifa no coinciden con el importe de {payKind}. Puede deberse al redondeo, una tarifa conjunta, vacaciones u otra línea. MyTruckPay no lo considera prueba de una actuación indebida.",
    [
      "kind",
      "payKind"
    ]
  ],
  [
    "This slip cannot be turned into a weekly equivalent without assuming it is one working week, so the change versus earlier slips is unknown.",
    "No se puede calcular el equivalente semanal sin asumir que la nómina cubre una semana. Por ello, se desconoce el cambio frente a las anteriores."
  ],
  [
    "On a weekly-equivalent basis this slip is {amount} {direction} your recent median from {count} earlier {documents} ({latest} vs {median}). That is a difference on the figures, not a finding of underpayment.",
    "En equivalentes semanales, esta nómina está {amount} {direction} tu mediana reciente de {count} {documents} anteriores ({latest} frente a {median}). Es una diferencia numérica, no una confirmación de pago insuficiente.",
    [
      "direction",
      "documents"
    ]
  ],
  [
    "Not enough gross figures on this slip and earlier slips to compare weekly equivalents. MyTruckPay will not invent the missing numbers.",
    "Faltan importes brutos en esta nómina o en las anteriores para comparar equivalentes semanales. MyTruckPay no inventará los datos que faltan."
  ],
  [
    "{amount} is explained by {direction} paid basic hours on a weekly-equivalent basis ({hours} vs {prior} hours × {rate} on this slip). Hours are taken from the slip; a longer period is not treated as one week.",
    "{amount} se explican por {direction} horas base pagadas en equivalentes semanales ({hours} frente a {prior} horas × {rate}). Se usan las horas de la nómina; un período más largo no se trata como una sola semana.",
    [
      "direction"
    ]
  ],
  [
    "Hours cannot currently explain the change: basic hours or the basic rate were missing, or could not be turned into a weekly equivalent without assuming one slip is one week.",
    "Las horas no permiten explicar el cambio: faltan horas base o su tarifa, o no se puede calcular el equivalente semanal sin asumir que una nómina es una semana."
  ],
  [
    "{amount} cannot currently be explained from hours and the basic rate. MyTruckPay does not invent a cause, and does not treat an unexplained remainder as employer wrongdoing.",
    "{amount} no se pueden explicar con las horas y la tarifa base. MyTruckPay no inventa una causa ni considera el resto sin explicar como prueba de una actuación indebida."
  ],
  [
    "After hours × basic rate, nothing material remains unexplained on a weekly-equivalent basis. Other lines (overtime, allowances, deductions) were not used as invented causes.",
    "Tras considerar horas × tarifa base, no queda una diferencia importante sin explicar en equivalentes semanales. No se han atribuido causas inventadas a horas extra, complementos o deducciones."
  ],
  [
    "The basic hourly rate on this slip ({latest}) differs from the previous slip ({prior}). Rate changes happen for many lawful reasons; this is a difference, not an accusation.",
    "La tarifa base por hora de esta nómina ({latest}) difiere de la anterior ({prior}). Las tarifas pueden cambiar por motivos legítimos; es una diferencia, no una acusación."
  ],
  [
    "“{label}” did not appear on the previous slip for this employer. It is flagged as new so you can check it. A new line is not classified as illegal.",
    "«{label}» no figuraba en la nómina anterior de esta empresa. Se marca como nueva para que la revises; una línea nueva no se clasifica como ilegal."
  ],
  [
    "Your basic hourly rate matches the median in the {band} band at this firm. That does not mean the work is the same ({job}).",
    "Tu tarifa base por hora coincide con la mediana del grupo de antigüedad {band} en esta empresa. Eso no significa que el trabajo sea el mismo ({job}).",
    [
      "band",
      "job"
    ]
  ],
  [
    "Your basic hourly rate is {direction} the median in the {band} band. Rate differences are one possible contributor to different take-home. They are not proof of an error, and two drivers here may not do equivalent work ({job}).",
    "Tu tarifa base por hora está {direction} la mediana del grupo de antigüedad {band}. La tarifa puede contribuir a diferencias en el neto, pero no demuestra un error. Los conductores pueden realizar trabajos distintos ({job}).",
    [
      "direction",
      "band",
      "job"
    ]
  ],
  [
    "Not enough verified peers in your tenure band to compare basic hourly rate, or your rate was not on the slips.",
    "No hay suficientes conductores con nóminas en tu grupo de antigüedad para comparar la tarifa base, o tu tarifa no figura en las nóminas."
  ],
  [
    "On these slips, weekly-equivalent basic hours are {hours}. Hours (not just the hourly rate) change gross. A longer period on one slip is not treated as a single week.",
    "Las horas base semanales equivalentes de estas nóminas son {hours}. Las horas, además de la tarifa, afectan al bruto. Un período más largo no se trata como una sola semana."
  ],
  [
    "Normal hours could not be turned into a weekly equivalent without assuming one slip is one week.",
    "No se pudieron convertir las horas normales a un equivalente semanal sin asumir que una nómina es una semana."
  ],
  [
    "Week classification for this country is not implemented. The week is not guessed.",
    "La clasificación de semanas de este país todavía no está implementada. No se adivina la semana."
  ],
  [
    "This payslip covers more than one week (frequency, insurable weeks, or period length). It is not assigned to a single week.",
    "Esta nómina cubre más de una semana según su frecuencia, semanas cotizadas o período. No se asigna a una sola semana."
  ],
  [
    "Pay period dates are present but could not be read as calendar dates. The week is not guessed.",
    "Constan fechas del período, pero no se han podido interpretar como fechas válidas. No se adivina la semana."
  ],
  [
    "Derived Irish tax week {week} of {year} because the pay period sits inside that week. This week number was not printed on the slip.",
    "Se calcula la semana fiscal irlandesa {week} de {year} porque el período está dentro de ella. Este número no estaba impreso en la nómina."
  ],
  [
    "The pay period spans more than one Irish tax week. MyTruckPay does not pick a week. Enter the week number as printed if it appears on the slip.",
    "El período abarca varias semanas fiscales irlandesas. MyTruckPay no elige una. Si la nómina indica un número de semana, cópialo tal como aparece."
  ],
  [
    "Derived Irish tax week {week} of {year} from the pay period start only. Period end was not on the document.",
    "Se calcula la semana fiscal irlandesa {week} de {year} solo con el inicio del período. El documento no indica la fecha final."
  ],
  [
    "Derived Irish tax week {week} of {year} from the pay period end only. Period start was not on the document.",
    "Se calcula la semana fiscal irlandesa {week} de {year} solo con el final del período. El documento no indica la fecha inicial."
  ],
  [
    "A week number is printed on the document but the calendar year is ambiguous around the year boundary. The year is not guessed.",
    "El documento indica la semana, pero el año es ambiguo por estar cerca del cambio de año. No se adivina el año."
  ],
  [
    "Week {week} is printed on the document, but the slip also looks like it covers more than one week. Stored as printed; not treated as a single-week total.",
    "El documento indica la semana {week}, pero parece cubrir varias semanas. Se conserva el número impreso sin tratar el importe como el total de una sola semana."
  ],
  [
    "Week {week} of {year} as printed on the document.",
    "Semana {week} de {year}, según el documento."
  ],
  [
    "Actual gross differs from derived expected gross. Difference is not classified as employer wrongdoing.",
    "El bruto real difiere del bruto esperado calculado. La diferencia no se considera una actuación indebida de la empresa."
  ],
  [
    "Derived from source hours × rates plus listed allowances. Holiday pay printed on the slip is included. This figure was not printed on the payslip.",
    "Calculado con horas × tarifas más los complementos indicados. Incluye el pago de vacaciones que figura en la nómina. El resultado no estaba impreso en ella."
  ],
  [
    "Derived from source hours × rates plus listed allowances. Holiday pay was not a separate printed figure and is not assumed. This figure was not printed on the payslip.",
    "Calculado con horas × tarifas más los complementos indicados. No consta un importe separado de vacaciones y no se presupone. El resultado no estaba impreso en la nómina."
  ],

  [
    "missing hours",
    "Horas ausentes"
  ],
  [
    "incorrect hourly rate",
    "Tarifa por hora incorrecta"
  ],
  [
    "unpaid overtime",
    "Horas extra sin pagar"
  ],
  [
    "unexpected deduction",
    "Deducción inesperada"
  ],
  [
    "duplicate payslip",
    "Nómina duplicada"
  ],
  [
    "missing week",
    "Semana ausente"
  ],
  [
    "payslip inconsistency",
    "Incoherencia entre nóminas"
  ],
  [
    "statutory",
    "Deducción legalmente obligatoria"
  ],
  [
    "non statutory",
    "Deducción no obligatoria por ley"
  ]

];
const terms: Record<string, string> = {
  Basic: "salario base", basic: "salario base", Overtime: "horas extra", overtime: "horas extra",
  above: "por encima de", below: "por debajo de", "the same as": "igual a",
  fewer: "menos", more: "más", slip: "nómina", slips: "nóminas",
  "job, vehicle and shift not on file": "trabajo, vehículo y turno sin indicar",
};
const patterns = diagnosticSpanish.map(([source, target, translated = []]) => {
  const names: string[] = [];
  const escaped = source.split(/(\{\w+\})/g).map(part => {
    if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1,-1)); return "(.+?)"; }
    return part.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&");
  }).join("");
  return { target, translated, names, pattern: new RegExp("^" + escaped + "$") };
});
export function translateDiagnosticSpanish(text: string, translateTerm: (text: string) => string): string | null {
  for (const { target, translated, names, pattern } of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const values = Object.fromEntries(names.map((name, index) => {
      const value = match[index + 1];
      const localized = terms[value] ?? value.split(", ").map(part => terms[part] ?? translateTerm(part)).join(", ");
      return [name, translated.includes(name) ? localized : value];
    }));
    return interpolate(target, values);
  }
  return null;
}
