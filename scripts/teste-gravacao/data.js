/* ---------------------------------------------------------------------------
   YAMB — ambiente interno. Dados de exemplo.
   Os 29 nomes de cliente e a equipe são reais; os itens de conteúdo abaixo são
   exemplos para a interface ter o que renderizar. Substituir pela fonte real.
   --------------------------------------------------------------------------- */

window.CLIENTS=['AMELYS','CLÍNICA CAE','DANI NUTRI','EDNA','EU GOSTO SEX SHOP','LITO LAVANDERIA',
 'SPAZIO VALORE','THAIANE','ADRIANA FONSECA','CACAU SHOW','CRISTINA LIMA',
 'AGIHOME','ALIANE','COLÉGIO COLIBRI','DR. JOÃO','ERICA OLIVEIRA','IVANA MIRANDA',
 'CASATINI','DANY REIS','GABRIEL NASCIMENTO','YASMIM','CAJU GASTRÔ','CNB','MULTIBOM','NUANCE','TERRAÇO','DOM SORVETES E AÇAÍ','DRA. EMILLY','COLÉGIO SÃO BENTO'].sort((a,b)=>a.localeCompare(b,'pt-BR'));
/* Nomes antigos -> nomes atuais (em maiúsculo). */
window.CLIENTE_ALIAS={'THAIANE FONSECA':'THAIANE','ERIKA OLIVEIRA':'ERICA OLIVEIRA','VIVI QUENDEIRA':'VIVI KENDERA','DANI REIS':'DANY REIS','EU GOSTO SEXSHOP':'EU GOSTO SEX SHOP'};
window.normCliente=c=>{const u=String(c||'').trim().toUpperCase();return window.CLIENTE_ALIAS[u]||u};
/* Atualiza nomes dos clientes nos dados salvos; planejamento e stories ficam só com os clientes atuais. */
window.normClientes=db=>{if(!db||!db.items)return db;
  const fix=(l,base)=>{const m=new Map();(l||[]).forEach(x=>{const c=window.normCliente(x.cliente);if(window.CLIENTS.includes(c)&&!m.has(c))m.set(c,x.cliente===c?x:{...x,cliente:c})});return window.CLIENTS.map(c=>m.get(c)||base(c))};
  const items=db.items.map(i=>{const c=window.normCliente(i.cliente);return c===i.cliente?i:{...i,cliente:c}});
  const out={...db,items,planos:fix(db.planos,c=>({cliente:c,status:'Sem planejamento',periodo:'',responsavel:'',trello:''}))};
  if(db.stories)out.stories=fix(db.stories,c=>({cliente:c,dias:[],fixo:''}));
  if(db.storiesFeitos)out.storiesFeitos=db.storiesFeitos.map(f=>{const [c,...r]=String(f.id).split('|');const n=window.normCliente(c);return n===c?f:{...f,id:[n,...r].join('|')}});
  return JSON.stringify(out)===JSON.stringify(db)?db:out};

/* Funções do sistema. 'cadastro' = pode cadastrar conteúdo. */
/* Senhas não ficam no código: só o resumo SHA-256 de "usuário|senha". Para trocar uma senha, gere o resumo novo. */
window.yambSha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
/* Confere a senha; para a direção também gera a chave da planilha financeira (fica só na memória). */
window.yambEntrar=async(u,pwd)=>{if(!u||!pwd)return false;if(await window.yambSha(u.login+'|'+pwd)!==u.hash)return false;
  window.__finTok=['yasmim','gabriel','vitor'].includes(u.id)?await window.yambSha(u.login+'|'+pwd+'|yamb-fin'):null;return true};
window.TEAM=[
 {id:'vitoria',login:'vitoria.almeida',hash:'b366765602fdb2dc5d61389e83de17aeb6da7d5369850cbd04bcdbb7fc7e8f73',name:'Vitória Almeida',role:'Direção de Conteúdo',photo:'vitoria-almeida',panels:['geral','indicadores','semana','stories','cadastro','video','aprovacao'],cadastro:true},
 {id:'gabriel',login:'gabriel.santos',hash:'ef855223e5b55d6649a30cd2d607b30c063a2088afebc8470dfd679a0f0a5895',name:'Gabriel Santos',role:'COO / Branding',photo:'gabriel-santos',panels:['geral','indicadores','semana','stories','cadastro','design','video','aprovacao'],cadastro:true},
 {id:'yasmim',login:'yasmim.barbara',hash:'b2f5cba45c9d33c38aa68dc6451fe020dcd1321702a24ac9969035eede67bc99',name:'Yasmim Bárbara',role:'CEO / Diretora Geral',photo:'yasmim-barbara',panels:['geral','indicadores','semana','stories','cadastro','video','aprovacao'],cadastro:true},
 {id:'anny',login:'anny.vitoria',hash:'9cf2a2bbd0cf39bca6fd04fb8301f198020a1a9e96aea9ad1b307cb1e9cb6a24',name:'Anny Vitória',role:'Planejamento',photo:'anny-vitoria',panels:['geral','indicadores','semana','stories','cadastro','planejamento'],cadastro:true},
 {id:'brisa',login:'brisa.franca',hash:'f8cbb523f6e1af7e08c4e8e6969007936d9238301e2fa7b9f364bb757e471af4',name:'Brisa França',role:'Social Media',photo:'brisa-franca',panels:['geral','indicadores','semana','stories','cadastro','social','aprovacao'],cadastro:true},
 {id:'marcus',login:'marcus.fontes',hash:'62fbab857890fe44b1a5579e4d17c0e912512ada5ccbadfae8aa99057cae53f9',name:'Marcus Fontes',role:'Designer Gráfico',photo:'marcus-fontes',panels:['geral','indicadores','semana','stories','cadastro','design'],cadastro:true},
 {id:'camille',login:'camille.danylo',hash:'10910c847e101ef6b9e1f24e2b1c56c82bfef4a9d7c893676330b9f3f5d707dc',name:'Camille e Danylo',role:'Edição de Vídeo',photo:'camille-danylo',panels:['geral','indicadores','semana','stories','cadastro','video'],cadastro:true},
 {id:'yngra',login:'yngra.lyriel',hash:'41d2b7ec2f0d0c1bcc8092869ac7d636b4c9f6b69d0f4b2493499a562423247f',name:'Yngra Lyriel',role:'Secretária',photo:'yngra-lyriel',panels:['geral','indicadores','semana','stories','cadastro'],cadastro:true},
 {id:'vitor',login:'vitor.nascimento',hash:'a4859f403fed0d324001a307a02aa771520b8d6eb823c39e73999d1d54209495',name:'Vitor Nascimento',role:'Administrativo',photo:'vitor-nascimento',panels:['geral','indicadores','semana','stories','cadastro'],cadastro:true}
];

window.TIPOS=['Vídeo','Reels','Foto','Carrossel','Arte','Stories'];

/* Semana de postagem — segunda a domingo. */
window.DIAS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
window.DIAS_CURTO=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
/* 'dd/mm/aaaa' -> Date */
/* Aceita dd/mm, dd/mm/aa, dd/mm/aaaa (separador / . ou -) e aaaa-mm-dd. Ano com 2 dígitos = 20aa; sem ano = ano atual. */
window.parseData=s=>{const t=String(s||'').trim();let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);let d,mo,y;
  if(m){y=+m[1];mo=+m[2];d=+m[3]}else{m=t.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/);if(!m)return null;d=+m[1];mo=+m[2];y=m[3]?+m[3]:new Date().getFullYear();if(y<100)y+=2000}
  if(mo<1||mo>12||d<1||d>31||y<2000)return null;const o=new Date(y,mo-1,d);return o.getDate()===d?o:null};
/* Normaliza qualquer formato aceito para dd/mm/aaaa. */
window.normData=s=>{const d=window.parseData(s);return d?window.fmtData(d):s};
window.fmtData=dt=>String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0')+'/'+dt.getFullYear();
/* índice 0=segunda … 6=domingo */
window.indiceDia=s=>{const dt=window.parseData(s);return dt?(dt.getDay()+6)%7:null};
/* segunda-feira da semana que contém a data */
window.segundaDe=dt=>{const o=new Date(dt);o.setDate(o.getDate()-((o.getDay()+6)%7));o.setHours(0,0,0,0);return o};
window.somaDias=(dt,n)=>{const o=new Date(dt);o.setDate(o.getDate()+n);return o};
/* Horário padrão de publicação por dia da semana — ajustar à rotina real. */
window.HORARIOS=['12h','19h','12h','19h','12h','11h','17h'];
/* Quem produz cada formato — define em qual painel o item aparece. */
window.produtorDe=t=>(t==='Vídeo'||t==='Reels')?'video':'design';
/* Responsável padrão pela produção de cada painel (o painel pode ser visto por mais pessoas). */
window.PRODUTOR_ID={design:'marcus',video:'camille'};
/* Quem pode produzir cada formato: quem tem o painel (o responsável padrão primeiro). */
window.produtoresDe=tipo=>{const r=window.produtorDe(tipo),pad=window.PRODUTOR_ID[r];return window.TEAM.filter(t=>t.panels.includes(r)).sort((a,b)=>(b.id===pad)-(a.id===pad))};
/* Responsável válido para o formato: o escolhido, se puder produzir esse formato; senão o padrão. */
window.produtorPara=(tipo,id)=>window.produtoresDe(tipo).some(t=>t.id===id)?id:window.PRODUTOR_ID[window.produtorDe(tipo)];
/* A demanda é desta pessoa neste painel? Cada painel mostra só as demandas indicadas para quem está logado. */
window.ehDoProdutor=(i,user,role)=>window.produtorDe(i.tipo)===role&&window.produtorPara(i.tipo,i.produtor)===(user&&user.id);

/* Fluxo: Pendente → Produção → Pronto → Enviado → Aprovado → Não postado → Postado.
   Ajustar: quando a avaliação pede ajuste, o material sai de Enviado para Ajustar e, corrigido, volta para Enviado.
   Qualquer pessoa da equipe cadastra em Pendente e move o material entre as etapas. */
window.STATUS=['Pendente','Produção','Pronto','Enviado','Ajustar','Aprovado','Não postado','Postado'];
/* Próxima etapa e etapa anterior nos botões de avançar/voltar: Ajustar fica fora da sequência principal. */
window.proximaEtapa=s=>s==='Ajustar'?'Enviado':s==='Enviado'?'Aprovado':window.STATUS[window.STATUS.indexOf(s)+1];
window.etapaAnterior=s=>s==='Ajustar'?undefined:s==='Aprovado'?'Enviado':window.STATUS[window.STATUS.indexOf(s)-1];
window.STATUS_DESC={'Pendente':'Demanda registrada, aguardando início','Produção':'Material em desenvolvimento','Pronto':'Material finalizado, pronto para enviar','Enviado':'Encaminhado para avaliação','Ajustar':'A avaliação pediu ajuste — corrigir e reenviar','Aprovado':'Material liberado','Não postado':'Aprovado, mas ainda não publicado','Postado':'Publicado no Instagram'};
window.STATUS_TONE={
 'Pendente':{bg:'var(--cream-500)',fg:'var(--ink-700)'},
 'Produção':{bg:'var(--cream-600)',fg:'var(--gold-900)'},
 'Pronto':{bg:'var(--gold-100, #FBEBD0)',fg:'var(--gold-900)'},
 'Enviado':{bg:'var(--info-100)',fg:'var(--info-500)'},
 'Ajustar':{bg:'var(--danger-100, #F9DEDA)',fg:'var(--danger-500)'},
 'Aprovado':{bg:'var(--success-100)',fg:'var(--success-500)'},
 'Não postado':{bg:'var(--danger-100, #F9DEDA)',fg:'var(--danger-500)'},
 'Postado':{bg:'var(--ink-900)',fg:'var(--bone)'}
};
/* Converte etapas do fluxo antigo para o novo. */
window.normStatus=s=>({'Em produção':'Produção','Ajustes':'Ajustar','Postagem':'Postado','Aguardando aprovação':'Enviado','Finalizado':'Postado'})[s]||s;

/* Checklist de postagem — conferência final da social media, antes de publicar. */
window.CHECKLIST=[
 'Conteúdo correto','Cliente correto','Formato correto','Legenda conferida',
 'Informações revisadas','Identidade visual conferida','Marcação de perfis verificada',
 'Data e horário da postagem confirmados','Aprovação do cliente registrada',
 'Postagem realizada no Instagram'];

/* Base zerada para o time começar a usar: nenhum conteúdo cadastrado.
   Os clientes e a equipe permanecem; os itens entram pelo painel de Cadastro. */
window.ITEMS=[];

/* Situação do planejamento por cliente (painel de Planejamento). */
window.PLANOS=window.CLIENTS.map(c=>({cliente:c,status:'Sem planejamento',periodo:'',responsavel:'',trello:''}));

window.SEED_NOTIFS=[];

/* Rotina fixa de stories por cliente: dias = índices 0 (segunda) … 6 (domingo). */
window.STORIES=window.CLIENTS.map(c=>({cliente:c,dias:[],fixo:''}));

/* Horário em que o material entrou em cada etapa: historico[etapa]={em:'dd/mm · hh:mm',por}. */
window.stampHist=(i,to,by)=>({...(i.historico||{}),[to]:{em:new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).replace(',',' ·'),por:by||'',ts:Date.now()}});
/* "Não postado" exige motivo. Retorna false se a pessoa cancelar. */
window.pedirMotivo=(to,extra)=>{if(to!=='Não postado'||(extra&&extra.motivo))return extra;
  const m=window.prompt('Por que este conteúdo não foi postado?\n(ex.: cliente pediu para segurar, erro na publicação)');if(m===null)return false;return {...(extra||{}),motivo:m.trim()||'Sem motivo informado'}};
/* Alerta de atraso: dias máximos em cada etapa antes de avisar. */
window.LIMITE_DIAS={'Sem material':2,'Pendente':3,'Produção':3,'Pronto':1,'Enviado':2,'Ajustar':1,'Aprovado':1,'Não postado':1};
/* Itens que voltaram da avaliação antes da etapa Ajustar existir (Produção com nota de ajuste) passam para Ajustar. */
window.statusDe=i=>{const s=window.normStatus(i.status);return s==='Produção'&&i.nota?'Ajustar':s};
/* Reels: capa feita pelo design. Por padrão todo Reels precisa de capa — só conta até ser enviado. */
window.precisaCapa=i=>i.tipo==='Reels'&&['Pendente','Produção','Pronto'].includes(i.status)&&!(i.capa&&i.capa.precisa===false);
window.capaPronta=i=>!!(i.capa&&i.capa.pronta);
/* Quem faz a capa do Reels: o designer escolhido (capa.designer) ou o responsável padrão do design. */
window.capaDesigner=i=>{const id=i.capa&&i.capa.designer;return window.TEAM.some(t=>t.id===id&&t.panels.includes('design'))?id:window.PRODUTOR_ID.design};
window.ehMinhaCapa=(i,user)=>window.precisaCapa(i)&&window.capaDesigner(i)===(user&&user.id);
/* Ações de "Sem material" e capa — iguais no computador e no celular. */
window.yambAcoesDe=(setDb,user)=>{
  const ts=()=>new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const upd=(id,fn,kind,txt)=>setDb(d=>{const items=d.items.map(i=>i.id===id?fn(i):i);const it=items.find(i=>i.id===id);if(!it)return d;
    return {...d,items,notifs:kind?[{id:'n'+Date.now()+Math.random(),to:['geral'],kind,by:user.id,text:it.tipo+' de '+it.cliente+' — '+it.titulo+txt(it)+' · por '+user.name,ts:ts()},...d.notifs].slice(0,30):d.notifs}});
  return {
    semMaterial:id=>{const f=window.prompt('Que material está faltando?\n(ex.: fotos do produto, texto da campanha, gravação)');if(f===null)return;
      upd(id,i=>({...i,semMaterial:{falta:f.trim()||'Material não informado',desde:Date.now(),por:user.id}}),'Falta material',i=>': falta '+i.semMaterial.falta)},
    materialRecebido:id=>upd(id,i=>{const n={...i};delete n.semMaterial;return n},'Material recebido',()=>' · pode produzir'),
    capaPronta:(id,ok)=>upd(id,i=>({...i,capa:{...(i.capa||{}),precisa:true,pronta:ok,por:user.id,em:Date.now()}}),ok?'Capa pronta':null,()=>''),
    precisaCapa:(id,sim)=>upd(id,i=>({...i,capa:{...(i.capa||{}),precisa:sim,pronta:false}}),null,()=>''),
    capaDesigner:(id,pid)=>upd(id,i=>({...i,capa:{...(i.capa||{}),precisa:true,designer:pid}}),'Responsável pela capa alterado',i=>' · capa: '+((window.TEAM.find(t=>t.id===window.capaDesigner(i))||{}).name||'—')),
    produtor:(id,pid)=>upd(id,i=>({...i,produtor:pid}),'Responsável alterado',i=>' · produção: '+((window.TEAM.find(t=>t.id===i.produtor)||{}).name||'—')),
    editar:(id,patch)=>{let mud='';upd(id,i=>{const n={...i,...patch};const r={cliente:'cliente',titulo:'conteúdo',data:'data',hora:'horário',trello:'link do Trello'};
      mud=Object.keys(r).filter(k=>(i[k]||'')!==(n[k]||'')).map(k=>r[k]).join(', ');return n},'Demanda editada',()=>mud?' · alterado: '+mud:'')},
    excluir:id=>{if(!window.confirm('Excluir este conteúdo?\nEle sai de todas as listas, painéis e indicadores, para toda a equipe.'))return false;
      upd(id,i=>({...i,excluido:{por:user.id,em:Date.now()}}),'Conteúdo excluído',()=>'');return true}
  }};
window.diasNaEtapa=i=>{const h=(i.historico||{})[i.status];if(!h)return null;let t=h.ts;
  if(!t&&h.em){const m=String(h.em).match(/(\d{2})\/(\d{2})/);if(m){const d=new Date(new Date().getFullYear(),+m[2]-1,+m[1]);if(d>new Date())d.setFullYear(d.getFullYear()-1);t=d.getTime()}}
  return t?Math.floor((Date.now()-t)/864e5):null};
window.atrasoDe=i=>{if(i.semMaterial&&i.semMaterial.desde){const d=Math.floor((Date.now()-i.semMaterial.desde)/864e5);return d>=window.LIMITE_DIAS['Sem material']?d:0}
  const l=window.LIMITE_DIAS[i.status],d=window.diasNaEtapa(i);return l!=null&&d!=null&&d>=l?d:0};

/* Cada demanda fica no dia da própria data — nada é movido automaticamente.
   Demandas que já tinham sido passadas para outro dia voltam para a data original (adiadoDe). */
window.rolarAtrasados=function(db){
  let mud=false;
  const items=db.items.map(i=>{
    if(i.adiadoDe){const o=window.parseData(i.adiadoDe);if(o){const {adiadoDe,adiado,...r}=i;const ds=window.fmtData(o);mud=true;return {...r,data:ds,hora:window.HORARIOS[window.indiceDia(ds)]||i.hora}}}
    const nd=window.normData(i.data);if(nd!==i.data){mud=true;return {...i,data:nd}}
    return i});
  return mud?{...db,items}:db;
};
/* ms até a próxima meia-noite */
window.msAteMeiaNoite=()=>{const a=new Date(),b=new Date(a);b.setHours(24,0,0,5);return b-a};

/* Planilha de avaliações do dia (script planilha-avaliacoes.gs). Envia a lista sempre que muda. */
window.AVAL_URL='https://script.google.com/macros/s/AKfycbyPxkrBAfkxtYeqvce4heiS6zqFl6J702Ab_qR2k3EdYooglJ9ZInXmlY4Md2K4JJXi/exec';
window.yambEnviarAvaliacoes=(()=>{let t=null,ult='';return l=>{if(!window.AVAL_URL||!l||!l.length)return;const s=JSON.stringify(l.map(({_u,...a})=>a));if(s===ult)return;clearTimeout(t);t=setTimeout(()=>{fetch(window.AVAL_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({avaliacoes:JSON.parse(s)})}).then(r=>r.json()).then(r=>{if(r&&r.ok)ult=s;else console.warn('Avaliações:',r&&r.erro)}).catch(()=>{})},1500)}})();
