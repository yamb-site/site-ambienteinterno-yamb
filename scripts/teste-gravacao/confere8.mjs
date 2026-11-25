import fs from 'fs'; import { ler } from './antigo.mjs';
const d = await ler(); const ids = JSON.parse(fs.readFileSync('ids.json')); const g = id => d.items.find(i => i.id === id);
console.log('Reels:', JSON.stringify(g(ids.R).capa));
console.log('Multibom:', JSON.stringify(g(ids.M).semMaterial), '| produtor', g(ids.M).produtor);
console.log('Outro (antigo):', g(ids.X).status);
console.log('notifs:', d.notifs.slice(0, 6).map(n => n.kind + ' — ' + n.text.slice(0, 60)).join('\n        '));
