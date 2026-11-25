import { ler, normDb } from './antigo.mjs';
const d = normDb(await ler());
const pend = d.items.filter(i => !i.excluido && i.status === 'Pendente');
const [X, Y, Z] = [pend[0], pend[1], pend[2]];
console.log(JSON.stringify({ X: [X.id, X.cliente, X.titulo, X.status], Y: [Y.id, Y.cliente, Y.titulo, Y.status], Z: [Z.id, Z.cliente, Z.titulo, Z.status] }, null, 1));
import fs from 'fs'; fs.writeFileSync('estado-antigo.json', JSON.stringify(d)); fs.writeFileSync('ids.json', JSON.stringify({ X: X.id, Y: Y.id, Z: Z.id }));
