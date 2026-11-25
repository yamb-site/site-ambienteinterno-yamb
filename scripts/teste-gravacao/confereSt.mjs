import { ler } from './antigo.mjs';
const d = await ler(); console.log('story', JSON.stringify(d.storiesFeitos.find(f => f.id === 'AMELYS|23/11/2026')), '| plano', d.planos.find(p => p.cliente === 'AMELYS').status);
