var {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Button,
  Card,
  SectionHeading,
  Dialog,
  Toast,
  PetalMark
} = window.YAMBDesignSystem_30612d;
function Contato({
  go
}) {
  const [sent, setSent] = React.useState(false);
  const [plan, setPlan] = React.useState('mensal');
  const [ok, setOk] = React.useState(true);
  const [confirm, setConfirm] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    "data-r": "split",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr .85fr',
      gap: 72,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    overline: "Contato",
    title: "Conte sobre o momento da sua marca",
    lede: "Retornamos com um diagn\xF3stico inicial e o caminho que faz sentido para agora."
  }), /*#__PURE__*/React.createElement(Button, {variant: "primary", size: "lg", onClick: () => window.open("https://wa.me/5579991615056", "_blank", "noopener"), iconAfter: /*#__PURE__*/React.createElement(Icon, {name: "ArrowRight", size: 18})}, "Chamar no WhatsApp")), /*#__PURE__*/React.createElement(Card, {
    variant: "dark",
    padding: "xl",
    style: {
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'flower-gold-min.png',
    alt: "",
    style: {
      position: 'absolute',
      right: -70,
      bottom: -70,
      width: 240,
      opacity: .5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-overline)',
      fontWeight: 600,
      color: 'var(--gold-400)'
    }
  }, "Como come\xE7amos"), [['1', 'Diagnóstico', 'Entendemos o negócio, o momento e os objetivos.'], ['2', 'Estratégia', 'Definimos prioridades e o caminho.'], ['3', 'Planejamento', 'Entregas e cronograma com antecedência.']].map(([n, t, b]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--gold-400)',
      paddingTop: 4
    }
  }, "0", n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--bone)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--text-on-dark-muted)'
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-on-dark)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontSize: 14,
      color: 'var(--text-on-dark-muted)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "mailto:diretoria@yamb.com.br",
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      color: 'inherit',
      border: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Mail",
    size: 15,
    color: "var(--gold-400)"
  }), "diretoria@yamb.com.br"), /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/5579991615056",
    target: "_blank",
    rel: "noopener",
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      color: 'inherit',
      border: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Phone",
    size: 15,
    color: "var(--gold-400)"
  }), "(79) 99161-5056"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.instagram.com/yamb_______/",
    target: "_blank",
    rel: "noopener",
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      color: 'inherit',
      border: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Instagram",
    size: 15,
    color: "var(--gold-400)"
  }), "@yamb_______"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Clock",
    size: 15,
    color: "var(--gold-400)"
  }), "Seg. a sex., 8h \xE0s 18h")))))), sent && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 16,
      bottom: 16,
      left: 16,
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 70
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Briefing enviado",
    onClose: () => setSent(false),
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "Check",
      size: 16,
      color: "var(--success-500)"
    })
  }, "Respondemos em at\xE9 24h \xFAteis.")), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "Agendar uma conversa",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => setConfirm(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: () => {
        setConfirm(false);
        setSent(true);
      }
    }, "Confirmar"))
  }, "Escolhemos juntos um hor\xE1rio de 30 minutos para entender o momento da sua marca. Sem compromisso e sem apresenta\xE7\xE3o de proposta nesta etapa."));
}
Object.assign(window, {
  Contato
});