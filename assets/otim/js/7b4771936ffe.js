function App() {
  const [page, setPage] = React.useState('home');
  const go = p => {
    setPage(p);
    window.scrollTo(0, 0);
  };
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