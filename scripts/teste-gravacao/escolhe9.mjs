import fs from 'fs'; import { ler, normDb } from './antigo.mjs';
const d = normDb(await ler()); fs.writeFileSync('estado-antigo.json', JSON.stringify(d));
const env = d.items.filter(i => !i.excluido && i.status === 'Enviado');
const outro = d.items.find(i => !i.excluido && i.status === 'Pendente');
fs.writeFileSync('ids.json', JSON.stringify({ A: env[0].id, B: env[1].id, X: outro.id }));
console.log({ A: [env[0].id, env[0].cliente, env[0].titulo], B: [env[1].id, env[1].cliente, env[1].titulo], X: outro.id });
