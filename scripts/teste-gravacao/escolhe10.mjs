import fs from 'fs'; import { ler, normDb } from './antigo.mjs';
const d = normDb(await ler()); fs.writeFileSync('estado-antigo.json', JSON.stringify(d));
const ap = d.items.filter(i => !i.excluido && i.status === 'Aprovado');
const env = d.items.filter(i => !i.excluido && i.status === 'Enviado');
const outro = d.items.find(i => !i.excluido && i.status === 'Pendente');
const P = ap[0] || env[0], N = ap[1] || env[1];
fs.writeFileSync('ids.json', JSON.stringify({ P: P.id, N: N.id, X: outro.id, Pst: P.status, Nst: N.status }));
console.log({ aprovados: ap.length, P: [P.id, P.cliente, P.titulo, P.status], N: [N.id, N.cliente, N.titulo, N.status] });
