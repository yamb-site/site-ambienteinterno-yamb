function App() {
  const [page, setPage] = React.useState(window.__yambPagina());
  React.useEffect(() => {
    const f = () => { const k = window.__yambPagina(); setPage(k); window.__yambMeta(k); };
    window.addEventListener('popstate', f);
    return () => window.removeEventListener('popstate', f);
  }, []);
  const go = p => {
    setPage(p);
    const u = window.__yambHref(p);
    if (location.pathname !== u) history.pushState(null, '', u);
    window.__yambMeta(p);
    window.scrollTo(0, 0);
  };
  if (window.__yambPaginaH1 !== page) { window.__yambPaginaH1 = page; window.__yambTemH1 = page === 'home'; }
  const P = {
    home: Home,
    servicos: Servicos,
    processo: Processo,
    equipe: Equipe,
    contato: Contato
  }[page] || Home;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteHeader, {
    page: page,
    go: go
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: page === 'home' ? 0 : 58
    }
  }, /*#__PURE__*/React.createElement(P, {
    go: go
  })), /*#__PURE__*/React.createElement(SiteFooter, {
    go: go
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));