/* ============================================================
   MSC Tools — state module (single source of truth)
   Brand preferences, cart, library, crib profiles, quotes, and
   per-tab UI state live here. Views never keep their own copies.
   ============================================================ */
(function () {
  const MSC = (window.MSC = window.MSC || {});

  /* Feature flags. contextRead = reading material / process / geometry
     from the host CAM document. The deck presents this as the 2027
     horizon (Fusion API), so it ships off. */
  MSC.flags = { contextRead: false, latencyMs: 0 };

  const state = {
    brands: new Set(['Accupro', 'Hertel']),
    cart: [],                 // {sku, name, price, qty}
    lib: [],                  // {sku, name, price, preset}
    quotes: [],               // {id, date, lines, total}
    cribs: [],                // loaded from api.crib.profiles()
    cribSel: 0,
    cribQ: '',
    cribForm: null,           // null | 'rename' | 'new' | 'add'
    wiz: { step: 0, mats: new Set(), tool: null, feature: null, end: 'square', dia: '', loc: '', rad: '', fl: '', depth: '', coolant: '',
           thread: '3/8-16 UNC', hole: 'blind', tapStyle: '', angle: '90', width: '', holder: 'CAT40 · ER32' },
    results: null,            // last catalog.search() response
    sort: 'fit',
    view: 'cards',
    seen: 0,
    recent: [],               // recent SKU lookups
    match: null,              // last crossRef() response
    matchHist: [],
    cmp: new Set(),
    matchSeen: 0,
    xm: null,                 // active import audit {label, rows:[{...,on,pick}]}
    ui: { tab: 'find', pdp: null, pdpFrom: 'find', pdpTrigger: null, order: null },
    seq: { quote: 0, order: 0 },
  };
  MSC.state = state;

  /* tiny pub/sub so views re-render only what changed */
  const subs = {};
  MSC.on = (evt, fn) => { (subs[evt] = subs[evt] || []).push(fn); };
  MSC.emit = (evt, payload) => { (subs[evt] || []).forEach(fn => fn(payload)); };

  /* ---- derived helpers ---- */
  MSC.money = n => '$' + (+n).toFixed(2);
  MSC.cartTotal = () => state.cart.reduce((s, l) => s + l.price * l.qty, 0);
  MSC.cartCount = () => state.cart.reduce((s, l) => s + l.qty, 0);
  MSC.cribOnHand = sku => state.cribs.reduce((s, c) => s + c.lines.filter(l => l.sku === sku).reduce((a, l) => a + l.on, 0), 0);
  MSC.cribHolding = sku => state.cribs.find(c => c.lines.some(l => l.sku === sku && l.on > 0)) || null;

  /* ---- mutations (the only writers) ---- */
  MSC.setBrand = (brand, on) => {
    if (brand === null) state.brands.clear();
    else on ? state.brands.add(brand) : state.brands.delete(brand);
    MSC.emit('brands');
  };

  MSC.addCart = (item, qty = 1, opts = {}) => {
    const snap = JSON.stringify(state.cart);
    const ex = state.cart.find(l => l.sku === item.sku);
    if (ex) ex.qty += qty;
    else state.cart.push({ sku: item.sku, name: (item.brand ? item.brand + ' ' : '') + item.name, price: item.price, qty });
    MSC.emit('cart');
    if (!opts.silent) MSC.emit('toast', { msg: 'Added to staging cart — MSC #' + item.sku,
      undo: () => { state.cart = JSON.parse(snap); MSC.emit('cart'); } });
  };
  MSC.setCartQty = (i, qty) => { state.cart[i].qty = Math.max(1, qty); MSC.emit('cart'); };
  MSC.removeCart = i => { state.cart.splice(i, 1); MSC.emit('cart'); };
  MSC.clearCart = () => { state.cart = []; MSC.emit('cart'); };
  MSC.loadCart = lines => { state.cart = JSON.parse(JSON.stringify(lines)); MSC.emit('cart'); };

  MSC.addLib = (item, opts = {}) => {
    if (state.lib.find(l => l.sku === item.sku)) { if (!opts.silent) MSC.emit('toast', { msg: 'Already in Library — MSC #' + item.sku }); return false; }
    state.lib.push({ sku: item.sku, name: (item.brand ? item.brand + ' ' : '') + item.name, price: item.price, preset: item.preset || 'Material-matched preset' });
    MSC.emit('lib');
    if (!opts.silent) MSC.emit('toast', { msg: 'Added to Library — MSC #' + item.sku });
    return true;
  };
  MSC.removeLib = i => { state.lib.splice(i, 1); MSC.emit('lib'); };

  MSC.addQuote = q => { state.quotes.unshift(q); MSC.emit('quotes'); };

  /* crib profiles */
  MSC.crib = {
    current: () => state.cribs[state.cribSel],
    select: i => { state.cribSel = i; state.cribForm = null; MSC.emit('crib'); },
    rename: name => { state.cribs[state.cribSel].name = name; state.cribForm = null; MSC.emit('crib'); },
    create: name => { state.cribs.push({ name, lines: [] }); state.cribSel = state.cribs.length - 1; state.cribForm = null; MSC.emit('crib'); },
    addLine: line => { state.cribs[state.cribSel].lines.push(line); state.cribForm = null; MSC.emit('crib'); },
    adjust: (i, d) => { const l = state.cribs[state.cribSel].lines[i]; l.on = Math.max(0, l.on + d); MSC.emit('crib'); },
    setForm: f => { state.cribForm = f; MSC.emit('crib'); },
    setFilter: q => { state.cribQ = q; MSC.emit('crib', { keepFocus: true }); },
  };

  /* navigation */
  MSC.showTab = id => { state.ui.tab = id; state.ui.pdp = null; MSC.emit('nav'); };
  MSC.openPDP = (sku, trigger) => {
    state.ui.pdpFrom = state.ui.pdp ? state.ui.pdpFrom : state.ui.tab;
    state.ui.pdpTrigger = trigger || null;
    state.ui.pdp = sku; MSC.emit('nav');
  };
  MSC.closePDP = () => { state.ui.tab = state.ui.pdpFrom; state.ui.pdp = null; MSC.emit('nav'); };
})();
