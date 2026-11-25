import fs from 'fs'; import { ler } from './antigo.mjs';
const d = await ler(); const ids = JSON.parse(fs.readFileSync('ids.json')); const g = id => d.items.find(i => i.id === id);
const A = g(ids.A), B = g(ids.B);
console.log('A:', A.status, JSON.stringify(A.aprovacao), '| hist Aprovado:', JSON.stringify((A.historico || {}).Aprovado));
console.log('B:', B.status, '| nota:', B.nota, '| hist Ajustar:', JSON.stringify((B.historico || {}).Ajustar));
console.log('X (antigo):', g(ids.X).status);
console.log(d.notifs.slice(0, 3).map(n => n.kind + ' — ' + n.text).join('\n'));
