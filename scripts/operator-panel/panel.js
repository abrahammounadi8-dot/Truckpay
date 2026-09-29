/* global document, location, history, fetch */
let token = location.hash.slice(1);
history.replaceState(null, '', '/');
const element = id => document.getElementById(id);
const frequencies = { weekly: 'Semanal', fortnightly: 'Quincenal', monthly: 'Mensual' };
const tenure = { '0_1': 'Menos de 1 año', '1_3': '1–3 años', '3_5': '3–5 años', '5_plus': '5 años o más' };
async function get(url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', credentials: 'omit' });
  const body = await response.json();
  if (!response.ok) throw Error(body.error || 'No se pudo preparar la revisión.');
  return body;
}
element('lock').onclick = () => {
  token = ''; element('result').replaceChildren(); element('company').replaceChildren();
  element('prepare').disabled = true; element('company').disabled = true;
  element('mode').textContent = 'Panel bloqueado. Para terminar el proceso, cierra la herramienta en la terminal.';
};
element('prepare').onclick = async () => {
  element('prepare').disabled = true; element('result').replaceChildren(); element('status').textContent = 'Preparando revisión…';
  try {
    const result = await get(`/api/review?company=${encodeURIComponent(element('company').value)}&quarter=${encodeURIComponent(element('quarter').value)}`);
    if (!token) return;
    element('status').textContent = result.proposal?.cells.length ? 'Propuesta interna. No aprobada para publicar.' : 'Sin propuesta disponible: faltan condiciones para formar un grupo elegible o el periodo ya está reservado.';
    for (const cell of result.proposal?.cells ?? []) {
      const card = document.createElement('article');
      const title = document.createElement('h3'); title.textContent = `${frequencies[cell.frequency]} · ${tenure[cell.tenureBand]}`;
      const value = document.createElement('p'); value.className = 'amount'; value.textContent = `${cell.medianIntervalEUR.fromInclusive} ≤ neto < ${cell.medianIntervalEUR.toExclusive} €`;
      const note = document.createElement('p'); note.textContent = 'Intervalo de la mediana por nómina · Antigüedad declarada';
      card.append(title, value, note); element('result').append(card);
    }
  } catch (error) { element('status').textContent = error.message; }
  finally { element('prepare').disabled = !token; }
};
get('/api/config').then(config => {
  if (!token) return;
  element('mode').textContent = config.demo ? 'DEMOSTRACIÓN · Datos ficticios. Sin conexión a producción.' : 'REVISIÓN REAL · Acceso local de solo lectura. Sin publicación.';
  for (const company of config.catalogue) {
    const option = document.createElement('option'); option.value = company.slug; option.textContent = company.name; element('company').append(option);
  }
  element('company').disabled = false; element('prepare').disabled = false;
}).catch(error => { element('mode').textContent = error.message; });
