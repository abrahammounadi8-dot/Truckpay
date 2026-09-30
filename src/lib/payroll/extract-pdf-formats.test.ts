import test from "node:test";
import assert from "node:assert/strict";
import { extractPayslipDocument } from "./extract-document";

// Minimal real PDF containers holding synthetic text only.
function pdf(pages: string[][]) {
  const objects = ["", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const kids: number[] = [];
  for (const lines of pages) {
    const pageId = objects.length + 1, streamId = pageId + 1;
    kids.push(pageId);
    const stream = 'BT /F1 12 Tf 50 750 Td '+lines.map((line,i)=>(i?'0 -22 Td ':'')+'('+line.replace(/[()\\]/g,'\\$&')+') Tj').join('\n')+' ET';
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }
  objects[0]='<< /Type /Catalog /Pages 2 0 R >>';
  objects[1]=`<< /Type /Pages /Kids [${kids.map(id=>`${id} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  let body='%PDF-1.4\n'; const offsets=[0];
  objects.forEach((object,i)=>{offsets.push(Buffer.byteLength(body));body+=`${i+1} 0 obj\n${object}\nendobj\n`;});
  const start=Buffer.byteLength(body);
  body+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Uint8Array(Buffer.from(body));
}
test("a real single-page PDF reads company, date, frequency and comma-decimal net",async()=>{
  const result=await extractPayslipDocument({bytes:pdf([['Company Name: TEST East Haulage','Pay Date: 30/09/2026','Frequency: Monthly','Gross Pay: 1.234,56','Nett Pay: 1.000,00']]),mime:'application/pdf',filename:'synthetic.pdf'});
  assert.equal(result.draft.fields.employerName,'TEST East Haulage');
  assert.equal(result.draft.fields.paymentDate,'2026-09-30');
  assert.equal(result.draft.fields.payFrequency,'monthly');
  assert.equal(result.draft.fields.netPay,1000);
});
test("separate PDF pages can never combine one company's identity with another's pay",async()=>{
  const result=await extractPayslipDocument({bytes:pdf([['Employer: TEST A','Pay Date: 03/09/2026'],['Employer: TEST B','Net Pay: 900.00']]),mime:'application/pdf',filename:'two-synthetic-pages.pdf'});
  assert.equal(result.kind,'unsupported');
  assert.deepEqual(result.draft.fields,{});
  assert.match(result.message,/one payslip page/);
});
test("damaged and unlabelled PDF files return actionable failures without invented fields",async()=>{
  const bad=await extractPayslipDocument({bytes:new Uint8Array(Buffer.from('not a PDF')),mime:'application/pdf',filename:'damaged.pdf'});
  assert.equal(bad.kind,'unsupported');
  assert.match(bad.message,/could not be opened/);
  const empty=await extractPayslipDocument({bytes:pdf([['TEST document without amounts']]),mime:'application/pdf',filename:'unlabelled.pdf'});
  assert.deepEqual(empty.draft.fields,{});
  assert.match(empty.message,/original PDF/);
});
