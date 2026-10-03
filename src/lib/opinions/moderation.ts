/** Conservative local rules, not an AI or a truth/ employment verification service. */
export type ModerationDecision = { status: 'approved'|'pending'|'rejected'; reason: string };
const ordinaryWords = new Set(`i my me the a an and but was were is are this that company employer work worked working here there experience organisation organization communication management team training schedule shifts hours good great excellent helpful respectful friendly fair poor bad terrible difficult disorganised disorganized clear unclear organised organized very not always often sometimes too long short would recommend again overall had have with at for to of in on it they treated well badly trato trabajo empresa experiencia organizacion comunicacion equipo formacion horario turnos horas bueno buena buenos buenas malo mala malos malas excelente amable respetuoso respetuosa justo justa dificil desorganizado desorganizada claro clara confuso confusa muy no siempre a veces demasiado largo larga cortos cortas recomendaria volveria mi me la el los las un una y pero fue eran es son esta este aqui he trabajado trabajar en con para de por que bien mal positiva negativo negativa positiva`.split(/\s+/));
export function moderateOpinion(body: string): ModerationDecision {
 const text=body.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
 if (/\b(buy now|crypto profit|free money|click here|compra ahora)\b/.test(text)) return {status:'rejected',reason:'spam'};
 if (/https?:|www\.|\b\S+@\S+\b|\+?\d[\d ()-]{6,}\d/.test(text)) return {status:'pending',reason:'contact_or_link'};
 if (/\b(kill|murder|hurt|threat|matar|muerte|amenaz|racis|nigger|fuck|mierda|puta)\w*/.test(text)) return {status:'pending',reason:'abuse_or_threat'};
 if (/\b(pay|paid|salary|wage|money|unpaid|fraud|stole|steal|promis|live|living|sleep|unsafe|illegal|discrimin|salario|sueldo|paga|pago|pagaron|dinero|robo|estafa|promet|viven|vivir|duerm|dormir|ilegal|discrimin|condiciones)\w*/.test(text)) return {status:'pending',reason:'sensitive_claim'};
 // Publish only short, ordinary ES/EN work-experience language. Unknown wording and
 // other languages go to a person; they are never rejected for being negative.
 const words=text.match(/[a-z]+/g)??[];
 if(body.length<=500 && words.length>=4 && /^[a-z\s.,!?'’-]+$/.test(text) && words.every(word=>ordinaryWords.has(word))) return {status:'approved',reason:'ordinary_experience'};
 return {status:'pending',reason:'manual_review'};
}
export function moderatorAllowed(id: string, configured = process.env.MTP_OPINION_MODERATOR_IDS ?? '') {
 return configured.split(',').map(value=>value.trim()).filter(Boolean).includes(id);
}
