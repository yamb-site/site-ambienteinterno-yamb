// Simula o interno ANTIGO gravando na cópia de teste, com o código de junção copiado do app.js real.
import fs from 'fs';
const URL = 'https://yamb-interno-teste.diretoria-c5d.workers.dev/';
globalThis.window = {};
const dataJs = fs.readFileSync(process.argv[2], 'utf8');
// funções do data.js real (statusDe, normClientes, CLIENTS...)
new Function('window', dataJs)(window); window.AVAL_URL = '';
const normDb0 = d => d && d.items && d.items.some(i => window.statusDe(i) !== i.status) ? { ...d, items: d.items.map(i => { const s = window.statusDe(i); return s === i.status ? i : { ...i, status: s }; }) } : d;
const normDb = d => window.normClientes(normDb0(d));
const codigo = fs.readFileSync(process.argv[3], 'utf8');
const { merge, stamp } = new Function('normDb', codigo + '\nreturn { merge, stamp };')(normDb);
export async function ler() { return (await (await fetch(URL + '?t=' + Date.now())).json()).data; }
export async function gravar(local) {
  const r = await ler(); const m = merge(local, r);
  const o = await (await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ data: m }) })).json();
  if (!o.rev) throw new Error('falhou'); return m;
}
export { stamp, normDb };
