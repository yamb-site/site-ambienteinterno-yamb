  const strip = o => {
    const {
      _u,
      ...r
    } = o || {};
    return JSON.stringify(r);
  };
  const stamp = (cur, prev, key) => {
    const pm = {};
    (prev || []).forEach(x => pm[x[key]] = x);
    const now = Date.now();
    (cur || []).forEach(x => {
      const p = pm[x[key]];
      if (!p || p !== x && strip(p) !== strip(x)) x._u = now;
    });
  };
  const mergeList = (l, r, key) => {
    const m = new Map();
    (r || []).forEach(x => m.set(x[key], x));
    (l || []).forEach(x => {
      const o = m.get(x[key]);
      if (!o || (x._u || 0) > (o._u || 0)) m.set(x[key], x);
    });
    const order = [];
    const seen = new Set();
    [...(l || []), ...(r || [])].forEach(x => {
      if (!seen.has(x[key])) {
        seen.add(x[key]);
        order.push(m.get(x[key]));
      }
    });
    return order;
  };
  const merge = (l, r) => {
    if (!r || !r.items) return l;
    const notifs = mergeList(l.notifs, r.notifs, 'id').sort((a, b) => (parseFloat(String(b.id).slice(1)) || 0) - (parseFloat(String(a.id).slice(1)) || 0)).slice(0, 30);
    return normDb({
      ...r,
      items: mergeList(l.items, r.items, 'id'),
      planos: mergeList(l.planos, r.planos, 'cliente'),
      stories: mergeList(l.stories || [], r.stories || [], 'cliente'),
      storiesFeitos: mergeList(l.storiesFeitos || [], r.storiesFeitos || [], 'id'),
      avaliacoes: mergeList(l.avaliacoes || [], r.avaliacoes || [], 'id'),
      pagosVideos: mergeList(l.pagosVideos || [], r.pagosVideos || [], 'id'),
      notifs
    });
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
