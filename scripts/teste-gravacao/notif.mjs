import { ler } from './antigo.mjs';
const d = await ler(); const n = d.notifs.filter(x => /GABRIEL NASCIMENTO — Carrossel de fotos/.test(x.text));
console.log(n.map(x => [x.id, x.kind, x.by, x.text, x.ts]));
