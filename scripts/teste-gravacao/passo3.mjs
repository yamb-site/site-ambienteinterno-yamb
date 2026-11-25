// "celular antigo": a partir do estado que ele carregou antes, muda X e grava
import fs from 'fs'; import { gravar, stamp } from './antigo.mjs';
const d = JSON.parse(fs.readFileSync('estado-antigo.json')); const ids = JSON.parse(fs.readFileSync('ids.json'));
const prev = JSON.parse(JSON.stringify(d));
const X = d.items.find(i => i.id === ids[process.argv[4] || 'X']); X.status = process.argv[5] || 'Produção';
stamp(d.items, prev.items, 'id');
const m = await gravar(d); fs.writeFileSync('estado-antigo.json', JSON.stringify(d));
console.log('antigo gravou', X.cliente, '→', X.status);
