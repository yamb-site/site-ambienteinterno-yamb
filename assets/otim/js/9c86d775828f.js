var {
  Card,
  SectionHeading,
  Badge,
  Stat
} = window.YAMBDesignSystem_30612d;
var TEAM = [{
  s: 'yasmim-barbara',
  f: 'Yasmim',
  l: 'Bárbara',
  r: 'CEO / Diretora Geral'
}, {
  s: 'gabriel-santos',
  f: 'Gabriel',
  l: 'Santos',
  r: 'COO / Diretor de Operações e Branding'
}, {
  s: 'vitoria-almeida',
  f: 'Vitória',
  l: 'Almeida',
  r: 'Diretora de Conteúdo'
}, {
  s: 'anny-vitoria',
  f: 'Anny',
  l: 'Vitória',
  r: 'Diretora de Planejamento'
}, {
  s: 'vitor-nascimento',
  f: 'Vitor',
  l: 'Nascimento',
  r: 'Diretor Administrativo'
}, {
  s: 'camille-danylo',
  f: 'Camille',
  l: 'e Danylo',
  r: 'Editores de Vídeo'
}, {
  s: 'marcus-fontes',
  f: 'Marcus',
  l: 'Fontes',
  r: 'Designer Gráfico'
}, {
  s: 'brisa-franca',
  f: 'Brisa',
  l: 'França',
  r: 'Social Media'
}];
function Equipe() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 44
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Equipe",
    title: "Doze pessoas, uma comunica\xE7\xE3o s\xF3",
    lede: "Somos a Ya Marketing & Branding, que atua de forma estrat\xE9gica e integrada, cuidando de todas as frentes do marketing com foco em resultado real."
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "grid2",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 24
    }
  }, TEAM.map(p => /*#__PURE__*/React.createElement("figure", {
    key: p.s,
    style: {
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'team/' + p.s + '.png',
    alt: p.f + ' ' + p.l,
    style: {
      width: '100%',
      aspectRatio: '1 / 1.05',
      objectFit: 'cover',
      borderRadius: 'var(--radius-lg)'
    }
  }), /*#__PURE__*/React.createElement("figcaption", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      color: 'var(--text-heading)'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 700
    }
  }, p.f), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400
    }
  }, p.l)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, p.r))))))), /*#__PURE__*/React.createElement(Section, {
    ground: "flat"
  }, /*#__PURE__*/React.createElement("div", {
    "data-r": "split",
    style: {
      display: 'grid',
      gridTemplateColumns: '.9fr 1.1fr',
      gap: 64,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Estrutura",
    title: "Fun\xE7\xF5es que cobrem toda a comunica\xE7\xE3o"
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "grid2",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: '20px 24px'
    }
  }, ['Direção estratégica', 'Atendimento', 'Branding', 'Planejamento', 'Social media', 'Produção de conteúdo', 'Stories', 'Design', 'Roteirização', 'Captação', 'Fotografia', 'Edição', 'Tráfego pago', 'Sites', 'Suporte aos projetos'].map(x => /*#__PURE__*/React.createElement("div", {
    key: x,
    style: {
      paddingTop: 12,
      borderTop: '1px solid var(--border-subtle)',
      fontSize: 15,
      color: 'var(--text-body)'
    }
  }, x))))));
}
Object.assign(window, {
  Equipe
});