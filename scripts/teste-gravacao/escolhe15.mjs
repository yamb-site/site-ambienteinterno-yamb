import fs from 'fs'; import { ler, normDb } from './antigo.mjs';
const d = normDb(await ler()); fs.writeFileSync('estado-antigo.json', JSON.stringify(d));
const v = d.items.filter(i => !i.excluido);
const E = v.find(i => i.status === 'Pendente' && i.tipo === 'Carrossel'), F = v.filter(i => i.status === 'Pendente' && i.tipo === 'Foto')[0] || v.filter(i => i.status === 'Pendente')[5], Xc = v.filter(i => i.status === 'Pendente')[7];
const rot = (d.stories || []).find(s => (s.dias || []).length);
const outro = v.find(i => i.status === 'Pendente' && ![E.id, F.id, Xc.id].includes(i.id));
fs.writeFileSync('ids.json', JSON.stringify({ E: E.id, F: F.id, Xc: Xc.id, X: outro.id, rot: rot.cliente }));
console.log({ E: [E.id, E.cliente, E.titulo, E.data], F: [F.id, F.tipo], Xc: Xc.id, rotina: [rot.cliente, rot.dias, rot.fixo] });
