import fs from 'fs'; import { ler } from './antigo.mjs';
const d = await ler(); const ids = JSON.parse(fs.readFileSync('ids.json')); const g = id => d.items.find(i => i.id === id);
const P = g(ids.P), N = g(ids.N);
console.log('P:', P.status, '| checklist', JSON.stringify(P.checklist), '| hist Postado', JSON.stringify((P.historico || {}).Postado));
console.log('N:', N.status, '| naoPostado', JSON.stringify(N.naoPostado));
console.log('X (antigo):', g(ids.X).status);
console.log(d.notifs.slice(0, 2).map(n => n.kind + ' — ' + n.text).join('\n'));
