/* ============================================================
   MSC Tools — mock API layer
   Every call the shipped product will need, with the shapes the UI
   expects. All calls return Promises; latency is MSC.flags.latencyMs.
   Data comes from the JSON fixtures in data/ (or data/fixtures.js
   when the page is opened from file://, where fetch is unavailable).
   ============================================================ */
(function () {
  const MSC = (window.MSC = window.MSC || {});
  const db = { products: {}, catalog: null, match: null, cribs: null, imports: null };
  MSC.db = db;

  const wait = v => new Promise(r => setTimeout(() => r(v), MSC.flags.latencyMs || 0));
  const clone = o => JSON.parse(JSON.stringify(o));
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const longDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* ---- feeds & speeds (README section 9) ----
     RPM = SFM × 3.82 ÷ dia · chip = .0008 + dia × .0028 · IPM = RPM × flutes × chip */
  function params(p, g) {
    const table = p.kind === 'drill' ? db.catalog.drillSfm : p.kind === 'tap' ? db.catalog.tapSfm : db.catalog.sfm;
    const sfm = table[g] || 350;
    const rpm = Math.max(10, Math.round(sfm * 3.82 / p.diaDec / 10) * 10);
    if (p.kind === 'tap') { const pitch = +(1 / p.tpi).toFixed(4); return { sfm, rpm, chip: pitch, chipLabel: 'pitch', ipm: +(rpm * pitch).toFixed(1) }; }
    const chip = +(0.0008 + p.diaDec * 0.0028).toFixed(4);
    return { sfm, rpm, chip, chipLabel: 'chip load', ipm: Math.round(rpm * (+p.fl || 2) * chip) };
  }
  MSC.params = params;
  MSC.pickGroup = mats => { for (const g of db.catalog.groupPriority) if (mats.has(g)) return g; return 'N'; };
  MSC.isCutting = p => !['holder', 'collet', 'coolant'].includes(p.kind);

  /* ---- fixture loading ---- */
  async function loadFixtures() {
    const names = ['catalog', 'match', 'cribs', 'imports'];
    if (location.protocol === 'file:' || !window.fetch) {
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/fixtures.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      names.forEach(n => db[n] = clone(window.MSC_FIXTURES[n]));
    } else {
      const got = await Promise.all(names.map(n => fetch('data/' + n + '.json').then(r => { if (!r.ok) throw new Error(n); return r.json(); })));
      names.forEach((n, i) => db[n] = got[i]);
    }
    db.catalog.products.forEach(p => {
      if (MSC.isCutting(p)) p.params = Object.fromEntries(Object.keys(db.catalog.sfm).map(g => [g, params(p, g)]));
      db.products[p.sku] = p;
    });
  }

  const api = {
    ready: null,
    load() { return (api.ready = api.ready || loadFixtures()); },

    catalog: {
      /* guided search — result sets are keyed by tool type, then by the governing ISO group */
      search({ mats, tool, geometry }) {
        const g = MSC.pickGroup(mats), t = db.catalog.resultSets[tool] ? tool : 'endmill';
        const top = db.catalog.resultSets[t][g].map(([sku, fit]) => ({ sku, fit }));
        const more = (db.catalog.moreSkus[t] || []).filter(s => !top.some(x => x.sku === s));
        return wait({ group: g, groupName: db.catalog.groupNames[g], tool: t, total: db.catalog.totals[t] || top.length, top, more, query: geometry || {} });
      },
      toolTypes() { return wait(clone(db.catalog.toolTypes)); },
      features() { return wait(clone(db.catalog.features)); },
      recommend() { return wait(clone(db.catalog.recommend)); },
      detail(sku) { const p = db.products[sku]; return wait(p ? clone(p) : null); },
      lookup(q) { const sku = String(q).replace(/[^0-9]/g, ''); return wait(db.products[sku] ? sku : null); },
      /* competitor part number → reference part + ranked MSC alternatives */
      crossRef(pn) {
        const m = db.match;
        return wait({ pn, reference: { ...m.reference, pn }, tops: clone(m.tops), pool: clone(m.pool), fit: clone(m.fit) });
      },
      /* alternatives for a product page: same kind and diameter, ranked by fit table then price */
      alternatives(sku, n = 3, group = 'N') {
        const p = db.products[sku]; if (!p || !MSC.isCutting(p)) return wait([]);
        const setFit = Object.fromEntries(((db.catalog.resultSets[p.kind] || {})[group] || []));
        const list = Object.values(db.products)
          .filter(q => q.sku !== sku && q.kind === p.kind && Math.abs(q.diaDec - p.diaDec) < 0.001)
          .map(q => ({ sku: q.sku, fit: setFit[q.sku] || db.match.fit[q.sku] || (q.coat === p.coat ? 84 : 80) }))
          .sort((a, b) => b.fit - a.fit);
        return wait(list.slice(0, n));
      },
      oftenWith(sku) {
        const p = db.products[sku]; if (!p || !MSC.isCutting(p)) return wait([]);
        return wait(clone(db.catalog.oftenWith[p.kind === 'tap' ? p.dia : p.shank] || db.catalog.oftenWith['1/2']));
      },
    },

    pricing: {
      availability(skus) {
        return wait(Object.fromEntries(skus.map(s => { const p = db.products[s]; return [s, p ? { price: p.price, stock: p.stock, lead: p.lead, shipsToday: p.stock > 0 } : null]; })));
      },
    },

    cart: {
      submit(lines) {
        MSC.state.seq.order++;
        return wait({ order: 'SO-2026-0' + (7300 + MSC.state.seq.order), date: longDate(), items: lines.reduce((s, l) => s + l.qty, 0),
          total: lines.reduce((s, l) => s + l.qty * l.price, 0), shipTo: 'Address on file · Acct #0000-DEMO', delivery: 'Next day · FREE', simulated: true });
      },
      saveQuote(lines) {
        MSC.state.seq.quote++;
        return wait({ id: 'Q-2026-0' + (400 + MSC.state.seq.quote), date: longDate(), lines: clone(lines), total: lines.reduce((s, l) => s + l.qty * l.price, 0) });
      },
      requestQuote(pn) { return wait({ pn, ticket: 'RFQ-' + today().replace(/-/g, '') + '-DEMO' }); },
    },

    crib: {
      profiles() { return wait(clone(db.cribs)); },
      save(profiles) { db.cribs = clone(profiles); return wait({ saved: true }); },
      draftPO(profile) {
        const low = profile.lines.filter(l => l.on < l.min && l.msc), excluded = profile.lines.filter(l => l.on < l.min && !l.msc);
        const rows = low.map(l => ({ ...l, qty: 2 * l.min - l.on }));
        return wait({ po: 'PO-' + today().replace(/-/g, '-').slice(0, 4) + '-' + today().slice(5).replace('-', '') + '-DEMO', date: longDate(), account: '#0000-DEMO',
          profile: profile.name, rule: 'reorder to 2× min', rows, excluded, total: rows.reduce((s, r) => s + r.qty * r.price, 0) });
      },
      sendPO(po) { return wait({ sent: true, po: po.po }); },
    },

    fusion: {
      readLibrary() { return wait(clone(db.imports.fusion)); },
      writeLibrary(tools) { return wait({ format: 'Autodesk Fusion (.tools)', written: tools.length, includes: 'geometry + presets' }); },
    },
    inventor: {
      /* the Inventor path is not yet defined — read rejects so the UI can say so honestly */
      readLibrary() { return Promise.reject(new Error('Inventor tool-library import is not available until the Inventor path is defined.')); },
      writeLibrary(tools) { return wait({ format: 'Autodesk Inventor tool library', written: tools.length, includes: 'geometry + presets' }); },
    },
    files: {
      parseToolList(name) { const s = clone(db.imports.sample); s.label = name || s.label; return wait(s); },
    },
  };
  MSC.api = api;
})();
