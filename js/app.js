/* ============================================================
   MSC Tools — views and interactions
   Data: MSC.api (js/api.js) · State: MSC.state (js/state.js)
   All data simulated (README section 10).
   ============================================================ */
(async function () {
  const MSC = window.MSC, S = MSC.state, api = MSC.api, money = MSC.money;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = sku => MSC.db.products[sku];
  const narrow = () => $('#panel').offsetWidth < 720;
  let rsT; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => {
    if (S.results && !$('#findResults').hidden && S.view === 'compare') renderResults();
    if (S.match && !$('#matchOut').hidden && S.cmp.size) renderMatch();
    if (S.ui.tab === 'crib') renderCrib(); }, 150); });

  await api.load();
  S.cribs = await api.crib.profiles();

  /* ============ shaded product renders (no photography) ============ */
  const COATS = { altin: ['#6B5E7E', '#372E47', '#8E82A4'], tialn: ['#565064', '#2A2434', '#7A7490'], tin: ['#E2BE4E', '#96771C', '#F2DC90'],
    ticn: ['#617082', '#3A4451', '#8493A6'], zrn: ['#DCCF9A', '#A8985C', '#F0E8C8'], bright: ['#C4CAD3', '#848D99', '#EDF0F4'] };
  let uid = 0;
  function toolArt(kind, coat) {
    const [c1, c2, hi] = COATS[coat] || COATS.bright, u = 'g' + (++uid);
    const steel = `<linearGradient id="${u}s" x1="0" x2="1"><stop offset="0" stop-color="#7E8791"/><stop offset=".28" stop-color="#E9EDF2"/><stop offset=".55" stop-color="#B6BDC6"/><stop offset="1" stop-color="#6B737E"/></linearGradient>`;
    const coatG = `<linearGradient id="${u}c" x1="0" x2="1"><stop offset="0" stop-color="${c2}"/><stop offset=".3" stop-color="${hi}"/><stop offset=".55" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
    let b = '';
    if (kind === 'drill') b = `<rect x="26" y="4" width="12" height="18" fill="url(#${u}s)"/><path d="M26 22h12l-1 26L32 60 27 48Z" fill="url(#${u}c)"/><path d="M28 24C35 32,30 42,34 52M35 24C29 34,35 42,31 54" stroke="${hi}" stroke-width="1" fill="none" opacity=".8"/>`;
    else if (kind === 'chamfer') b = `<rect x="26" y="4" width="12" height="30" fill="url(#${u}s)"/><path d="M26 34h12v10l-6 12-6-12Z" fill="url(#${u}c)"/><path d="M28 36l3 16M35 36l-2 16" stroke="${hi}" stroke-width="1" opacity=".8"/>`;
    else if (kind === 'ball') b = `<rect x="26" y="4" width="12" height="22" fill="url(#${u}s)"/><path d="M26 26h12v26a6 6 0 0 1-12 0Z" fill="url(#${u}c)"/><path d="M29 28C35 36,30 44,33 54M35 28C30 38,36 44,31 52" stroke="${hi}" stroke-width="1" fill="none" opacity=".8"/>`;
    else if (kind === 'tap') b = `<rect x="27" y="4" width="10" height="8" fill="#6B737E"/><rect x="26" y="12" width="12" height="20" fill="url(#${u}s)"/><path d="M25 32h14v20l-7 6-7-6Z" fill="url(#${u}c)"/><path d="M26 36h12M26 40h12M26 44h12M26 48h12" stroke="${c2}" stroke-width="1.2" opacity=".8"/>`;
    else if (kind === 'holder') b = `<path d="M22 4h20l-4 16H26Z" fill="url(#${u}s)"/><rect x="18" y="20" width="28" height="10" fill="#8B939D"/><rect x="24" y="30" width="16" height="22" fill="url(#${u}s)"/><path d="M22 52h20l-3 8H25Z" fill="#6B737E"/>`;
    else if (kind === 'collet') b = `<path d="M20 10h24l-4 42H24Z" fill="url(#${u}s)"/><path d="M32 10v42M26 12l2 38M38 12l-2 38" stroke="#6B737E" stroke-width="1"/><rect x="27" y="4" width="10" height="8" fill="#6B737E"/>`;
    else if (kind === 'coolant') b = `<rect x="18" y="14" width="28" height="42" rx="2" fill="#2F6DC9"/><rect x="18" y="14" width="28" height="42" rx="2" fill="url(#${u}s)" opacity=".18"/><rect x="26" y="6" width="12" height="8" fill="#012169"/><rect x="22" y="26" width="20" height="14" fill="#fff" opacity=".9"/>`;
    else b = `<rect x="26" y="4" width="12" height="20" fill="url(#${u}s)"/><path d="M27 24h10l1 4v30h-14v-30Z" fill="url(#${u}c)"/><path d="M28 26C36 36,29 46,35 58M33 25C27 37,35 45,29 57M37 27C32 39,38 47,33 58" stroke="${hi}" stroke-width="1.1" fill="none" opacity=".85"/><path d="M24 58h16l-3 3h-10Z" fill="${c2}"/>`;
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${steel}${coatG}</defs><ellipse cx="32" cy="61" rx="14" ry="2" fill="#12161B" opacity=".12"/>${b}</svg>`;
  }
  const art = p => toolArt(p.kind, p.coat);

  /* ============ toast (bottom-center, Undo on cart additions) ============ */
  let toastT;
  function toast(msg, undoFn) {
    const t = $('#toast');
    t.innerHTML = `<svg class="t-ic" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><span></span>${undoFn ? '<button class="t-undo">Undo</button>' : ''}`;
    t.querySelector('span').textContent = msg;
    t.style.pointerEvents = undoFn ? 'auto' : 'none';
    if (undoFn) t.querySelector('.t-undo').onclick = () => { undoFn(); hide(); };
    t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(hide, 2800);
    function hide() { t.classList.remove('show'); t.style.pointerEvents = 'none'; }
  }
  MSC.on('toast', ({ msg, undo }) => toast(msg, undo));

  /* ============ shared fragments ============ */
  const star = brand => S.brands.has(brand) ? '<span class="star" title="Preferred brand">★</span>' : '';
  const specLine = p => !MSC.isCutting(p) ? esc(p.desc)
    : p.kind === 'tap' ? `${p.thread} · ${p.tapStyle} · ${p.chamferType} · ${p.coatName}`
    : p.kind === 'drill' ? `Ø ${p.dia}" · ${p.helix} · ${p.loc}${p.coolant ? ' · coolant-thru' : ''} · ${p.coatName}`
    : p.kind === 'chamfer' ? `${p.helix} · ${p.fl}FL · Ø ${p.dia}" shank · ${p.coatName}`
    : `Ø ${p.dia}" · ${p.fl}FL · LOC ${p.loc}" · ${p.coatName}`;
  const stockLine = p => `${p.stock} in stock · ${p.lead}`;
  const presetLine = (p, g) => `ISO ${g} preset · ${p.params[g].rpm.toLocaleString()} RPM · ${p.params[g].ipm} IPM`;
  const currentGroup = () => MSC.pickGroup(S.wiz.mats);
  const cribBadge = sku => { const n = MSC.cribOnHand(sku); return n ? `<span class="stock-crib">${n} in your crib</span>` : ''; };
  const pdpLink = (sku, inner) => `<button class="pdp-link" data-pdp="${sku}">${inner}</button>`;
  const savings = (base, alt) => {
    if (!base) return '';
    const d = Math.round((alt - base) / base * 100);
    if (d < 0) return `<span class="savechip">Save ${money(base - alt)} · ${d}%</span>`;
    if (d > 0) return `<span class="upchip">+${d}%</span>`;
    return `<span class="upchip">±0%</span>`;
  };

  /* product card: Find results, Match alternatives */
  function prodCard(p, o = {}) {
    return `<article class="rescard ${o.best ? 'best' : ''}" data-sku="${p.sku}">
      <button class="thumb" data-pdp="${p.sku}" aria-label="Open product page for ${esc(p.title)}">${art(p)}</button>
      <div class="rc-main">
        <div class="rc-name">${star(p.brand)}${pdpLink(p.sku, esc(p.brand) + ' — ' + esc(p.title))}</div>
        <div class="rc-sku mono">MSC #${p.sku}</div>
        <div class="rc-spec">${specLine(p)}</div>
        ${o.preset ? `<div class="rc-preset mono">${o.preset}</div>` : ''}
        <div class="rc-meta"><span class="stock-ok">${o.stock || stockLine(p)}</span>${cribBadge(p.sku)}${o.chip || ''}</div>
      </div>
      <div class="rc-side">
        <div><div class="rc-price mono">${money(p.price)} <small>ea.</small></div>${o.fit ? `<div class="rc-fitlab"><span class="fitpct">${o.fit}%</span> fit</div>` : ''}</div>
        <div class="rc-actions">${o.actions || `<button class="tbtn sm" data-lib="${p.sku}">+ Library</button><button class="tbtn sm pri" data-cart="${p.sku}">+ Cart</button>`}</div>
      </div>
    </article>`;
  }
  const rowRes = (p, o = {}) => `<div class="rowres" data-sku="${p.sku}">${star(p.brand)}${pdpLink(p.sku, `<b>${esc(p.brand)}</b> ${esc(p.title)}`)}
      <span class="mono muted">${p.sku}</span>${o.fit ? `<span class="fitpct">${o.fit}%</span>` : ''}<span class="rr-p mono">${money(p.price)}</span>${o.chip || ''}
      ${o.actions || `<button class="tbtn sm" data-lib="${p.sku}">+ Library</button><button class="tbtn sm pri" data-cart="${p.sku}">+ Cart</button>`}</div>`;

  /* delegated add-to-cart / add-to-library / open-PDP for every view */
  document.addEventListener('click', e => {
    const t = s => e.target.closest(s); let b;
    if ((b = t('[data-pdp]'))) { MSC.openPDP(b.dataset.pdp, b); return; }
    if ((b = t('[data-cart]'))) { const p = P(b.dataset.cart); MSC.addCart({ sku: p.sku, brand: p.brand, name: p.title, price: p.price }); return; }
    if ((b = t('[data-lib]'))) { const p = P(b.dataset.lib); const g = currentGroup();
      MSC.addLib({ sku: p.sku, brand: p.brand, name: p.title, price: p.price, preset: p.params ? presetLine(p, g) : 'Accessory · no preset' }); return; }
  });

  /* ============ navigation ============ */
  function renderNav() {
    const pdp = !!S.ui.pdp;
    $$('.p-tab').forEach(b => b.setAttribute('aria-selected', !pdp && b.dataset.tab === S.ui.tab));
    $$('.p-view').forEach(v => { const on = pdp ? v.id === 'view-pdp' : v.id === 'view-' + S.ui.tab; v.classList.toggle('on', on); v.hidden = !on; });
    $('#pbody').scrollTop = 0;
    if (pdp) renderPDP(S.ui.pdp);
  }
  MSC.on('nav', renderNav);
  $$('.p-tab').forEach(b => b.addEventListener('click', () => MSC.showTab(b.dataset.tab)));
  $('.p-tabs').addEventListener('keydown', e => {
    const tabs = $$('.p-tab'), i = tabs.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { tabs[(i + 1) % tabs.length].focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { tabs[(i - 1 + tabs.length) % tabs.length].focus(); e.preventDefault(); }
  });
  $('#barOpen').addEventListener('click', () => MSC.showTab('cart'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.ui.pdp) closePDP(); });
  function closePDP() { const t = S.ui.pdpTrigger; MSC.closePDP(); if (t && document.contains(t)) t.focus(); else $('#pbody').focus(); }

  /* ============ status bar + badges ============ */
  function renderBar() {
    const n = MSC.cartCount();
    $('#barCount').textContent = n + (n === 1 ? ' item' : ' items');
    $('#barTotal').textContent = money(MSC.cartTotal());
    $('#cartBadge').textContent = n || ''; $('#libBadge').textContent = S.lib.length || '';
    const cb = $('#cartbar'); cb.classList.remove('pulse'); void cb.offsetWidth; cb.classList.add('pulse');
  }
  MSC.on('cart', () => { renderBar(); renderCart(); });
  MSC.on('lib', () => { renderBar(); renderLib(); });

  /* ============ preferred brands — one setting, three doors ============ */
  const BRANDS = ['Accupro', 'Hertel', 'SGS', 'Niagara', 'Kennametal', 'OSG'];
  const brandChips = cls => BRANDS.map(b => `<button class="chip ${cls}" data-bb="${b}" aria-pressed="${S.brands.has(b)}">${b}</button>`).join('')
    + `<button class="chip ${cls}" data-bb="" aria-pressed="${S.brands.size === 0}">No preference</button>`;
  function renderBrandBars() {
    ['#brandsMatch', '#brandsXm'].forEach(sel => { $(sel).innerHTML = '<span class="bb-lab">Preferred brands</span>' + brandChips('xs'); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bb]'); if (!b) return;
    const v = b.dataset.bb; v ? MSC.setBrand(v, !S.brands.has(v)) : MSC.setBrand(null);
  });
  MSC.on('brands', () => {
    renderBrandBars();
    if (!$('#wizard').hidden && S.wiz.step === 2) renderWiz();
    if (S.results && !$('#findResults').hidden) renderResults();
    if (S.match && !$('#matchOut').hidden) renderMatch();
    if (S.xm) renderXM();
  });

  /* ============ FIND — advisor wizard: Material → Tool → Geometry → Brands ============ */
  const ISO = [['P', 'Steel', 'Carbon & alloy steels'], ['M', 'Stainless', 'Austenitic, duplex'], ['K', 'Cast iron', 'Gray, ductile, CGI'],
    ['N', 'Non-ferrous', 'Aluminum, copper, brass'], ['S', 'Superalloys / Ti', 'Inconel, titanium'], ['H', 'Hardened', '45–65 HRC']];
  const TOOL_TYPES = MSC.db.catalog.toolTypes, FEATURES = MSC.db.catalog.features, REC = MSC.db.catalog.recommend;
  const toolDef = id => TOOL_TYPES.find(t => t.id === id);
  const TOOL_ART = { endmill: () => toolArt('endmill', 'altin'), ball: () => toolArt('ball', 'altin'), drill: () => toolArt('drill', 'tin'), tap: () => toolArt('tap', 'tin'), chamfer: () => toolArt('chamfer', 'altin') };
  const STEPS = ['Material', 'Tool', 'Geometry', 'Brands'];
  const ctx = txt => MSC.flags.contextRead ? `<span class="ctx">${txt}</span>` : '';
  const THREADS = ['1/4-20 UNC', '5/16-18 UNC', '3/8-16 UNC', '1/2-13 UNC', 'M6 × 1', 'M8 × 1.25', 'M10 × 1.5'];

  /* recommendations derived from material + feature; used for hints and for blank fields */
  function recs() {
    const w = S.wiz, g = currentGroup(), feat = FEATURES.find(f => f.id === w.feature), r = {};
    r.fl = (feat && feat.fl) || REC.flutes[g]; r.flWhy = feat && feat.fl ? feat.why.split(' — ')[1] : REC.fluteWhy[g];
    r.tapStyle = g === 'N' && w.hole === 'blind' ? REC.tapStyleN : REC.tapStyle[w.hole || 'blind'];
    r.tapWhy = r.tapStyle === 'Forming' ? 'no chips to evacuate in aluminum' : w.hole === 'through' ? 'pushes chips ahead in a through hole' : 'pulls chips up and out of a blind hole';
    r.coolant = w.depth && w.dia && (+w.depth / +w.dia) > REC.coolantDepth;
    r.dia = { endmill: '.500', ball: '.500', drill: '.250', chamfer: '.500' }[w.tool] || '.500';
    r.loc = { endmill: '1.25', ball: '1.25' }[w.tool] || '';
    return r;
  }
  function geometrySummary() {
    const w = S.wiz, t = w.tool; if (!t) return '—';
    if (t === 'tap') return `${w.thread || '3/8-16 UNC'} · ${w.hole || 'blind'}`;
    if (t === 'drill') return `Ø ${w.dia || '.250'}${w.depth ? ' × ' + w.depth + ' deep' : ''}${w.coolant ? ' · coolant-thru' : ''}`;
    if (t === 'chamfer') return `${w.angle || '90'}°${w.width ? ' · ' + w.width + ' wide' : ''}`;
    return `Ø ${w.dia || '.500'}${w.end === 'radius' && w.rad ? ' · R ' + w.rad : ''} · LOC ${w.loc || '—'}${w.fl ? ' · ' + w.fl + 'FL' : ''}`;
  }
  function railVal(i) {
    const w = S.wiz;
    return [[...w.mats].join(' + ') || '—',
      w.tool ? toolDef(w.tool).name + (w.feature ? ' · recommended' : '') : '—',
      geometrySummary(),
      S.brands.size ? [...S.brands].join(', ') : 'No preference'][i];
  }
  function renderRail() {
    $('#steprail').innerHTML = STEPS.map((s, i) => `<button role="tab" aria-selected="${i === S.wiz.step}" class="${i === S.wiz.step ? 'cur' : i < S.wiz.step ? 'done' : ''}" data-go="${i}">
      <span class="sr-lab">${i + 1} · ${s}</span><span class="sr-val mono">${esc(railVal(i))}</span></button>`).join('');
  }
  $('#steprail').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { S.wiz.step = +b.dataset.go; renderWiz(); } });
  $('#steprail').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && S.wiz.step < 3) { S.wiz.step++; renderWiz(); $('#steprail .cur').focus(); }
    if (e.key === 'ArrowLeft' && S.wiz.step > 0) { S.wiz.step--; renderWiz(); $('#steprail .cur').focus(); }
  });
  const fld = (id, label, inner, hint) => `<div class="fld"><label for="${id}">${label}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  const txt = (id, key, ph, mono = true) => `<input id="${id}" class="${mono ? 'mono' : ''}" value="${esc(S.wiz[key] || '')}" placeholder="${ph}" inputmode="decimal" autocomplete="off">`;
  const sel = (id, key, opts) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${S.wiz[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;

  let lastStep = 0;
  function renderWiz() {
    $('#findResults').hidden = true; $('#wizard').hidden = false;
    renderRail();
    const w = S.wiz, el = $('#wizStep'), g = currentGroup(), r = recs();
    /* native-style slide between steps; re-trigger the animation on every render of a new step */
    if (w.step !== lastStep) { el.classList.toggle('back', w.step < lastStep); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; lastStep = w.step; }
    if (w.step === 0) {
      el.innerHTML = `<h3 class="p-lab">What are you cutting?</h3>
        <p class="p-note">Pick the workpiece material — any combination. Coatings and presets follow the most conservative group selected.</p>
        <div class="iso-grid">${ISO.map(([L, n, sub]) => `
          <button class="iso" data-iso="${L}" aria-pressed="${w.mats.has(L)}">
            <span class="iso-letter iso-${L.toLowerCase()}">${L}</span><span class="iso-name">${n}</span><span class="iso-sub">${sub}</span>
            ${L === 'N' ? ctx('from model · AL 6061') : ''}</button>`).join('')}</div>`;
      $$('[data-iso]').forEach(b => b.addEventListener('click', () => { const L = b.dataset.iso; w.mats.has(L) ? w.mats.delete(L) : w.mats.add(L); renderWiz(); }));
    }
    if (w.step === 1) {
      const feat = FEATURES.find(f => f.id === w.feature);
      el.innerHTML = `<h3 class="p-lab">What tool do you need?</h3>
        <p class="p-note">Pick the tool type if you know it. If not, describe the feature and MSC Tools recommends one.</p>
        <div class="proc-grid">${TOOL_TYPES.map(t => `<button class="proc" data-tool="${t.id}" aria-pressed="${w.tool === t.id && !w.feature}"><span class="proc-ic thumb-sm">${TOOL_ART[t.id]()}</span><span>${t.name}</span><span class="proc-sub">${t.sub}</span></button>`).join('')}</div>
        <h3 class="p-lab">Not sure? Describe the feature</h3>
        <div class="optrow">${FEATURES.map(f => `<button class="chip" data-feat="${f.id}" aria-pressed="${w.feature === f.id}">${f.label}</button>`).join('')}</div>
        ${feat ? `<div class="advice"><b>Recommended: ${toolDef(feat.tool).name}.</b> ${esc(feat.why.split(' — ')[1].replace(/^./, c => c.toUpperCase()))}. ${ctx('from setup · 2D Pocket → Pocket_3')}</div>` : ''}`;
      $$('[data-tool]').forEach(b => b.addEventListener('click', () => { w.tool = b.dataset.tool; w.feature = null; w.end = w.tool === 'ball' ? 'ball' : 'square'; w.fl = ''; renderWiz(); }));
      $$('[data-feat]').forEach(b => b.addEventListener('click', () => {
        const f = FEATURES.find(x => x.id === b.dataset.feat);
        if (w.feature === f.id) { w.feature = null; renderWiz(); return; }
        w.feature = f.id; w.tool = f.tool; w.end = f.end || 'square'; w.fl = f.fl || ''; renderWiz();
      }));
    }
    if (w.step === 2) {
      if (!w.tool) {
        el.innerHTML = `<h3 class="p-lab">Geometry</h3><div class="refine-note">Pick a tool type or describe the feature first. <button class="linkbtn" id="goTool">Go to step 2</button></div>`;
        $('#goTool').onclick = () => { w.step = 1; renderWiz(); };
      } else {
        const T = toolDef(w.tool);
        let form = '';
        if (w.tool === 'endmill' || w.tool === 'ball') form = `
          ${fld('fDia', 'Diameter (in)', txt('fDia', 'dia', r.dia), `Recommended ${r.dia} for the ${w.feature ? FEATURES.find(f => f.id === w.feature).label.toLowerCase() : 'cut'}`)}
          ${w.tool === 'endmill' ? fld('fEnd', 'End style', sel('fEnd', 'end', [['square', 'Square'], ['radius', 'Corner radius']]), 'Square unless the floor needs a fillet') : ''}
          ${w.end === 'radius' ? fld('fRad', 'Corner radius (in)', txt('fRad', 'rad', '.030'), 'Small radii last longer at the corner') : ''}
          ${fld('fLoc', 'Cut depth / LOC (in)', txt('fLoc', 'loc', r.loc), 'Match the deepest pass; shorter is stiffer')}
          ${fld('fFl', 'Flutes', sel('fFl', 'fl', [['', `Recommended · ${r.fl}`], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']]), `${r.fl} flutes — ${r.flWhy}`)}
          ${fld('fHold', 'Holder', sel('fHold', 'holder', [['CAT40 · ER32', 'CAT40 · ER32'], ['CAT40 · shrink fit', 'CAT40 · shrink fit'], ['BT30 · ER16', 'BT30 · ER16']]))}`;
        if (w.tool === 'drill') form = `
          ${fld('fDia', 'Hole diameter (in)', txt('fDia', 'dia', r.dia), 'Decimal, fraction, or drill size — #7 = .201')}
          ${fld('fDepth', 'Hole depth (in)', txt('fDepth', 'depth', '.75'), r.coolant ? 'Deeper than 3× diameter — coolant-through recommended' : 'Coolant-through recommended past 3× diameter')}
          ${fld('fCool', 'Coolant-through', sel('fCool', 'coolant', [['', `Recommended · ${r.coolant ? 'yes' : 'not needed'}`], ['yes', 'Yes'], ['no', 'No']]))}
          ${fld('fHold', 'Holder', sel('fHold', 'holder', [['CAT40 · ER32', 'CAT40 · ER32'], ['CAT40 · shrink fit', 'CAT40 · shrink fit'], ['BT30 · ER16', 'BT30 · ER16']]))}`;
        if (w.tool === 'tap') form = `
          ${fld('fThread', 'Thread size', sel('fThread', 'thread', THREADS.map(t => [t, t])), 'The demo catalog carries 3/8-16 UNC')}
          ${fld('fHole', 'Hole type', sel('fHole', 'hole', [['blind', 'Blind'], ['through', 'Through']]), 'Blind holes need a bottoming chamfer')}
          ${fld('fStyle', 'Tap style', sel('fStyle', 'tapStyle', [['', `Recommended · ${r.tapStyle}`], ['Spiral flute', 'Spiral flute'], ['Spiral point', 'Spiral point'], ['Forming', 'Forming']]), `${r.tapStyle} — ${r.tapWhy}`)}
          ${fld('fHold', 'Holder', sel('fHold', 'holder', [['CAT40 · ER32', 'CAT40 · ER32'], ['CAT40 · tension-compression', 'CAT40 · tension-compression'], ['BT30 · ER16', 'BT30 · ER16']]), 'Rigid tapping: ER32 is fine; otherwise tension-compression')}`;
        if (w.tool === 'chamfer') form = `
          ${fld('fAngle', 'Included angle', sel('fAngle', 'angle', [['90', '90° — edge break, 82°/90° countersink'], ['60', '60° — center drill, V-groove'], ['45', '45° — steep chamfer']]))}
          ${fld('fWidth', 'Max chamfer width (in)', txt('fWidth', 'width', '.060'), 'Sets the minimum tool diameter')}
          ${fld('fHold', 'Holder', sel('fHold', 'holder', [['CAT40 · ER32', 'CAT40 · ER32'], ['CAT40 · shrink fit', 'CAT40 · shrink fit'], ['BT30 · ER16', 'BT30 · ER16']]))}`;
        el.innerHTML = `<h3 class="p-lab">${T.name} geometry</h3>
          <p class="p-note">Every field is optional. Blank fields use the recommended value for ISO ${g} (${MSC.db.catalog.groupNames[g]}), and the results say which values were assumed.</p>
          <div class="formgrid">${form}</div>`;
        const bind = (id, key, rerender) => { const e = $('#' + id); if (!e) return; e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', ev => { w[key] = ev.target.value; rerender ? renderWiz() : renderRail(); }); };
        bind('fDia', 'dia', w.tool === 'drill'); bind('fRad', 'rad'); bind('fLoc', 'loc'); bind('fFl', 'fl'); bind('fEnd', 'end', true); bind('fHold', 'holder');
        bind('fDepth', 'depth', true); bind('fCool', 'coolant'); bind('fThread', 'thread'); bind('fHole', 'hole', true); bind('fStyle', 'tapStyle'); bind('fAngle', 'angle'); bind('fWidth', 'width');
      }
    }
    if (w.step === 3) {
      el.innerHTML = `<h3 class="p-lab">Preferred brands</h3>
        <p class="p-note">One setting for the whole add-in. Preferred brands rank first in Find, Match, and Import &amp; Match.</p>
        <div class="optrow">${brandChips('')}</div>`;
    }
    $('#wizBack').disabled = w.step === 0;
    $('#wizNext').textContent = w.step === 3 ? 'See results' : 'Next';
    renderRecent();
  }
  $('#wizBack').addEventListener('click', () => { if (S.wiz.step > 0) { S.wiz.step--; renderWiz(); } });
  $('#wizNext').addEventListener('click', async () => {
    if (S.wiz.step < 3) { S.wiz.step++; renderWiz(); return; }
    if (!S.wiz.tool) { toast('Pick a tool type or describe the feature first'); S.wiz.step = 1; renderWiz(); return; }
    S.seen = 0; await runSearch();
  });
  /* what the search actually used — blanks filled with recommendations */
  function effectiveGeometry() {
    const w = S.wiz, r = recs(), assumed = [], geo = {};
    const use = (key, val, label) => { if (w[key]) geo[key] = w[key]; else { geo[key] = val; if (val) assumed.push(label); } };
    if (w.tool === 'endmill' || w.tool === 'ball') { use('dia', r.dia, `Ø ${r.dia}`); use('loc', r.loc, `LOC ${r.loc}`); use('fl', r.fl, `${r.fl} flutes (${r.flWhy})`); }
    if (w.tool === 'drill') { use('dia', r.dia, `Ø ${r.dia}`); use('coolant', r.coolant ? 'yes' : 'no', r.coolant ? 'coolant-through (deep hole)' : ''); }
    if (w.tool === 'tap') { use('thread', '3/8-16 UNC', '3/8-16 UNC'); use('hole', 'blind', 'blind hole'); use('tapStyle', r.tapStyle, `${r.tapStyle.toLowerCase()} (${r.tapWhy})`); }
    if (w.tool === 'chamfer') { use('angle', '90', '90°'); }
    return { geo, assumed };
  }
  async function runSearch() {
    const { geo, assumed } = effectiveGeometry();
    S.results = await api.catalog.search({ mats: S.wiz.mats, tool: S.wiz.tool, geometry: geo });
    S.results.assumed = assumed; renderResults();
  }

  /* SKU lookup + recent searches */
  function renderRecent() {
    const r = $('#recentRow');
    r.innerHTML = S.recent.length ? '<span class="bb-lab">Recent</span>' + S.recent.map(s => `<button type="button" class="chip xs mono" data-pdp="${s}">${s}</button>`).join('') : '';
  }
  async function lookup(q, trigger) {
    const sku = await api.catalog.lookup(q);
    if (!sku) { toast('MSC #' + q + ' is not in the demo catalog'); return false; }
    S.recent = [sku, ...S.recent.filter(s => s !== sku)].slice(0, 5); renderRecent();
    MSC.openPDP(sku, trigger); return true;
  }
  $('#skuForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#skuIn').value.trim() || '09990412'; lookup(v, $('#skuIn')); });

  /* ============ FIND — results ============ */
  function sortPref(list) {
    return [...list].sort((a, b) => {
      const pref = S.brands.has(b.p.brand) - S.brands.has(a.p.brand); if (pref) return pref;
      if (S.sort === 'price') return a.p.price - b.p.price;
      if (S.sort === 'lead') return (/next/i.test(b.p.lead) - /next/i.test(a.p.lead)) || b.fit - a.fit;
      return b.fit - a.fit;
    });
  }
  function renderResults() {
    $('#wizard').hidden = true; const R = $('#findResults'); R.hidden = false;
    const res = S.results, g = res.group, multi = S.wiz.mats.size > 1, T = toolDef(res.tool), q = res.query;
    const top = sortPref(res.top.map(t => ({ p: P(t.sku), fit: t.fit })));
    const sizeLabel = res.tool === 'tap' ? q.thread : res.tool === 'chamfer' ? q.angle + '°' : 'Ø ' + q.dia;
    const head = `<div class="res-head">
        <h2 class="p-h">Top ${top.length} of ${res.total}</h2>
        <select class="sortsel" id="sortSel" aria-label="Sort results">
          <option value="fit" ${S.sort === 'fit' ? 'selected' : ''}>Sort: best fit</option>
          <option value="price" ${S.sort === 'price' ? 'selected' : ''}>Sort: lowest price</option>
          <option value="lead" ${S.sort === 'lead' ? 'selected' : ''}>Sort: fastest</option></select>
        <div class="viewtog" role="group" aria-label="Result view">
          <button data-v="cards" aria-pressed="${S.view === 'cards'}">Cards</button><button data-v="compare" aria-pressed="${S.view === 'compare'}">Compare</button></div>
        <button class="tbtn sm" id="newSearch">New search</button></div>
      <p class="p-note"><b>${esc(sizeLabel)} ${T.plural}</b> for ISO ${[...S.wiz.mats].join(' + ') || 'N'}${multi ? ` — <b>ISO ${g} (${res.groupName}) governs</b> coatings and presets, the most conservative group selected` : ` (${res.groupName})`}. ★ preferred brands rank first.${res.assumed.length ? `<br>Recommended values used: ${res.assumed.map(esc).join(' · ')}.` : ''}</p>`;

    let body = '';
    if (S.view === 'cards') body = top.map((t, i) => prodCard(t.p, { fit: t.fit, preset: presetLine(t.p, g), best: i === 0 })).join('');
    else if (narrow()) {
      /* docked palette: the comparison table collapses to stacked spec cards */
      body = top.map(t => `<article class="speccard"><div class="sc-head">${star(t.p.brand)}${pdpLink(t.p.sku, `<b>${esc(t.p.brand)}</b> — ${esc(t.p.title)} <span class="mono muted">${t.p.sku}</span>`)}<span class="fitpct">${t.fit}%</span></div>
        <dl><dt>Price</dt><dd class="mono"><b>${money(t.p.price)}</b></dd><dt>Spec</dt><dd>${specLine(t.p)}</dd><dt>Preset</dt><dd class="mono">${presetLine(t.p, g)}</dd><dt>Stock</dt><dd><span class="stock-ok">${stockLine(t.p)}</span>${cribBadge(t.p.sku)}</dd></dl>
        <div class="rc-actions"><button class="tbtn sm" data-lib="${t.p.sku}">+ Library</button><button class="tbtn sm pri" data-cart="${t.p.sku}">+ Cart</button></div></article>`).join('');
    } else {
      const rows = ['Price', 'Fit', 'Spec', 'Preset', 'Stock', ''];
      body = `<div class="tblwrap"><table class="cmp"><thead><tr><th></th>${top.map(t => `<th>${star(t.p.brand)}${pdpLink(t.p.sku, esc(t.p.brand))}<br><span class="mono th-sku">${t.p.sku}</span></th>`).join('')}</tr></thead><tbody>
        ${rows.map(r => `<tr><td>${r}</td>${top.map(t => {
          if (r === 'Price') return `<td class="mono"><b>${money(t.p.price)}</b></td>`;
          if (r === 'Fit') return `<td><span class="fitpct">${t.fit}%</span></td>`;
          if (r === 'Spec') return `<td>${specLine(t.p)}</td>`;
          if (r === 'Preset') return `<td class="mono sm">${presetLine(t.p, g)}</td>`;
          if (r === 'Stock') return `<td><span class="stock-ok">${stockLine(t.p)}</span>${cribBadge(t.p.sku)}</td>`;
          return `<td><button class="tbtn sm" data-lib="${t.p.sku}">+ Library</button> <button class="tbtn sm pri" data-cart="${t.p.sku}">+ Cart</button></td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    let more = S.seen > 0 ? res.more.slice(0, S.seen).map(s => rowRes(P(s))).join('') : '';
    more += S.seen < res.more.length
      ? `<button class="seeall" id="seeAll">${S.seen === 0 ? `See all ${res.total} results` : `Show 6 more (${res.total - top.length - S.seen} remaining)`}</button>`
      : res.more.length ? `<div class="refine-note">Showing the closest ${top.length + S.seen} of ${res.total}. Tighten size or geometry to narrow the list.</div>`
      : `<div class="refine-note">The closest ${top.length} of ${res.total} for this material. Tighten geometry to narrow the list.</div>`;
    R.innerHTML = head + body + more;
    $$('#findResults [data-v]').forEach(b => b.addEventListener('click', () => { S.view = b.dataset.v; renderResults(); }));
    $('#sortSel').addEventListener('change', e => { S.sort = e.target.value; renderResults(); });
    $('#newSearch').addEventListener('click', () => { S.wiz.step = 0; renderWiz(); });
    const sa = $('#seeAll'); if (sa) sa.addEventListener('click', () => { S.seen = Math.min(S.seen + 6, res.more.length); renderResults(); });
  }

  /* ============ MATCH — reference card + ranked alternatives ============ */
  function cmpEntry(sku, ref) {
    const p = P(sku); if (!p) return null;
    return { p, fit: S.match.fit[sku] || null,
      diaTxt: (p.diaDec < 1 ? p.diaDec.toFixed(3).replace(/^0/, '') : p.diaDec.toFixed(3)) + '"', diaOk: Math.abs(p.diaDec - parseFloat(ref.dia)) < .001,
      flOk: String(p.fl) === ref.fl, locTxt: p.locDec.toFixed(2) + '"', locOk: Math.abs(p.locDec - parseFloat(ref.loc)) < .001, coatOk: p.coatName === ref.coat };
  }
  const sortAlts = list => [...list].sort((a, b) => (S.brands.has(b.p.brand) - S.brands.has(a.p.brand)) || (b.fit || 0) - (a.fit || 0));
  const mark = ok => ok ? '<span class="mk-ok" title="exact">✓</span>' : '<span class="mk-close" title="different">~</span>';

  function renderMatch() {
    const m = S.match, ref = m.reference, out = $('#matchOut'); out.hidden = false;
    const feats = sortAlts(m.tops.map(s => cmpEntry(s, ref))), pool = sortAlts(m.pool.map(s => cmpEntry(s, ref)));
    const shownPool = pool.slice(0, S.matchSeen), cols = [...S.cmp].map(s => cmpEntry(s, ref)).filter(Boolean), total = feats.length + pool.length;
    const cmpBtn = (sku, short) => `<button class="tbtn sm" data-cmp="${sku}" aria-pressed="${S.cmp.has(sku)}">${S.cmp.has(sku) ? '✓ Comparing' : (short ? '+ Compare' : '+ Compare')}</button>`;
    out.innerHTML = `
      <div class="idline">Identified: <b>${esc(ref.maker)}</b> <span class="mono">${esc(m.pn)}</span> · matched to OEM catalog spec</div>
      <div class="refcard"><span class="rf-tag">Your part</span>
        <div class="rf-body"><div><div class="rc-name">${esc(ref.name)}</div><div class="rc-sku mono">${esc(m.pn)}</div>
          <div class="rc-spec">Ø ${ref.dia}" · ${ref.fl}FL · LOC ${ref.loc}" · ${ref.coat}</div></div>
          <div class="rc-side"><div class="rc-price mono">${money(ref.price)} <small>ea.</small></div><div class="rc-fitlab">${ref.lead} lead</div></div></div></div>
      <h3 class="p-lab">${total} MSC alternatives <span class="muted">· top ${feats.length} shown · preferred brands first, then fit</span></h3>
      ${feats.map(a => prodCard(a.p, { fit: a.fit, stock: a.p.lead, chip: savings(ref.price, a.p.price),
        actions: `${cmpBtn(a.p.sku)}<button class="tbtn sm" data-lib="${a.p.sku}">+ Library</button><button class="tbtn sm pri" data-cart="${a.p.sku}">+ Cart</button>` })).join('')}
      ${shownPool.map(a => rowRes(a.p, { fit: a.fit, chip: savings(ref.price, a.p.price),
        actions: `${cmpBtn(a.p.sku, true)}<button class="tbtn sm" data-lib="${a.p.sku}">+ Library</button><button class="tbtn sm pri" data-cart="${a.p.sku}">+ Cart</button>` })).join('')}
      ${S.matchSeen < pool.length ? `<button class="seeall" id="moreMatch">${S.matchSeen === 0 ? `See all ${total} alternatives` : `Show 6 more (${pool.length - S.matchSeen} remaining)`}</button>`
        : `<div class="refine-note">All ${total} catalog alternatives shown. Preferred brands rank first.</div>`}
      <form class="addcmp" id="cmpForm"><input id="cmpSku" class="mono" placeholder="Compare another MSC #" aria-label="Add an MSC number to the comparison" inputmode="numeric" autocomplete="off"><button class="tbtn sm" type="submit">Add to compare</button></form>
      ${cols.length && narrow() ? `<h3 class="p-lab">Compare <span class="muted">· your part vs ${cols.length} selected</span></h3>
        ${cols.map(a => `<article class="speccard"><div class="sc-head">${star(a.p.brand)}${pdpLink(a.p.sku, `<b>${esc(a.p.brand)}</b> — ${esc(a.p.title)} <span class="mono muted">${a.p.sku}</span>`)}${a.fit ? `<span class="fitpct">${a.fit}%</span>` : ''}<button class="cmp-x" data-cmpx="${a.p.sku}" aria-label="Remove from compare">✕</button></div>
          <dl><dt>Price</dt><dd class="mono"><b>${money(a.p.price)}</b> <span class="muted">vs ${money(ref.price)}</span> ${savings(ref.price, a.p.price)}</dd><dt>Lead</dt><dd class="stock-ok">${a.p.lead}</dd>
          <dt>Diameter</dt><dd>${a.diaTxt} ${mark(a.diaOk)}</dd><dt>Flutes</dt><dd>${a.p.fl} ${mark(a.flOk)}</dd><dt>LOC</dt><dd>${a.locTxt} ${mark(a.locOk)}</dd><dt>Coating</dt><dd>${a.p.coatName} ${mark(a.coatOk)}</dd></dl>
          <div class="rc-actions"><button class="tbtn sm pri" data-cart="${a.p.sku}">+ Cart</button></div></article>`).join('')}` : ''}
      ${cols.length && !narrow() ? `<h3 class="p-lab">Compare <span class="muted">· your part vs ${cols.length} selected</span></h3>
        <div class="tblwrap"><table class="cmp"><thead><tr><th></th><th>Your part<br><span class="mono th-sku">${esc(m.pn)}</span></th>
          ${cols.map(a => `<th>${star(a.p.brand)}${pdpLink(a.p.sku, esc(a.p.brand))}<br><span class="mono th-sku">${a.p.sku}</span> <button class="cmp-x" data-cmpx="${a.p.sku}" aria-label="Remove ${esc(a.p.brand)} from compare">✕</button></th>`).join('')}</tr></thead><tbody>
          <tr><td>Price</td><td class="mono">${money(ref.price)}</td>${cols.map(a => `<td class="mono"><b>${money(a.p.price)}</b>${a.p.price < ref.price ? `<br><span class="savechip">−${money(ref.price - a.p.price)}</span>` : ''}</td>`).join('')}</tr>
          <tr><td>Lead</td><td>${ref.lead}</td>${cols.map(a => `<td class="stock-ok">${a.p.lead}</td>`).join('')}</tr>
          <tr><td>Diameter</td><td>${ref.dia}"</td>${cols.map(a => `<td>${a.diaTxt} ${mark(a.diaOk)}</td>`).join('')}</tr>
          <tr><td>Flutes</td><td>${ref.fl}</td>${cols.map(a => `<td>${a.p.fl} ${mark(a.flOk)}</td>`).join('')}</tr>
          <tr><td>LOC</td><td>${ref.loc}"</td>${cols.map(a => `<td>${a.locTxt} ${mark(a.locOk)}</td>`).join('')}</tr>
          <tr><td>Coating</td><td>${ref.coat}</td>${cols.map(a => `<td>${a.p.coatName} ${mark(a.coatOk)}</td>`).join('')}</tr>
          <tr><td>Fit</td><td class="muted">—</td>${cols.map(a => `<td>${a.fit ? `<span class="fitpct">${a.fit}%</span>` : '<span class="muted">—</span>'}</td>`).join('')}</tr>
          <tr><td></td><td></td>${cols.map(a => `<td><button class="tbtn sm pri" data-cart="${a.p.sku}">+ Cart</button></td>`).join('')}</tr>
        </tbody></table></div>` : ''}
      <p class="brandnote">Preferred brands rank every alternative. Adjust them above the search box.</p>
      ${S.matchHist.length > 1 ? `<h3 class="p-lab">Recent matches</h3><div class="recent">${S.matchHist.filter(h => h !== m.pn).map(h => `<button class="chip xs mono" data-hist="${esc(h)}">${esc(h)}</button>`).join('')}</div>` : ''}`;
    out.onclick = e => {
      const t = s => e.target.closest(s); let b;
      if ((b = t('[data-cmp]'))) { const s = b.dataset.cmp; S.cmp.has(s) ? S.cmp.delete(s) : S.cmp.add(s); renderMatch(); }
      else if ((b = t('[data-cmpx]'))) { S.cmp.delete(b.dataset.cmpx); renderMatch(); }
      else if ((b = t('#moreMatch'))) { S.matchSeen = Math.min(S.matchSeen + 6, pool.length); renderMatch(); }
      else if ((b = t('[data-hist]'))) { $('#matchIn').value = b.dataset.hist; runMatch(); }
    };
    $('#cmpForm').onsubmit = async e => {
      e.preventDefault(); const inp = $('#cmpSku'), v = inp.value.replace(/[^0-9]/g, '');
      if (!v) { toast('Enter an MSC # to compare'); return; }
      if (!(await api.catalog.lookup(v))) { toast('MSC #' + v + ' is not in the demo catalog'); return; }
      if (S.cmp.has(v)) { toast('MSC #' + v + ' is already in the comparison'); return; }
      S.cmp.add(v); renderMatch(); toast('MSC #' + v + ' added to compare');
    };
  }
  async function runMatch() {
    const pn = $('#matchIn').value.trim() || 'CM-2F340-0500-DEMO';
    S.match = await api.catalog.crossRef(pn); S.matchSeen = 0;
    if (!S.matchHist.includes(pn)) { S.matchHist.unshift(pn); S.matchHist = S.matchHist.slice(0, 6); }
    renderMatch();
  }
  $('#matchForm').addEventListener('submit', e => { e.preventDefault(); runMatch(); });

  /* ============ CRIB ============ */
  function renderCribSel() { $('#cribSel').innerHTML = S.cribs.map((c, i) => `<option value="${i}" ${i === S.cribSel ? 'selected' : ''}>${esc(c.name)}</option>`).join(''); }
  function renderCribForm() {
    const f = S.cribForm, el = $('#cribForm'), c = MSC.crib.current();
    if (!f) { el.innerHTML = ''; return; }
    const cfg = { rename: ['Rename profile', 'Profile name', c.name, 'Save name'], new: ['New profile', 'Profile name', 'Bay 3 — new machine', 'Create profile'], add: ['Add SKU to ' + c.name, 'MSC #', '', 'Add line'] }[f];
    el.innerHTML = `<form class="inlineform" id="cribInline"><label for="cribField">${esc(cfg[0])}</label>
      <input id="cribField" class="${f === 'add' ? 'mono' : ''}" value="${esc(cfg[2])}" placeholder="${cfg[1]}" ${f === 'add' ? 'inputmode="numeric" placeholder="09990840"' : ''} autocomplete="off">
      ${f === 'add' ? `<label for="cribMin">Min</label><input id="cribMin" class="mono narrow" value="2" inputmode="numeric">` : ''}
      <button class="tbtn pri sm" type="submit">${cfg[3]}</button><button class="tbtn sm" type="button" id="cribCancel">Cancel</button><span class="fielderr" id="cribErr" role="alert"></span></form>`;
    const inp = $('#cribField'); inp.focus(); inp.select();
    $('#cribCancel').onclick = () => MSC.crib.setForm(null);
    $('#cribInline').onsubmit = async e => {
      e.preventDefault(); const v = inp.value.trim(); const err = $('#cribErr');
      if (!v) { err.textContent = 'Enter a value.'; inp.focus(); return; }
      if (f === 'rename') { MSC.crib.rename(v); toast('Profile renamed'); }
      if (f === 'new') { MSC.crib.create(v); toast('Profile created — ' + v); }
      if (f === 'add') {
        const sku = await api.catalog.lookup(v);
        if (!sku) { err.textContent = 'MSC #' + esc(v) + ' is not in the demo catalog.'; inp.focus(); return; }
        if (c.lines.some(l => l.sku === sku)) { err.textContent = 'Already in this profile.'; return; }
        const p = P(sku); MSC.crib.addLine({ sku, name: p.brand + ' ' + p.title, on: 0, min: Math.max(1, +$('#cribMin').value || 2), msc: true, price: p.price });
        toast('Added to ' + c.name + ' — MSC #' + sku);
      }
      api.crib.save(S.cribs);
    };
  }
  function renderCrib(opts = {}) {
    renderCribSel(); renderCribForm();
    const c = MSC.crib.current(), q = S.cribQ.toLowerCase();
    const low = c.lines.filter(l => l.on < l.min), cost = low.filter(l => l.msc).reduce((s, l) => s + (2 * l.min - l.on) * l.price, 0);
    const rows = c.lines.map((l, i) => ({ l, i })).filter(r => !q || r.l.sku.toLowerCase().includes(q) || r.l.name.toLowerCase().includes(q));
    $('#cribTbl').innerHTML = `
      <div class="cribsum"><span class="sumchip"><b class="mono">${c.lines.length}</b> SKUs tracked</span><span class="sumchip ${low.length ? 'warn' : ''}"><b class="mono">${low.length}</b> below minimum</span><span class="sumchip"><b class="mono">${money(cost)}</b> to replenish</span>
        <input id="cribFilter" placeholder="Filter SKUs" value="${esc(S.cribQ)}" aria-label="Filter crib lines" autocomplete="off"></div>
      ${narrow()
        ? (rows.length ? rows.map(({ l, i }) => `<div class="cribcard ${l.on < l.min ? 'low' : ''}">
            <div class="cc-top"><span class="mono">${l.msc && P(l.sku) ? pdpLink(l.sku, l.sku) : esc(l.sku)}</span><span class="srcbadge ${l.msc ? 'msc' : ''}">${l.msc ? 'MSC' : 'OTHER'}</span>${l.on < l.min ? '<span class="lowflag">Below min</span>' : ''}</div>
            <div class="cc-name">${esc(l.name)}</div>
            <div class="cc-row"><span class="muted">On hand</span><span class="stepper"><button data-cq="${i}|-1" aria-label="Decrease on-hand">−</button><span class="mono">${l.on}</span><button data-cq="${i}|1" aria-label="Increase on-hand">+</button></span><span class="muted">Min <b class="mono">${l.min}</b></span></div></div>`).join('')
          : '<div class="emptybox">No lines match the filter.</div>')
        : `<div class="tblwrap"><table class="cribtbl"><thead><tr><th>MSC #</th><th>Item</th><th>On hand</th><th>Min</th><th>Source</th><th></th></tr></thead><tbody>
        ${rows.length ? rows.map(({ l, i }) => `<tr class="${l.on < l.min ? 'low' : ''}">
          <td class="mono">${l.msc && P(l.sku) ? pdpLink(l.sku, l.sku) : esc(l.sku)}</td><td>${esc(l.name)}</td>
          <td><span class="stepper"><button data-cq="${i}|-1" aria-label="Decrease on-hand">−</button><span class="mono">${l.on}</span><button data-cq="${i}|1" aria-label="Increase on-hand">+</button></span></td>
          <td class="mono">${l.min}</td><td><span class="srcbadge ${l.msc ? 'msc' : ''}">${l.msc ? 'MSC' : 'OTHER'}</span></td>
          <td>${l.on < l.min ? '<span class="lowflag">Below min</span>' : ''}</td></tr>`).join('')
        : '<tr><td colspan="6" class="muted center">No lines match the filter.</td></tr>'}
      </tbody></table></div>`}`;
    $$('#cribTbl [data-cq]').forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.cq.split('|'); MSC.crib.adjust(+i, +d); api.crib.save(S.cribs); }));
    const cf = $('#cribFilter'); cf.addEventListener('input', () => MSC.crib.setFilter(cf.value));
    if (opts.keepFocus) { const nf = $('#cribFilter'); nf.focus(); nf.setSelectionRange(nf.value.length, nf.value.length); }
  }
  MSC.on('crib', o => renderCrib(o || {}));
  $('#cribSel').addEventListener('change', e => { $('#poOut').innerHTML = ''; MSC.crib.select(+e.target.value); });
  $('#cribRename').addEventListener('click', () => MSC.crib.setForm(S.cribForm === 'rename' ? null : 'rename'));
  $('#cribNew').addEventListener('click', () => MSC.crib.setForm(S.cribForm === 'new' ? null : 'new'));
  $('#cribAdd').addEventListener('click', () => MSC.crib.setForm(S.cribForm === 'add' ? null : 'add'));
  $('#poGo').addEventListener('click', async () => {
    const po = await api.crib.draftPO(MSC.crib.current());
    if (!po.rows.length) { $('#poOut').innerHTML = '<div class="refine-note">No MSC lines below minimum in this profile. Nothing to reorder.</div>'; return; }
    $('#poOut').innerHTML = `<div class="pocard"><h3 class="p-lab">Purchase order — draft</h3>
      <div class="mono-line mono">${po.po} · ${po.date} · Acct ${po.account} · ${esc(po.profile)} · ${po.rule}</div>
      ${po.excluded.length ? `<div class="excl">Excluded — not MSC SKUs: <span class="mono">${po.excluded.map(e => esc(e.sku)).join(', ')}</span>. Match these on the Match tab to include them.</div>` : ''}
      <table>${po.rows.map(r => `<tr><td class="mono">${r.sku}</td><td>${esc(r.name)}</td><td class="mono">×${r.qty}</td><td class="mono right">${money(r.qty * r.price)}</td></tr>`).join('')}
        <tr><td colspan="3"><b>Total</b></td><td class="mono right"><b>${money(po.total)}</b></td></tr></table>
      <div class="btnrow"><button class="tbtn pri" id="poSend">Send to purchasing</button><button class="tbtn" id="poCart">Add to staging cart</button></div></div>`;
    $('#poSend').addEventListener('click', async () => { await api.crib.sendPO(po); toast(po.po + ' sent to purchasing (simulated)'); });
    $('#poCart').addEventListener('click', () => { po.rows.forEach(r => MSC.addCart({ sku: r.sku, name: r.name, price: r.price }, r.qty, { silent: true })); toast(`${po.rows.length} PO lines added to staging cart`); });
  });

  /* ============ LIBRARY ============ */
  function renderLib() {
    $('#libList').innerHTML = S.lib.length
      ? S.lib.map((l, i) => `<div class="libitem"><button class="thumb-sm" data-pdp="${l.sku}" aria-label="Open product page">${P(l.sku) ? art(P(l.sku)) : ''}</button>
          <div class="li-main">${pdpLink(l.sku, `<b>${esc(l.name)}</b>`)}<span class="li-preset mono">MSC #${l.sku} · ${esc(l.preset)}</span></div>
          <span class="rr-p mono">${money(l.price)}</span><button class="tbtn sm icon" data-libx="${i}" aria-label="Remove from Library">✕</button></div>`).join('')
      : '<div class="emptybox">Nothing staged yet. Add tools from Find, Match, or an Import &amp; Match audit, then export them to Fusion or Inventor in one move.</div>';
    $('#libExport').disabled = $('#libToCart').disabled = !S.lib.length;
    $$('#libList [data-libx]').forEach(b => b.addEventListener('click', () => MSC.removeLib(+b.dataset.libx)));
  }
  $('#libExport').addEventListener('click', async () => {
    const target = $('#expFmt').value, r = await api[target].writeLibrary(S.lib);
    toast(`Exported ${r.written} tool${r.written === 1 ? '' : 's'} to ${r.format} — ${r.includes} (simulated)`);
  });
  $('#libToCart').addEventListener('click', () => { S.lib.forEach(l => MSC.addCart({ sku: l.sku, name: l.name, price: l.price }, 1, { silent: true })); toast(`${S.lib.length} Library tools added to staging cart`); });

  /* Import & Match */
  function xmTotals() {
    let matched = 0, msc = 0, theirs = 0, count = 0;
    S.xm.rows.forEach(r => { if (r.unmatched) return; matched++; if (r.on) { count++; msc += P(r.alts[r.pick].sku).price; theirs += r.tprice; } });
    return { matched, msc, theirs, count };
  }
  function renderXM() {
    const t = xmTotals(), rows = S.xm.rows, d = t.theirs - t.msc, pct = t.theirs ? Math.round(Math.abs(d) / t.theirs * 100) : 0;
    $('#xmOut').innerHTML = `
      <div class="rollup"><span class="r-lab">Audit · ${esc(S.xm.label)}</span>
        <span class="r-big mono">${t.matched} of ${rows.length} matched</span><span class="r-lab">${t.count} selected</span>
        <span class="r-big mono">${money(t.msc)} <span class="r-vs">vs ${money(t.theirs)} current brands</span></span>
        <span class="${d >= 0 ? 'r-save' : 'r-up'} mono">${d >= 0 ? `save ${money(d)} (−${pct}%)` : `+${money(-d)} (+${pct}%)`}</span><span class="r-lab">all next-day</span></div>
      ${rows.map((r, ri) => r.unmatched
        ? `<div class="xmrow unmatched"><div class="xm-top"><span class="mono xm-theirs">${esc(r.theirs)}</span><span>${esc(r.tname)}</span><span class="xm-arrow">→</span><span class="muted">no catalog match</span>
             <button class="linkbtn" data-q="${esc(r.theirs)}">Request quote</button></div></div>`
        : `<div class="xmrow"><div class="xm-top"><input type="checkbox" id="xon${ri}" data-xon="${ri}" ${r.on ? 'checked' : ''}><label for="xon${ri}" class="mono xm-theirs">${esc(r.theirs)}</label><span class="muted">${esc(r.tname)} · ${money(r.tprice)}</span><span class="xm-arrow">→</span></div>
           <div class="xm-alts">${sortAltsXm(r.alts).map(a => { const p = P(a.sku), ai = r.alts.indexOf(a); return `<label><input type="radio" name="xm${ri}" data-xp="${ri}|${ai}" ${r.pick === ai ? 'checked' : ''}>
             ${star(p.brand)}${pdpLink(p.sku, `<b>${esc(p.brand)}</b> ${esc(p.title)}`)}<span class="mono muted">${p.sku}</span><span class="fitpct">${a.fit}%</span><span class="rr-p mono">${money(p.price)}</span>${savings(r.tprice, p.price)}</label>`; }).join('')}</div></div>`).join('')}
      <div class="btnrow"><button class="tbtn pri" id="xmStage">Add selected to Library + cart</button><span class="stagenote">Nothing is ordered by importing. Staging is explicit.</span></div>`;
    $$('#xmOut [data-xon]').forEach(cb => cb.addEventListener('change', () => { rows[+cb.dataset.xon].on = cb.checked; renderXM(); }));
    $$('#xmOut [data-xp]').forEach(rb => rb.addEventListener('change', () => { const [ri, ai] = rb.dataset.xp.split('|'); rows[+ri].pick = +ai; renderXM(); }));
    $$('#xmOut [data-q]').forEach(q => q.addEventListener('click', async () => { const r = await api.cart.requestQuote(q.dataset.q); toast(`Quote requested for ${r.pn} — ${r.ticket} (simulated)`); }));
    $('#xmStage').addEventListener('click', () => {
      let n = 0;
      rows.forEach(r => { if (r.unmatched || !r.on) return; const p = P(r.alts[r.pick].sku); n++;
        MSC.addLib({ sku: p.sku, brand: p.brand, name: p.title, price: p.price, preset: 'Match for ' + r.theirs }, { silent: true });
        if (!S.cart.find(l => l.sku === p.sku)) MSC.addCart({ sku: p.sku, brand: p.brand, name: p.title, price: p.price }, 1, { silent: true }); });
      toast(`${n} tools staged to Library and cart — nothing ordered`);
    });
  }
  const sortAltsXm = alts => [...alts].sort((a, b) => (S.brands.has(P(b.sku).brand) - S.brands.has(P(a.sku).brand)) || b.fit - a.fit);
  function loadXM(set) { S.xm = { label: set.label, rows: set.rows.map(r => ({ ...r, on: !r.unmatched, pick: 0 })) }; renderXM(); }
  $('#xmGo').addEventListener('click', async () => { loadXM(await api.files.parseToolList('sample_tools.csv')); toast('Parsed sample_tools.csv — 4 of 5 lines matched'); });
  $('#xmFusion').addEventListener('click', async () => { loadXM(await api.fusion.readLibrary()); toast("Read this document's Fusion tool library — 5 of 6 tools matched"); });
  $('#xmInventor').addEventListener('click', () => api.inventor.readLibrary().catch(e => toast(e.message)));
  $('#xmFile').addEventListener('change', async e => { const n = e.target.files[0] ? e.target.files[0].name : 'file'; loadXM(await api.files.parseToolList(n)); toast('Parsed ' + n + ' — 4 of 5 lines matched (simulated)'); });
  const drop = $('#xmDrop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', async e => { e.preventDefault(); drop.classList.remove('over'); const n = e.dataTransfer.files[0] ? e.dataTransfer.files[0].name : 'dropped file'; loadXM(await api.files.parseToolList(n)); toast('Parsed ' + n + ' — 4 of 5 lines matched (simulated)'); });

  /* ============ CART ============ */
  function quotesBlock() {
    if (!S.quotes.length) return '';
    return `<h3 class="p-lab">Saved quotes</h3>` + S.quotes.map(q => `<div class="quoterow"><span class="mono"><b>${q.id}</b></span><span class="muted">${q.date} · ${q.lines.length} line${q.lines.length === 1 ? '' : 's'}</span>
      <span class="rr-p mono">${money(q.total)}</span><button class="tbtn sm" data-qopen="${q.id}">Open in cart</button></div>`).join('');
  }
  function wireQuotes() { $$('#view-cart [data-qopen]').forEach(b => b.addEventListener('click', () => { const q = S.quotes.find(x => x.id === b.dataset.qopen); MSC.loadCart(q.lines); toast(q.id + ' loaded into cart'); })); }
  function renderCart() {
    const L = $('#cartList'), X = $('#cartExtras');
    if (S.ui.order) { renderOrderConfirm(); return; }
    if (!S.cart.length) { L.innerHTML = '<div class="emptybox">The staging cart is empty. Add tools from Find, Match, Crib POs, or an import audit.</div>'; X.innerHTML = quotesBlock(); wireQuotes(); return; }
    L.innerHTML = S.cart.map((l, i) => `<div class="cartline">
        <button class="thumb-sm" data-pdp="${l.sku}" aria-label="Open product page">${P(l.sku) ? art(P(l.sku)) : ''}</button>
        <div class="cl-main">${pdpLink(l.sku, `<b>${esc(l.name)}</b>`)}<span class="mono muted">MSC #${l.sku} · ${money(l.price)} ea.</span></div>
        <span class="stepper"><button data-q="${i}|-1" aria-label="Decrease quantity">−</button><span class="mono">${l.qty}</span><button data-q="${i}|1" aria-label="Increase quantity">+</button></span>
        <span class="rr-p mono">${money(l.price * l.qty)}</span><button class="tbtn sm icon" data-x="${i}" aria-label="Remove line">✕</button></div>`).join('');
    const hits = S.cart.map(l => ({ l, crib: MSC.cribHolding(l.sku) })).filter(h => h.crib);
    X.innerHTML = `${hits.map(h => { const on = h.crib.lines.find(x => x.sku === h.l.sku).on; return `<div class="callout"><span class="co-text"><b>Crib check:</b> ${on} × MSC #${h.l.sku} on hand in <b>${esc(h.crib.name)}</b>. Use crib stock first and reduce the order quantity?</span>
        <button class="tbtn sm" data-usecrib="${h.l.sku}|${on}">Use crib stock</button></div>`; }).join('')}
      <div class="ordsum"><div class="os-row"><span>Subtotal (${MSC.cartCount()} items)</span><b class="mono">${money(MSC.cartTotal())}</b></div>
        <div class="os-row"><span>Shipping</span><b class="stock-ok">FREE next-day</b></div>
        <div class="os-row"><span>Order by 8 p.m. ET · tax calculated at order</span><span></span></div>
        <div class="os-row os-total"><span>Estimated total</span><b class="mono">${money(MSC.cartTotal())}</b></div></div>
      <div class="cart-exits"><button class="tbtn" id="cLib">Add all to Library</button><button class="tbtn pri" id="cOrder">Checkout</button><button class="tbtn" id="cQuote">Save quote</button></div>` + quotesBlock();
    $$('#cartList [data-q]').forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.q.split('|'); MSC.setCartQty(+i, S.cart[+i].qty + +d); }));
    $$('#cartList [data-x]').forEach(b => b.addEventListener('click', () => MSC.removeCart(+b.dataset.x)));
    $$('#cartExtras [data-usecrib]').forEach(b => b.addEventListener('click', () => {
      const [sku, on] = b.dataset.usecrib.split('|'), i = S.cart.findIndex(l => l.sku === sku);
      if (S.cart[i].qty > +on) MSC.setCartQty(i, S.cart[i].qty - +on); else MSC.removeCart(i);
      toast('Crib stock applied — order quantity reduced'); }));
    $('#cLib').addEventListener('click', () => { let n = 0; S.cart.forEach(l => { if (MSC.addLib({ sku: l.sku, name: l.name, price: l.price }, { silent: true })) n++; }); toast(n ? `${n} added to Library` : 'Everything is already in Library'); });
    $('#cOrder').addEventListener('click', async () => { S.ui.order = await api.cart.submit(S.cart); S.cart = []; renderBar(); renderCart(); });
    $('#cQuote').addEventListener('click', async () => { const q = await api.cart.saveQuote(S.cart); MSC.addQuote(q); renderCart(); toast('Quote saved — ' + q.id + ' (simulated)'); });
    wireQuotes();
  }
  function renderOrderConfirm() {
    const o = S.ui.order;
    $('#cartList').innerHTML = `<div class="confirm"><div class="cf-ic">✓</div><h3 class="p-lab">Order submitted</h3><p class="p-note">Simulated. No order was placed.</p>
      <div class="ordsum left"><div class="os-row"><span>Order number</span><b class="mono">${o.order}</b></div><div class="os-row"><span>Items</span><b class="mono">${o.items}</b></div>
        <div class="os-row"><span>Ship to</span><b>${o.shipTo}</b></div><div class="os-row"><span>Delivery</span><b class="stock-ok">${o.delivery}</b></div>
        <div class="os-row os-total"><span>Total</span><b class="mono">${money(o.total)}</b></div></div>
      <div class="cart-exits center"><button class="tbtn pri" id="cfDone">Continue</button></div></div>`;
    $('#cartExtras').innerHTML = quotesBlock(); wireQuotes();
    $('#cfDone').addEventListener('click', () => { S.ui.order = null; renderCart(); MSC.showTab('find'); });
  }

  /* ============ PRODUCT PAGE (PDP light, in-panel) ============ */
  let pdpQty = 1;
  async function renderPDP(sku) {
    const p = P(sku), V = $('#view-pdp');
    if (!p) { V.innerHTML = `<button class="backbtn" id="pdpBack">← Back</button><div class="emptybox">No catalog page for MSC #${esc(sku)} in this demo.</div>`; $('#pdpBack').onclick = closePDP; return; }
    pdpQty = 1;
    const g = currentGroup();
    const [alts, often, avail] = await Promise.all([api.catalog.alternatives(sku, 3, g), api.catalog.oftenWith(sku), api.pricing.availability([sku])]);
    const a = avail[sku], cutting = MSC.isCutting(p), fromLabel = { find: 'Find', match: 'Match', crib: 'Crib', library: 'Library', cart: 'Cart' }[S.ui.pdpFrom] || 'Find';
    const row = (k, v) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`;
    const specs = !cutting ? p.specs : p.kind === 'tap' ? [
      ['Thread Size', p.thread], ['Thread Standard', 'UNC'], ['Tap Style', p.tapStyle], ['Chamfer', p.chamferType],
      ['Number of Flutes', p.fl], ['Material', p.material], ['Thread Length (Inch)', p.loc + '"'], ['Shank Diameter (Inch)', p.shank + '"'],
      ['Overall Length (Inch)', p.oal + '"'], ['Coating/Finish', p.coatName], ['Limit Class', 'H3'], ['Hand', 'Right Hand']] : [
      ['Cutting Diameter (Inch)', p.dia + '"'], ['Cutting Diameter (Decimal Inch)', p.diaDec.toFixed(4)],
      ['Number of Flutes', p.fl], ['Material', p.material || 'Solid Carbide'],
      ['Length of Cut (Inch)', p.loc + '"'], ['Length of Cut (Decimal Inch)', p.locDec.toFixed(4)],
      ['Shank Diameter (Inch)', p.shank + '"'], ['Overall Length (Inch)', p.oal + '"'],
      ['Coating/Finish', p.coatName], [p.kind === 'drill' ? 'Point Angle' : 'Helix Angle', p.helix],
      [p.kind === 'drill' ? 'Coolant-through' : 'Centercutting', p.kind === 'drill' ? (p.coolant ? 'Yes' : 'No') : 'Yes'], ['Cutting Direction', 'Right Hand']];
    const longTail = cutting ? [['Series', p.series], ['End Type', 'Single End'], ['Shank Type', 'Cylindrical'], ['Corner Radius', p.radius ? p.radius + '"' : (p.kind === 'ball' ? 'Full radius' : 'None')],
      ['Unit of Measure', 'Inch'], ['Country of Origin', 'Simulated'], ['Package Quantity', '1'], ['PSC Code', '5133']] : [['Series', p.series], ['Unit of Measure', 'Each'], ['Package Quantity', '1']];
    const groups = Object.keys(MSC.db.catalog.sfm);
    V.innerHTML = `
      <button class="backbtn" id="pdpBack">← Back to ${fromLabel}</button>
      <div class="pdp-grid">
        <div class="pdp-main">
          <header class="pdp-head">
            <div class="pdp-img">${art(p)}</div>
            <div class="pdp-info">
              <div class="pdp-brand">${esc(p.brand)}</div>
              <h2 class="p-h pdp-title" id="pdpTitle" tabindex="-1">${esc(p.title)}</h2>
              <p class="pdp-desc">${esc(p.desc)}</p>
              <div class="pdp-ids mono">MSC #${p.sku} · Mfr #${esc(p.mfr)}</div>
            </div>
          </header>
          <section class="pdp-sec"><h3 class="p-lab">Specifications</h3>
            <table class="spectbl"><tbody>${specs.map(([k, v]) => row(k, v)).join('')}</tbody><tbody id="specMore" hidden>${longTail.map(([k, v]) => row(k, v)).join('')}</tbody></table>
            <button class="linkbtn" id="specToggle" aria-expanded="false">Show all specifications</button></section>
          ${cutting ? `<section class="pdp-sec"><h3 class="p-lab">Feeds and speeds <span class="muted">· starting parameters that export with the tool</span></h3>
            <div class="tblwrap"><table class="cmp fs"><thead><tr><th>Workpiece</th><th>SFM</th><th>Spindle</th><th>${p.kind === 'tap' ? 'Pitch' : 'Chip load'}</th><th>Feed</th></tr></thead><tbody>
              ${groups.map(k => `<tr class="${k === g ? 'hl' : ''}"><td>ISO ${k} — ${MSC.db.catalog.groupNames[k]}${k === g ? ' <span class="tag">selected in Find</span>' : ''}</td><td class="mono">${p.params[k].sfm}</td><td class="mono">${p.params[k].rpm.toLocaleString()} RPM</td><td class="mono">${p.params[k].chip}"</td><td class="mono">${p.params[k].ipm} IPM</td></tr>`).join('')}
            </tbody></table></div></section>
          <section class="pdp-sec"><h3 class="p-lab">Tool geometry and CAM data</h3>
            <div class="pdp-cad"><span>Geometry and material presets are included with the export.</span>
              <span class="btnrow"><select id="pdpFmt" aria-label="Export target"><option value="fusion">Autodesk Fusion (.tools)</option><option value="inventor">Autodesk Inventor</option></select><button class="tbtn" id="pdpExport">Export</button></span></div></section>` : ''}
          ${alts.length ? `<section class="pdp-sec"><h3 class="p-lab">Alternatives</h3><div class="minicards">${alts.map(x => miniCard(P(x.sku), x.fit)).join('')}</div></section>` : ''}
          ${often.length ? `<section class="pdp-sec"><h3 class="p-lab">Often bought with</h3><div class="minicards">${often.map(s => miniCard(P(s))).join('')}</div></section>` : ''}
        </div>
        <aside class="pdp-buy" aria-label="Buy">
          <div class="pdp-price mono">${money(a.price)} <small>/each</small></div>
          <div class="pdp-qty"><label for="pdpQtyIn">Quantity</label><span class="stepper"><button id="pqDn" aria-label="Decrease quantity">−</button><input id="pdpQtyIn" class="mono" value="1" inputmode="numeric" aria-label="Quantity"><button id="pqUp" aria-label="Increase quantity">+</button></span></div>
          <button class="tbtn pri wide" id="pAddCart">Add to cart</button><button class="tbtn wide" id="pAddLib">Add to Library</button>
          <div class="pdp-avail"><span class="stock-ok">In stock · ${a.stock}</span><br>${a.shipsToday ? 'Ships today, order by 8 p.m. ET' : a.lead}</div>
          ${MSC.cribOnHand(sku) ? `<div class="pdp-crib">${MSC.cribOnHand(sku)} in your crib · ${esc(MSC.cribHolding(sku).name)}</div>` : ''}
          <div class="pdp-ship">Free next-day shipping on this item.</div>
        </aside>
      </div>`;
    $('#pdpBack').onclick = closePDP;
    $('#pdpTitle').focus();
    $('#specToggle').onclick = () => { const m = $('#specMore'), b = $('#specToggle'); m.hidden = !m.hidden; b.setAttribute('aria-expanded', !m.hidden); b.textContent = m.hidden ? 'Show all specifications' : 'Show fewer specifications'; };
    const qi = $('#pdpQtyIn'), setQ = n => { pdpQty = Math.max(1, Math.min(999, n | 0 || 1)); qi.value = pdpQty; };
    $('#pqUp').onclick = () => setQ(pdpQty + 1); $('#pqDn').onclick = () => setQ(pdpQty - 1); qi.onchange = () => setQ(+qi.value);
    $('#pAddCart').onclick = () => MSC.addCart({ sku: p.sku, brand: p.brand, name: p.title, price: p.price }, pdpQty);
    $('#pAddLib').onclick = () => MSC.addLib({ sku: p.sku, brand: p.brand, name: p.title, price: p.price, preset: cutting ? presetLine(p, g) : 'Accessory · no preset' });
    const ex = $('#pdpExport'); if (ex) ex.onclick = async () => { const r = await api[$('#pdpFmt').value].writeLibrary([p]); toast(`Exported MSC #${p.sku} to ${r.format} — ${r.includes} (simulated)`); };
  }
  const miniCard = (p, fit) => `<article class="minicard"><button class="thumb-sm" data-pdp="${p.sku}" aria-label="Open product page">${art(p)}</button>
    <div class="mc-main">${pdpLink(p.sku, esc(p.brand) + ' — ' + esc(p.title))}<span class="mono muted">${p.sku}${fit ? ` · <span class="fitpct">${fit}%</span> fit` : ''}</span></div>
    <span class="rr-p mono">${money(p.price)}</span><button class="tbtn sm pri" data-cart="${p.sku}">+ Cart</button></article>`;

  /* ============ global search ============ */
  $('#gForm').addEventListener('submit', async e => {
    e.preventDefault(); const v = $('#gSearch').value.trim(); if (!v) return;
    const digits = v.replace(/[^0-9]/g, '');
    if (digits.length >= 4 && await lookup(digits, $('#gSearch'))) return;
    if (digits.length >= 4) return;
    MSC.showTab('find'); S.seen = 0; if (!S.wiz.tool) S.wiz.tool = 'endmill'; await runSearch(); toast(`Showing results for "${v}"`);
  });

  /* ============ init ============ */
  renderWiz(); renderBrandBars(); renderCrib(); renderLib(); renderCart(); renderBar(); renderNav();
})();
