import fs from 'fs'; import { ler } from './antigo.mjs';
const d = await ler(); const ids = JSON.parse(fs.readFileSync('ids.json'));
for (const k of ['X', 'Y', 'Z']) { const i = d.items.find(x => x.id === ids[k]); console.log(k, i.cliente, '|', i.status, '| historico:', Object.keys(i.historico || {}).join(','), '| _u', i._u); }
console.log('itens', d.items.length, '| notif mais nova:', d.notifs[0].kind, '—', d.notifs[0].text);
