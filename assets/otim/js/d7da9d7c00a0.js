var {
  PetalList,
  SectionHeading,
  Accordion,
  Card,
  Statement,
  PetalMark,
  Badge
} = window.YAMBDesignSystem_30612d;
var PETALS = [{
  title: 'Identidade',
  body: 'Quem a marca é, no que acredita e o que deseja transmitir.'
}, {
  title: 'Estratégia',
  body: 'O direcionamento que conecta ideias a resultados possíveis.'
}, {
  title: 'Posicionamento',
  body: 'O espaço que a marca ocupa na mente do público.'
}, {
  title: 'Conteúdo',
  body: 'A narrativa que comunica, educa e gera conexão.'
}, {
  title: 'Design',
  body: 'A tradução visual da essência da marca.'
}, {
  title: 'Relacionamento',
  body: 'Laços verdadeiros que transformam clientes em comunidade.'
}, {
  title: 'Crescimento',
  body: 'A evolução contínua: cada aprendizado e cada número.'
}, {
  title: 'Transformação',
  body: 'Amadurecer e reinventar-se sem perder a essência.'
}, {
  title: 'Inovação',
  body: 'Novas ideias, ferramentas e formas de comunicar.'
}, {
  title: 'Autenticidade',
  body: 'A verdade que sustenta a comunicação.'
}, {
  title: 'Experiência',
  body: 'Tudo o que o público sente ao entrar em contato.'
}, {
  title: 'Resultados',
  body: 'A colheita: autoridade, oportunidades e valor construído.'
}];
var STEPS = [{
  title: 'Diagnóstico',
  body: 'História, produtos, público, concorrentes, diferenciais, canais, atendimento e processo comercial.'
}, {
  title: 'Definição da estratégia',
  body: 'Prioridades, pilares, ajuste de posicionamento, metas e planejamento das ações.'
}, {
  title: 'Planejamento',
  body: 'Entregas, conteúdos, roteiros, campanhas e cronogramas, sempre com antecedência.'
}, {
  title: 'Produção',
  body: 'Artes, fotografias, vídeos, textos, campanhas, sites e materiais institucionais.'
}, {
  title: 'Aprovação',
  body: 'Validação das informações e alinhamento dos detalhes com o cliente.'
}, {
  title: 'Execução',
  body: 'Publicação, programação e lançamento conforme o planejado.'
}, {
  title: 'Acompanhamento',
  body: 'Análise dos resultados, resposta do público e ajustes estratégicos.'
}];
function Processo() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    "data-r": "sec",
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--ground-dark)',
      padding: '110px 64px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'bg-dark-texture-min.png',
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: .8
    }
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "split",
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.1fr .9fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    onDark: true,
    overline: "As 12 p\xE9talas",
    title: "Cada p\xE9tala \xE9 uma dimens\xE3o do processo",
    lede: "Elas n\xE3o funcionam isoladas. Todas se conectam e formam uma estrutura completa, da ess\xEAncia da marca \xE0 colheita dos resultados."
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "pmark",
    style: {
      justifySelf: 'center',
      maxWidth: '100%'
    }
  }, /*#__PURE__*/React.createElement(PetalMark, {
    size: 340,
    basePath: A
  })))), /*#__PURE__*/React.createElement("section", {
    "data-r": "sec",
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--ground-dark)',
      padding: '110px 64px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'grain-gradient-min.png',
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "petlist",
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PetalList, {
    columns: 4,
    items: PETALS,
    onDark: true,
    basePath: A
  }))), /*#__PURE__*/React.createElement(Section, {
    ground: "flat"
  }, /*#__PURE__*/React.createElement("div", {
    "data-r": "split",
    style: {
      display: 'grid',
      gridTemplateColumns: '.85fr 1.15fr',
      gap: 64,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Como funciona",
    title: "Sete etapas, sempre nesta ordem",
    lede: "O trabalho n\xE3o termina na publica\xE7\xE3o."
  }), /*#__PURE__*/React.createElement(Accordion, {
    items: STEPS,
    defaultOpen: 0
  }))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    "data-r": "grid1",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 24
    }
  }, [{
    h: 'Missão',
    b: 'Desenvolver marcas de maneira estratégica, humana e criativa.'
  }, {
    h: 'Visão',
    b: 'Ser referência em marketing e branding pelo atendimento próximo e pela organização dos processos.'
  }, {
    h: 'Propósito',
    b: 'Transformar histórias, ideias e negócios em marcas fortes, autênticas e reconhecidas.'
  }].map(x => /*#__PURE__*/React.createElement(Card, {
    key: x.h,
    variant: "outline",
    padding: "xl"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-overline)',
      fontWeight: 600,
      color: 'var(--gold-700)'
    }
  }, x.h), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 18,
      lineHeight: 1.6,
      color: 'var(--text-heading)'
    }
  }, x.b))))));
}
Object.assign(window, {
  Processo
});