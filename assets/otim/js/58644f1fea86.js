var {
  Card,
  Badge,
  Tabs,
  Button,
  SectionHeading,
  Accordion,
  Tag
} = window.YAMBDesignSystem_30612d;
var GROUPS = {
  'Branding': [{
    t: 'Diagnóstico da marca',
    b: 'Onde a marca está hoje, como é percebida e o que falta comunicar.'
  }, {
    t: 'Identidade visual',
    b: 'Logotipo, paleta, tipografia e aplicações.'
  }, {
    t: 'Brandbook',
    b: 'Guia estratégico e visual para padronizar tudo.'
  }, {
    t: 'Tom de voz',
    b: 'Personalidade, narrativa e vocabulário da marca.'
  }],
  'Conteúdo': [{
    t: 'Planejamento mensal',
    b: 'Pautas, cronograma e datas estratégicas.'
  }, {
    t: 'Posts e carrosséis',
    b: 'Peças alinhadas ao branding, com intenção.'
  }, {
    t: 'Roteiros e Reels',
    b: 'Estrutura, gravação e edição.'
  }, {
    t: 'Stories',
    b: 'Rotina de bastidores, provas sociais e chamadas.'
  }],
  'Tráfego': [{
    t: 'Campanhas',
    b: 'Reconhecimento, tráfego, mensagens e leads.'
  }, {
    t: 'Segmentação',
    b: 'Públicos definidos a partir do posicionamento.'
  }, {
    t: 'Otimização',
    b: 'Testes de criativos e ajuste de investimento.'
  }, {
    t: 'Relatórios',
    b: 'Métricas com leitura e recomendação.'
  }],
  'Comercial': [{
    t: 'Scripts de atendimento',
    b: 'Abordagem consultiva e respostas rápidas.'
  }, {
    t: 'Funil e CRM',
    b: 'Organização do WhatsApp, follow-up e pós-venda.'
  }, {
    t: 'Treinamentos',
    b: 'Equipe preparada para converter a demanda gerada.'
  }, {
    t: 'Padronização',
    b: 'Um só discurso em todos os pontos de contato.'
  }]
};
function Servicos({
  go
}) {
  const [tab, setTab] = React.useState('Branding');
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Servi\xE7os",
    title: "Estrat\xE9gia, cria\xE7\xE3o e execu\xE7\xE3o no mesmo lugar",
    lede: "Escolha uma frente para ver o que est\xE1 inclu\xEDdo. Todo projeto come\xE7a pelo diagn\xF3stico."
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "tabs",
    style: {
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: Object.keys(GROUPS),
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    "data-r": "grid1",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: 20
    }
  }, GROUPS[tab].map(i => /*#__PURE__*/React.createElement(Card, {
    key: i.t,
    variant: "raised"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, tab), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h4)',
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, i.t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, i.b)))))), /*#__PURE__*/React.createElement(Section, {
    ground: "flat"
  }, /*#__PURE__*/React.createElement("div", {
    "data-r": "split",
    style: {
      display: 'grid',
      gridTemplateColumns: '0.9fr 1.1fr',
      gap: 64,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Dores que resolvemos",
    title: "Empresa com qualidade, sem comunica\xE7\xE3o que transmita autoridade",
    lede: "Os sintomas mais comuns em quem chega at\xE9 n\xF3s."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10
    }
  }, ['Falta de posicionamento', 'Comunicação sem identidade', 'Redes desorganizadas', 'Conteúdo sem planejamento', 'Marca desatualizada', 'Baixo reconhecimento', 'Falta de constância', 'Atendimento sem padrão', 'Marketing e vendas desconectados', 'Tráfego sem acompanhamento'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Perguntas frequentes",
    title: "Antes de come\xE7ar"
  }), /*#__PURE__*/React.createElement(Accordion, {
    items: [{
      title: 'Vocês trabalham com fórmulas prontas?',
      body: 'Não. Cada empresa tem uma realidade, um momento e objetivos específicos, então o projeto é construído a partir do diagnóstico.'
    }, {
      title: 'Em quanto tempo aparecem resultados?',
      body: 'Marca não se constrói de um dia para o outro. Trabalhamos com planejamento antecipado e acompanhamento contínuo. Os primeiros sinais costumam ser de organização e percepção, antes de volume.'
    }, {
      title: 'O que precisamos entregar de nossa parte?',
      body: 'Informações corretas, materiais solicitados, disponibilidade para gravações, aprovações dentro dos prazos e atualizações sobre vendas e leads.'
    }, {
      title: 'Tráfego pago resolve sozinho?',
      body: 'Tráfego gera demanda. A equipe comercial precisa estar preparada para atender, acompanhar e converter. Por isso também apoiamos a estruturação comercial.'
    }]
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: () => go('contato'),
    iconAfter: /*#__PURE__*/React.createElement(Icon, {
      name: "ArrowRight",
      size: 18
    })
  }, "Solicitar diagn\xF3stico")))));
}
Object.assign(window, {
  Servicos
});