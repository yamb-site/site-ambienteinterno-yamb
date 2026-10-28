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
  }), /*#__PURE__*/React.createElement("div", {
    "data-r": "grid1",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Nome",
    placeholder: "Seu nome"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Empresa",
    placeholder: "Nome da marca"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    placeholder: "nome@empresa.com",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "Mail",
      size: 17,
      color: "var(--text-muted)"
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "WhatsApp",
    placeholder: "(00) 00000-0000",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "Phone",
      size: 17,
      color: "var(--text-muted)"
    })
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Segmento",
    options: ['Moda', 'Saúde', 'Imobiliário', 'Arquitetura', 'Gastronomia', 'Eventos', 'Educação', 'Beleza', 'Outro']
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Principal necessidade",
    options: ['Branding', 'Redes sociais', 'Tráfego pago', 'Audiovisual', 'Site', 'Consultoria']
  })), /*#__PURE__*/React.createElement(Textarea, {
    label: "Onde a sua marca est\xE1 hoje?",
    rows: 4,
    placeholder: "Estamos reposicionando a marca e precisamos organizar a comunica\xE7\xE3o\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px 24px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-heading)'
    }
  }, "Formato"), /*#__PURE__*/React.createElement(Radio, {
    name: "plano",
    label: "Acompanhamento mensal",
    checked: plan === 'mensal',
    onChange: () => setPlan('mensal')
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "plano",
    label: "Projeto pontual",
    checked: plan === 'projeto',
    onChange: () => setPlan('projeto')
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Aceito receber contato pelo WhatsApp",
    checked: ok,
    onChange: setOk
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: () => setSent(true),
    iconAfter: /*#__PURE__*/React.createElement(Icon, {
      name: "ArrowRight",
      size: 18
    })
  }, "Enviar briefing"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "lg",
    onClick: () => setConfirm(true)
  }, "Agendar conversa"))), /*#__PURE__*/React.createElement(Card, {
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