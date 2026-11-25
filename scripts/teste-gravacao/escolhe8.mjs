import fs from 'fs'; import { ler, normDb } from './antigo.mjs';
const d = normDb(await ler()); fs.writeFileSync('estado-antigo.json', JSON.stringify(d));
const v = d.items.filter(i => !i.excluido);
const reels = v.find(i => i.tipo === 'Reels' && ['Pendente', 'Produção'].includes(i.status) && !(i.capa && i.capa.pronta) && !i.semMaterial);
const mat = v.find(i => i.id !== reels.id && i.status === 'Pendente' && !i.semMaterial && i.tipo !== 'Reels');
const outro = v.find(i => i.id !== reels.id && i.id !== mat.id && i.status === 'Pendente');
fs.writeFileSync('ids.json', JSON.stringify({ X: outro.id, R: reels.id, M: mat.id }));
console.log({ reels: [reels.id, reels.cliente, reels.titulo, reels.capa], mat: [mat.id, mat.cliente, mat.titulo, mat.produtor], outro: [outro.id, outro.cliente] });
