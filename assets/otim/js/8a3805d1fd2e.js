var {
  Button,
  IconButton,
  Logo,
  PetalMark,
  SectionHeading,
  Badge
} = window.YAMBDesignSystem_30612d;
var A = '../../assets/';
function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.75
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.lucide) return;
    const node = window.lucide[name];
    if (!node) return;
    const el = window.lucide.createElement(node);
    el.setAttribute('width', size);
    el.setAttribute('height', size);
    el.setAttribute('stroke', color);
    el.setAttribute('stroke-width', strokeWidth);
    ref.current.innerHTML = '';
    ref.current.appendChild(el);
  }, [name, size, color, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}
var NAV = [{
  value: 'home',
  label: 'Início'
}, {
  value: 'servicos',
  label: 'Serviços'
}, {
  value: 'processo',
  label: 'Processo'
}, {
  value: 'equipe',
  label: 'Equipe'
}, {
  value: 'contato',
  label: 'Contato'
}];
var INTERNAL_URL = '../internal/index.html';

/* Barra flutuante: pílula destacada do topo, vidro sobre o fundo escuro, encolhe ao rolar. */
function SiteHeader({
  page,
  go
}) {
  const [solid, setSolid] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  const [intro, setIntro] = React.useState(0);
  React.useEffect(() => {
    const on = e => setIntro(e.detail);
    window.addEventListener('yamb-intro', on);
    return () => window.removeEventListener('yamb-intro', on);
  }, []);
  const hidden = page === 'home' && intro < .88;
  const [menu, setMenu] = React.useState(false);
  React.useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    const rz = () => setCompact(window.innerWidth < 1160);
    on();
    rz();
    window.addEventListener('scroll', on, {
      passive: true
    });
    window.addEventListener('resize', rz);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', rz);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    "data-r": "hdrwrap",
    style: {
      position: 'fixed',
      top: solid ? 12 : 22,
      left: 0,
      right: 0,
      zIndex: 60,
      display: 'flex',
      justifyContent: 'center',
      padding: '0 24px',
      pointerEvents: 'none',
      opacity: hidden ? 0 : 1,
      transform: hidden ? 'translateY(-18px)' : 'none',
      transition: 'top var(--dur-slow) var(--ease-bloom), opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-bloom)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    "data-r": "hdr",
    style: {
      pointerEvents: hidden ? 'none' : 'auto',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 12 : 28,
      minWidth: 0,
      padding: solid ? '9px 12px 9px 22px' : '12px 14px 12px 26px',
      width: '100%',
      maxWidth: 'var(--container-max)',
      borderRadius: 999,
      background: 'rgba(12,12,12,.72)',
      backdropFilter: 'var(--blur-panel)',
      WebkitBackdropFilter: 'var(--blur-panel)',
      border: '1px solid var(--border-on-dark)',
      boxShadow: solid ? '0 18px 44px rgba(0,0,0,.34)' : '0 10px 30px rgba(0,0,0,.22)',
      transition: 'padding var(--dur-slow) var(--ease-bloom), box-shadow var(--dur-slow) var(--ease-bloom)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: window.__yambHref('home'),
    onClick: e => {
      e.preventDefault();
      go('home');
    },
    style: {
      border: 'none',
      display: 'flex',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "wordmarkCream",
    height: solid ? 21 : 24,
    basePath: A
  })), /*#__PURE__*/React.createElement("nav", {
    "data-r": "nav",
    style: {
      display: 'flex',
      gap: compact ? 0 : 4,
      marginLeft: 'auto',
      minWidth: 0
    }
  }, NAV.map(l => {
    const on = page === l.value;
    return /*#__PURE__*/React.createElement("a", {
      key: l.value,
      href: window.__yambHref(l.value),
      onClick: e => {
        e.preventDefault();
        go(l.value);
      },
      style: {
        border: 'none',
        whiteSpace: 'nowrap',
        padding: compact ? '8px 10px' : '8px 15px',
        borderRadius: 999,
        fontSize: compact ? 13 : 13.5,
        fontWeight: on ? 600 : 400,
        letterSpacing: '.01em',
        color: on ? 'var(--gold-400)' : 'var(--bone)',
        background: on ? 'rgba(224,154,36,.12)' : 'transparent',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)'
      }
    }, l.label);
  })), /*#__PURE__*/React.createElement("span", {
    "data-r": "navdiv",
    style: {
      width: 1,
      height: 22,
      background: 'var(--border-on-dark)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "hdrright",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: INTERNAL_URL,
    "data-r": "internlink",
    title: "Ambiente interno",
    "aria-label": "Ambiente interno",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      gap: 7,
      padding: compact ? '9px' : '8px 14px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--bone)',
      border: '1px solid var(--border-on-dark)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Lock",
    size: 14,
    color: "var(--gold-400)"
  }), !compact && 'Ambiente interno'), /*#__PURE__*/React.createElement("span", {
    "data-r": "ctabtn",
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: () => window.open('https://wa.me/5579991615056', '_blank', 'noopener')
  }, "Fale conosco")), /*#__PURE__*/React.createElement("button", {
    "data-r": "menubtn",
    onClick: () => setMenu(m => !m),
    "aria-label": "Menu",
    style: {
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      borderRadius: 999,
      border: '1px solid var(--border-on-dark)',
      background: 'transparent',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: menu ? 'X' : 'Menu',
    size: 17,
    color: "var(--bone)"
  }))), menu && /*#__PURE__*/React.createElement("div", {
    "data-r": "menupanel",
    style: {
      position: 'absolute',
      top: 'calc(100% + 10px)',
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: 10,
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(12,12,12,.92)',
      backdropFilter: 'var(--blur-panel)',
      border: '1px solid var(--border-on-dark)',
      boxShadow: '0 18px 44px rgba(0,0,0,.4)'
    }
  }, NAV.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.value,
    href: window.__yambHref(l.value),
    onClick: e => {
      e.preventDefault();
      setMenu(false);
      go(l.value);
    },
    style: {
      border: 'none',
      padding: '12px 14px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 15,
      fontWeight: page === l.value ? 600 : 400,
      color: page === l.value ? 'var(--gold-400)' : 'var(--bone)'
    }
  }, l.label)), /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/5579991615056",
    target: "_blank",
    rel: "noopener",
    onClick: () => setMenu(false),
    style: {
      border: 'none',
      marginTop: 6,
      padding: '12px 14px',
      borderRadius: 999,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: 600,
      background: 'var(--gold-500)',
      color: 'var(--ink-900)'
    }
  }, "Fale conosco"))));
}
function SiteFooter({
  go
}) {
  return /*#__PURE__*/React.createElement("footer", {
    "data-r": "footer",
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--ground-dark)',
      color: 'var(--text-on-dark-muted)',
      padding: '80px 64px 40px'
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
      opacity: .7
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: A + 'flower-gold-min.png',
    alt: "",
    style: {
      position: 'absolute',
      right: -90,
      bottom: -110,
      width: 340,
      opacity: .28
    }
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "footgrid",
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 1fr',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'logo-yamb-wordmark-cream.png',
    alt: "YAMB",
    style: {
      height: 26,
      width: 'auto',
      objectFit: 'contain',
      alignSelf: 'flex-start'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.7,
      maxWidth: '34ch'
    }
  }, "Ag\xEAncia de marketing, branding e posicionamento. Constru\xEDmos marcas com estrat\xE9gia, identidade e inten\xE7\xE3o."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "onDark",
    label: "Instagram",
    size: "sm",
    onClick: () => window.open('https://www.instagram.com/yamb_______/', '_blank', 'noopener')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Instagram",
    size: 16,
    color: "var(--bone)"
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "onDark",
    label: "LinkedIn",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Linkedin",
    size: 16,
    color: "var(--bone)"
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "onDark",
    label: "WhatsApp",
    size: "sm",
    onClick: () => window.open('https://wa.me/5579991615056', '_blank', 'noopener')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "MessageCircle",
    size: 16,
    color: "var(--bone)"
  })))), [{
    h: 'Navegação',
    items: NAV.map(n => n.label)
  }, {
    h: 'Contato',
    items: ['diretoria@yamb.com.br', '(79) 99161-5056', '@yamb_______', 'Seg. a sex., 8h às 18h']
  }].map(col => /*#__PURE__*/React.createElement("div", {
    key: col.h,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-overline)',
      fontWeight: 600,
      color: 'var(--gold-400)'
    }
  }, col.h), col.items.map(i => i.startsWith('@') ? /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "https://www.instagram.com/yamb_______/",
    target: "_blank",
    rel: "noopener",
    style: {
      fontSize: 14,
      color: 'inherit',
      border: 'none'
    }
  }, i) : i.includes('@yamb.com.br') ? /*#__PURE__*/React.createElement("a", {
    key: i,
    href: 'mailto:' + i,
    style: {
      fontSize: 14,
      color: 'inherit',
      border: 'none'
    }
  }, i) : i.startsWith('(79)') ? /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "https://wa.me/5579991615056",
    target: "_blank",
    rel: "noopener",
    style: {
      fontSize: 14,
      color: 'inherit',
      border: 'none'
    }
  }, i) : /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 14
    }
  }, i)), col.h === 'Contato' && /*#__PURE__*/React.createElement("a", {
    href: INTERNAL_URL,
    "data-r": "internlink",
    style: {
      fontSize: 14,
      color: 'var(--gold-400)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Lock",
    size: 14,
    color: "var(--gold-400)"
  }), "Ambiente interno")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '56px auto 0',
      paddingTop: 24,
      borderTop: '1px solid var(--border-on-dark)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      fontSize: 12,
      letterSpacing: '.04em'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 YAMB \xB7 YA Marketing & Branding"), /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-overline)',
      color: 'var(--bone)'
    }
  }, "Viva o Processo")));
}
function Section({
  children,
  ground = 'cream',
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    "data-r": "sec",
    style: {
      position: 'relative',
      padding: 'var(--section-y) var(--gutter-inline-lg)',
      background: ground === 'dark' ? 'var(--ground-dark)' : ground === 'flat' ? 'var(--cream-200)' : 'var(--ground-cream)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, children));
}
Object.assign(window, {
  Icon,
  SiteHeader,
  SiteFooter,
  Section,
  NAV,
  A,
  INTERNAL_URL
});