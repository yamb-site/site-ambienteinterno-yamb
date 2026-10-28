var {
  Button,
  Badge,
  Card,
  Stat,
  Logo,
  PetalMark,
  SectionHeading,
  Statement,
  Tag
} = window.YAMBDesignSystem_30612d;

/* As 12 pétalas — nomes aprovados na página Processo, com a leitura estratégica ampliada. */
var NOMES = [['Identidade', 'Quem a marca é, no que acredita e o que deseja transmitir. Antes de qualquer peça, definimos essência, valores e personalidade. É o alicerce que faz toda decisão seguinte deixar de ser achismo.'], ['Estratégia', 'O direcionamento que conecta ideias a resultados possíveis. Prioridades claras, metas realistas e um caminho definido para cada fase, para que o esforço vá onde de fato move o negócio.'], ['Posicionamento', 'O espaço que a marca ocupa na mente do público. Escolhemos o que a marca representa, para quem fala e por que merece ser escolhida, com um diferencial que se sustenta na prática.'], ['Conteúdo', 'A narrativa que comunica, educa e gera conexão. Pilares, temas e roteiros que constroem autoridade ao longo do tempo, em vez de publicações soltas que somem no feed.'], ['Design', 'A tradução visual da essência da marca. Identidade, paleta, tipografia e aplicações coerentes, para que a marca seja reconhecida antes mesmo de alguém ler o nome.'], ['Relacionamento', 'Laços verdadeiros que transformam clientes em comunidade. Atendimento, tom de voz e presença constante. As pessoas voltam por como foram tratadas, não apenas pelo produto.'], ['Crescimento', 'A evolução contínua: cada aprendizado e cada número. Medimos o que importa, lemos os dados com contexto e ajustamos o plano para que a marca cresça de forma sustentável.'], ['Transformação', 'Amadurecer e reinventar-se sem perder a essência. A marca acompanha o mercado, atualiza a comunicação e muda de fase mantendo o que a torna reconhecível.'], ['Inovação', 'Novas ideias, ferramentas e formas de comunicar. Testamos formatos, canais e tecnologias com critério, buscando o que amplia o alcance sem descaracterizar a marca.'], ['Autenticidade', 'A verdade que sustenta a comunicação. Só comunicamos o que a empresa entrega de fato. É isso que gera confiança e protege a reputação no longo prazo.'], ['Experiência', 'Tudo o que o público sente ao entrar em contato. Da primeira impressão ao pós-venda, cada ponto de contato reforça ou contradiz a promessa da marca.'], ['Resultados', 'A colheita: autoridade, oportunidades e valor construído. Quando as onze pétalas anteriores funcionam juntas, o resultado aparece em reconhecimento, demanda e crescimento real.']];
var PETALAS = NOMES.map(([titulo, texto], i) => ({
  n: String(i + 1).padStart(2, '0'),
  titulo,
  texto
}));
var SERVICES = [{
  icon: 'Sparkles',
  title: 'Branding e Identidade',
  body: 'Diagnóstico, posicionamento, identidade visual e brandbook.'
}, {
  icon: 'Compass',
  title: 'Planejamento Estratégico',
  body: 'Pilares de conteúdo, campanhas e calendário editorial.'
}, {
  icon: 'Instagram',
  title: 'Gestão de Redes Sociais',
  body: 'Conteúdo, roteiros, publicação e acompanhamento.'
}, {
  icon: 'Video',
  title: 'Produção Audiovisual',
  body: 'Direção criativa, captação e edição de vídeos e fotos.'
}, {
  icon: 'TrendingUp',
  title: 'Tráfego Pago',
  body: 'Campanhas, segmentação, otimização e relatórios.'
}, {
  icon: 'Globe',
  title: 'Sites e Presença Digital',
  body: 'Landing pages, sites institucionais e Google Meu Negócio.'
}];

/* Depoimentos — exemplos fictícios; substituir pelos relatos reais dos clientes. */
var DEPOIMENTOS = [{
  nome: 'Mariana Lopes',
  empresa: 'Clínica Lumière · Estética',
  texto: 'A gente postava todo dia e não sabia o porquê. Depois do diagnóstico, cada conteúdo passou a ter função, e as avaliações começaram a vir de quem já chegava decidido.'
}, {
  nome: 'Rafael Menezes',
  empresa: 'Menezes Arquitetura',
  texto: 'O escritório tinha qualidade, mas a marca não mostrava isso. A nova identidade e o posicionamento mudaram o tipo de projeto que chega até nós.'
}, {
  nome: 'Carla Duarte',
  empresa: 'Duarte Imóveis',
  texto: 'O tráfego trazia contato, mas o atendimento perdia. A YAMB organizou o funil e os scripts do WhatsApp. Hoje a equipe fala a mesma língua.'
}, {
  nome: 'Thiago Rocha',
  empresa: 'Casa Brasa · Gastronomia',
  texto: 'Planejamento com antecedência fez toda a diferença. Paramos de correr atrás de post e passamos a ter uma marca que as pessoas reconhecem pelo feed.'
}, {
  nome: 'Juliana Prado',
  empresa: 'Ateliê Prado · Moda',
  texto: 'Eles entenderam a essência da marca antes de criar qualquer peça. O rebranding manteve quem somos e nos colocou num lugar mais alto.'
}];
function HeroStage({
  go
}) {
  const [p, setP] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    let raf = 0;
    const on = () => {
      raf || (raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        const v = total > 0 ? Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / total)) : 1;
        setP(v);
        window.dispatchEvent(new CustomEvent('yamb-intro', {
          detail: v
        }));
      }));
    };
    on();
    window.addEventListener('scroll', on, {
      passive: true
    });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  const ease = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  /* Dois tempos: 1) a flor abre no centro, girando. 2) só então caminha para a lateral,
     enquanto o hero se monta no mesmo quadro. */
  const cl = v => Math.max(0, Math.min(1, v));
  const sm = v => v * v * (3 - 2 * v);
  const abre = sm(cl(p / .46));
  const vai = sm(cl((p - .46) / .54));
  const florScale = 1 + abre * 1.05 + vai * .266;
  const florRot = abre * 120 + vai * 100;
  const inHero = cl((p - .52) / .40);
  const heroSoft = sm(inHero);
  const mob = typeof window !== 'undefined' && window.innerWidth <= 620;
  const florT = mob ? 'translate(calc(34vw * ' + vai + '), calc(-40vh * ' + vai + ')) scale(' + (1 + abre * .75 - vai * .75) + ') rotate(' + florRot + 'deg)' : 'translateX(calc((50vw - 200px) * ' + vai + ')) scale(' + florScale + ') rotate(' + florRot + 'deg)';
  return /*#__PURE__*/React.createElement("section", {
    ref: ref,
    "data-r": "intro",
    style: {
      position: 'relative',
      height: '300vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'logo-yamb-wordmark-cream.png',
    alt: "YAMB",
    "data-r": "intro-logo",
    style: {
      position: 'absolute',
      top: 34,
      left: '50%',
      width: 132,
      transform: 'translateX(-50%) translateY(' + -vai * 26 + 'px) scale(' + (1 - vai * .35) + ')',
      opacity: 1 - cl((p - .46) / .22)
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: A + 'flower-gold-min.png',
    alt: "",
    "data-r": "intro-flower",
    style: {
      position: 'absolute',
      width: 380,
      transform: florT,
      opacity: mob ? 1 - vai * .72 : 1,
      transformOrigin: '50% 50%',
      willChange: 'transform'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "hero",
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      padding: '110px 64px 96px',
      pointerEvents: heroSoft > .6 ? 'auto' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-r": "hero-inner",
    style: {
      width: '100%',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      alignItems: 'flex-start',
      opacity: heroSoft,
      transform: 'translateY(' + (1 - heroSoft) * 26 + 'px)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-overline)',
      fontWeight: 600,
      color: 'var(--gold-400)'
    }
  }, "YA Marketing & Branding"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 'clamp(34px, 3.9vw, 60px)',
      fontWeight: 300,
      lineHeight: 1.03,
      letterSpacing: '-0.02em',
      color: 'var(--bone)',
      maxWidth: '15ch',
      textWrap: 'balance'
    }
  }, "Marketing n\xE3o \xE9 s\xF3 publicar. \xC9 ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600,
      color: 'var(--gold-400)'
    }
  }, "construir marca"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: 1.65,
      color: 'var(--text-on-dark-muted)',
      maxWidth: '46ch'
    }
  }, "Analisamos o neg\xF3cio, organizamos o posicionamento e desenvolvemos a comunica\xE7\xE3o, da identidade aos resultados."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 4,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "md",
    onClick: () => go('contato'),
    iconAfter: /*#__PURE__*/React.createElement(Icon, {
      name: "ArrowRight",
      size: 16
    })
  }, "Iniciar um projeto"), /*#__PURE__*/React.createElement(Button, {
    variant: "onDark",
    size: "md",
    onClick: () => go('processo')
  }, "Ver o processo")), /*#__PURE__*/React.createElement("div", {
    "data-r": "hero-stats",
    style: {
      display: 'flex',
      gap: 48,
      marginTop: 26,
      paddingTop: 22,
      borderTop: '1px solid var(--border-on-dark)',
      width: '100%',
      maxWidth: 640,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    onDark: true,
    value: "12",
    label: "P\xE9talas do processo"
  }), /*#__PURE__*/React.createElement(Stat, {
    onDark: true,
    value: "12",
    label: "Pessoas na equipe"
  }), /*#__PURE__*/React.createElement(Stat, {
    onDark: true,
    value: "14",
    suffix: "+",
    label: "Segmentos atendidos"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 38,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      opacity: Math.max(0, 1 - p / .25)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-overline)',
      fontWeight: 600,
      color: 'var(--ink-300)'
    }
  }, "Role para entrar"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 44,
      background: 'linear-gradient(var(--gold-500),transparent)'
    }
  }))));
}

/* A marca da YAMB, grande e acesa, dentro de um anel de medida futurista.
   A flor não é redesenhada nem desmontada: gira inteira, conduzida pelo scroll. */
function FlorMarca({
  ativa,
  giro,
  size
}) {
  const F = A + 'flower-gold-512.png';
  const wedge = (deg, span) => {
    const g = 'conic-gradient(from ' + deg + 'deg at 50% 50%, #000 0 ' + span + 'deg, transparent ' + span + 'deg)';
    return {
      WebkitMaskImage: g,
      maskImage: g
    };
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      transform: 'rotate(' + giro + 'deg)',
      willChange: 'transform'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: F,
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      filter: 'drop-shadow(0 22px 60px rgba(0,0,0,.55))'
    }
  }));
}

/* Anel de medida: traços finos, marcadores e um nó luminoso que liga ao painel. */
function Anel({
  size,
  ativa,
  giro
}) {
  const d = size * 1.30;
  const ticks = 'repeating-conic-gradient(from 0deg, rgba(243,172,47,.55) 0 .35deg, transparent .35deg 6deg)';
  const ringMask = 'radial-gradient(circle, transparent 0 47.4%, #000 47.4% 50%, transparent 50%)';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      width: d,
      height: d,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: '1px solid rgba(243,172,47,.30)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: '-4%',
      borderRadius: '50%',
      background: ticks,
      WebkitMaskImage: ringMask,
      maskImage: ringMask,
      transform: 'rotate(' + giro * .35 + 'deg)',
      opacity: .8
    }
  }), [30, 150, 210, 330].map(a => /*#__PURE__*/React.createElement("span", {
    key: a,
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 10,
      height: 10,
      marginLeft: -5,
      marginTop: -5,
      transform: 'rotate(' + (a + giro * .35) + 'deg) translateY(' + (-d / 2 - 13) + 'px) rotate(-45deg)',
      borderTop: '1.5px solid rgba(243,172,47,.85)',
      borderRight: '1.5px solid rgba(243,172,47,.85)',
      boxShadow: '0 0 10px rgba(243,172,47,.55)',
      borderRadius: 1
    }
  })));
}

/* As 12 pétalas — palco escuro granulado, luz subindo do rodapé, rotação em scrub. */
function DozePetalas() {
  const ref = React.useRef(null);
  const boxRef = React.useRef(null);
  const [i, setI] = React.useState(0);
  const [giro, setGiro] = React.useState(0);
  const [size, setSize] = React.useState(520);
  const alvo = React.useRef(0);
  React.useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0,
      atual = 0,
      loop = 0;
    const medir = () => {
      const el = boxRef.current;
      if (!el) return;
      const w = (el.clientWidth - 40) * 0.72,
        h = window.innerHeight * 0.68;
      setSize(Math.max(190, Math.min(700, w, h)));
    };
    const on = () => {
      raf || (raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(.9999, Math.max(0, (window.scrollY - el.offsetTop) / total)) : 0;
        alvo.current = p;
        setI(Math.min(11, Math.floor(p * 12)));
      }));
    };
    const anima = () => {
      loop = requestAnimationFrame(anima);
      atual += (alvo.current * -360 - atual) * (reduce ? 1 : .09);
      setGiro(Math.round(atual * 100) / 100);
    };
    medir();
    on();
    anima();
    const ro = new ResizeObserver(medir);
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener('scroll', on, {
      passive: true
    });
    window.addEventListener('resize', () => {
      medir();
      on();
    });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(loop);
    };
  }, []);
  const cur = PETALAS[i];
  return /*#__PURE__*/React.createElement("section", {
    ref: ref,
    "data-r": "petalas",
    style: {
      position: 'relative',
      height: '560vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
      display: 'grid',
      gridTemplateColumns: '1.22fr .78fr',
      alignItems: 'center',
      gap: 40,
      padding: '0 64px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-r": "petalas-flor",
    ref: boxRef,
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '88vh'
    }
  }, /*#__PURE__*/React.createElement(Anel, {
    size: size,
    ativa: i,
    giro: giro
  }), /*#__PURE__*/React.createElement(FlorMarca, {
    ativa: i,
    giro: giro,
    size: size
  })), /*#__PURE__*/React.createElement("div", {
    "data-r": "petalas-texto",
    style: {
      position: 'relative',
      maxWidth: 520,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '34px 34px 28px',
      borderRadius: 28,
      background: 'linear-gradient(165deg, rgba(38,33,27,.82), rgba(14,13,15,.86))',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(243,172,47,.30)',
      boxShadow: '0 34px 90px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,236,204,.12)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: -92,
      top: '50%',
      width: 92,
      height: 1,
      background: 'linear-gradient(90deg, rgba(243,172,47,.15), rgba(243,172,47,.95))'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: -96,
      top: '50%',
      width: 8,
      height: 8,
      marginTop: -4,
      borderRadius: '50%',
      background: 'var(--gold-400)',
      boxShadow: '0 0 14px rgba(243,172,47,.95)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: 'n' + i,
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 44,
      letterSpacing: '.01em',
      color: 'var(--gold-400)',
      animation: 'yamb-bloom var(--dur-bloom) var(--ease-bloom) both'
    }
  }, cur.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink-300)',
      letterSpacing: '.06em'
    }
  }, "/ 12")), /*#__PURE__*/React.createElement("h2", {
    key: 't' + i,
    style: {
      margin: 0,
      fontSize: 'clamp(26px, 2.7vw, 40px)',
      fontWeight: 300,
      lineHeight: 1.12,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      color: 'var(--bone)',
      maxWidth: '20ch',
      animation: 'yamb-bloom var(--dur-bloom) var(--ease-bloom) both'
    }
  }, cur.titulo), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 96,
      height: 1,
      background: 'linear-gradient(90deg, var(--gold-500), transparent)'
    }
  }), /*#__PURE__*/React.createElement("p", {
    key: 'p' + i,
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: 1.75,
      color: 'var(--text-on-dark-muted)',
      maxWidth: '42ch',
      animation: 'yamb-bloom var(--dur-slow) var(--ease-bloom) both'
    }
  }, cur.texto), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      marginTop: 10
    }
  }, PETALAS.map((_, k) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, k > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      height: 1,
      flex: 1,
      background: k <= i ? 'rgba(243,172,47,.75)' : 'rgba(247,228,206,.16)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: k === i ? 13 : 11,
      height: k === i ? 13 : 11,
      borderRadius: '50%',
      flexShrink: 0,
      border: '1px solid ' + (k <= i ? 'rgba(243,172,47,.9)' : 'rgba(247,228,206,.28)'),
      background: k === i ? 'radial-gradient(circle, var(--gold-400) 0 42%, transparent 46%)' : 'transparent',
      boxShadow: k === i ? '0 0 14px rgba(243,172,47,.85)' : 'none',
      transition: 'all 380ms var(--ease-out)'
    }
  })))))));
}
function Servicos12({
  go
}) {
  return /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Desdobramentos",
    title: "O que nasce das doze p\xE9talas",
    lede: "Cada frente de trabalho \xE9 a aplica\xE7\xE3o pr\xE1tica de uma parte da marca. Os detalhes completos est\xE3o na p\xE1gina de servi\xE7os."
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "split",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: '0 56px'
    }
  }, SERVICES.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.title,
    onClick: () => go('servicos'),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '26px 4px',
      border: 'none',
      borderTop: '1px solid var(--border-subtle)',
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: 'var(--font-core)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'flower-gold-512.png',
    alt: "",
    style: {
      width: 15,
      opacity: .95,
      transform: 'rotate(' + i * 30 + 'deg)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 11,
      letterSpacing: '.08em',
      color: 'var(--gold-600)'
    }
  }, String(i + 1).padStart(2, '0'))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: 600,
      color: 'var(--text-heading)',
      lineHeight: 1.2
    }
  }, s.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, s.body), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--gold-700)',
      marginTop: 2
    }
  }, "Ver detalhes", /*#__PURE__*/React.createElement(Icon, {
    name: "ArrowRight",
    size: 14,
    color: "var(--gold-700)"
  })))))));
}
function Depoimentos() {
  const [k, setK] = React.useState(0);
  const n = DEPOIMENTOS.length;
  const move = d => setK((k + d + n) % n);
  React.useEffect(() => {
    const on = e => {
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });
  return /*#__PURE__*/React.createElement("section", {
    "data-r": "dep",
    style: {
      position: 'relative',
      overflow: 'hidden',
      padding: 'var(--section-y) 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 'clamp(520px, 76vw, 1180px)',
      aspectRatio: '1.5',
      transform: 'translate(-50%,-50%)',
      background: 'radial-gradient(closest-side, rgba(243,172,47,.34), rgba(224,154,36,.12) 46%, transparent 72%)',
      filter: 'blur(20px)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.28em',
      fontWeight: 600,
      color: 'var(--gold-400)'
    }
  }, "Quem viveu o processo"), /*#__PURE__*/React.createElement("div", {
    "data-r": "dep-palco",
    style: {
      position: 'relative',
      width: '100%',
      height: 520,
      perspective: '1600px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, DEPOIMENTOS.map((d, idx) => {
    let o = idx - k;
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    const abs = Math.abs(o),
      foco = o === 0;
    if (abs > 2) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: idx,
      onClick: () => setK(idx),
      "aria-label": 'Depoimento ' + (idx + 1),
      style: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 'clamp(260px, 25vw, 340px)',
        height: 470,
        padding: 0,
        border: 'none',
        cursor: foco ? 'default' : 'pointer',
        transform: 'translate(-50%,-50%) translateX(' + o * 300 + 'px) translateZ(' + -abs * 220 + 'px) rotateY(' + o * -16 + 'deg) scale(' + (foco ? 1 : .92) + ')',
        transformStyle: 'preserve-3d',
        transition: 'transform 760ms var(--ease-bloom), opacity 620ms var(--ease-out), filter 620ms var(--ease-out)',
        opacity: foco ? 1 : .55 - abs * .14,
        filter: foco ? 'none' : 'grayscale(.7) brightness(.62)',
        zIndex: 20 - abs,
        background: 'transparent'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 26,
        overflow: 'hidden',
        textAlign: 'left',
        background: 'linear-gradient(168deg, rgba(50,42,32,.92), rgba(12,11,13,.96))',
        border: '1px solid ' + (foco ? 'rgba(243,172,47,.55)' : 'rgba(247,228,206,.14)'),
        boxShadow: foco ? '0 44px 110px rgba(0,0,0,.7), 0 0 60px rgba(243,172,47,.22), inset 0 1px 0 rgba(255,236,204,.16)' : '0 26px 60px rgba(0,0,0,.6)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(135deg, rgba(247,228,206,.05) 0 16px, rgba(247,228,206,.015) 16px 32px)'
      }
    }), /*#__PURE__*/React.createElement("img", {
      src: A + 'flower-gold-512.png',
      alt: "",
      style: {
        position: 'absolute',
        right: -70,
        top: -70,
        width: 210,
        opacity: foco ? .22 : .1
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 16,
        padding: '26px 24px 24px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 22,
        left: 24,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '.22em',
        fontWeight: 600,
        color: 'var(--gold-400)',
        border: '1px solid rgba(243,172,47,.4)',
        padding: '5px 9px',
        borderRadius: 999
      }
    }, "foto ou v\xEDdeo"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: foco ? 17 : 15,
        lineHeight: 1.65,
        color: 'var(--bone)'
      }
    }, d.texto), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 1,
        background: 'linear-gradient(90deg, var(--gold-500), transparent)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        fontWeight: 600,
        color: 'var(--bone)'
      }
    }, d.nome), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: 'var(--text-on-dark-muted)'
      }
    }, d.empresa))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => move(-1),
    "aria-label": "Anterior",
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      border: '1px solid rgba(243,172,47,.45)',
      background: 'rgba(255,255,255,.04)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ArrowLeft",
    size: 16,
    color: "var(--gold-400)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7
    }
  }, DEPOIMENTOS.map((_, idx) => /*#__PURE__*/React.createElement("button", {
    key: idx,
    onClick: () => setK(idx),
    "aria-label": 'Ir para ' + (idx + 1),
    style: {
      width: idx === k ? 26 : 7,
      height: 7,
      borderRadius: 999,
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      background: idx === k ? 'var(--gold-500)' : 'rgba(247,228,206,.22)',
      boxShadow: idx === k ? '0 0 12px rgba(243,172,47,.7)' : 'none',
      transition: 'width 420ms var(--ease-bloom), background 420ms var(--ease-out)'
    }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => move(1),
    "aria-label": "Pr\xF3ximo",
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      border: '1px solid rgba(243,172,47,.45)',
      background: 'rgba(255,255,255,.04)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ArrowRight",
    size: 16,
    color: "var(--gold-400)"
  })))));
}
function Portas({
  go
}) {
  return /*#__PURE__*/React.createElement(Section, {
    ground: "flat"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 34,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'flower-gold-512.png',
    alt: "",
    style: {
      width: 64,
      opacity: .9
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'clamp(28px, 3.2vw, 42px)',
      fontWeight: 300,
      lineHeight: 1.16,
      letterSpacing: '-0.01em',
      color: 'var(--text-heading)',
      maxWidth: '24ch'
    }
  }, "Agora que voc\xEA conhece a ess\xEAncia da nossa marca, descubra tudo o que podemos construir juntos."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: () => go('servicos'),
    iconAfter: /*#__PURE__*/React.createElement(Icon, {
      name: "ArrowRight",
      size: 18
    })
  }, "Conhe\xE7a nossos servi\xE7os"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "lg",
    onClick: () => go('equipe'),
    iconAfter: /*#__PURE__*/React.createElement(Icon, {
      name: "ArrowRight",
      size: 18
    })
  }, "Conhe\xE7a nossa equipe"))));
}
function Home({
  go
}) {
  const fundo = {
    backgroundImage: 'url(' + A + 'grain-gradient.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundAttachment: 'fixed',
    backgroundColor: '#0A0A0B'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: fundo
  }, /*#__PURE__*/React.createElement(HeroStage, {
    go: go
  }), /*#__PURE__*/React.createElement(DozePetalas, null)), /*#__PURE__*/React.createElement(Servicos12, {
    go: go
  }), /*#__PURE__*/React.createElement("div", {
    style: fundo
  }, /*#__PURE__*/React.createElement(Depoimentos, null)), /*#__PURE__*/React.createElement(Portas, {
    go: go
  }));
}
Object.assign(window, {
  Home
});