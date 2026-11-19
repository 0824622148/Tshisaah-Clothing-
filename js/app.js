/* Hashtag Tshisaah storefront — single-page app, no build step. */
(() => {
  'use strict';

  const CONFIG = window.TSH_CONFIG;
  const PRODUCTS = window.TSH_PRODUCTS;
  const CATS = window.TSH_CATS;
  const COLORS = window.TSH_COLORS;
  const DEL = window.TSH_DELIVERY;
  const PAY = window.TSH_PAYMENT;

  const ITEMS = PRODUCTS.flatMap(p => p.variants.map(v => ({
    ...v, pid: p.id, cat: p.cat, price: p.price, line: p.line, details: p.details, fit: p.fit, sizes: p.sizes,
    name: v.color + ' ' + p.short,
  })));
  const byId = id => ITEMS.find(i => i.vid === id);
  const R = n => 'R ' + Number(n).toLocaleString('en-ZA');
  const catLabel = key => (CATS.find(c => c.key === key) || CATS[0]).label;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tsh_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tsh_' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  // A sample order so "Track order" can be demonstrated straight away.
  const SAMPLE_ORDER = {
    no: 'TSH-10482', email: 'lerato.m@gmail.com', status: 'shipped', createdAt: Date.now() - 2 * 864e5,
    name: 'Lerato Mokoena', delivery: 'courier', pay: 'card', waybill: 'CX 2207 4471 ZA',
    address: '14 Vilakazi St, Orlando West, Soweto 1804',
    lines: [{ vid: 'tee-forest', size: 'L', qty: 1 }, { vid: 'hat-washed', size: 'S/M', qty: 1 }],
  };

  const state = {
    cart: store.get('cart', []).filter(l => byId(l.vid)),
    favs: store.get('favs', {}),
    orders: store.get('orders', []),
    user: store.get('user', null),
    form: store.get('form', {}),
    delivery: store.get('delivery', 'courier'),
    pay: 'card',
  };
  const save = () => {
    store.set('cart', state.cart); store.set('favs', state.favs); store.set('orders', state.orders);
    store.set('user', state.user); store.set('form', state.form); store.set('delivery', state.delivery);
  };

  // Transient UI state (not persisted)
  const ui = { colors: new Set(), pdpVid: null, size: null, added: false, acc: 'details', errors: {}, trackResult: null, authMode: 'in' };

  /* ---------- analytics ---------- */
  function track(event, params) {
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  }
  if (CONFIG.ga4) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', CONFIG.ga4);
  }

  /* ---------- icons (Lucide paths) ---------- */
  const ICONS = {
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    store: '<path d="M3 9h18l-1.5-5h-15z"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V2a5 5 0 0 0 5 5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };
  const icon = (n, s = 18, fill = false) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  /* ---------- helpers ---------- */
  const cartCount = () => state.cart.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines => lines.reduce((a, l) => a + l.qty * byId(l.vid).price, 0);
  const delOf = key => DEL.find(d => d.key === key) || DEL[0];
  const findOrder = no => [...state.orders, SAMPLE_ORDER].find(o => o.no.toUpperCase() === String(no).replace(/^#/, '').trim().toUpperCase());

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  const card = (it, extra = '') => `
    <article class="pcard">
      <a class="pcard-img" href="#/p/${it.vid}" style="--bg:${it.bg}"><img src="${it.img}" alt="${esc(it.name)}" loading="lazy"></a>
      <button class="fav ${state.favs[it.vid] ? 'on' : ''}" data-act="fav" data-vid="${it.vid}" aria-pressed="${!!state.favs[it.vid]}" aria-label="Save ${esc(it.name)}">${icon('heart', 18, state.favs[it.vid])}</button>
      <a class="pcard-meta" href="#/p/${it.vid}"><span class="pcard-name">${esc(it.name)}</span><span class="pcard-price">${R(it.price)}</span></a>
      ${extra}
    </article>`;

  const lineRow = (l, compact) => {
    const it = byId(l.vid);
    return `<div class="sum-line"><div class="thumb" style="--bg:${it.bg}"><img src="${it.img}" alt=""></div>
      <div class="sum-line-txt"><span>${esc(it.name)}</span><span class="muted">${esc(l.size)} · Qty ${l.qty}</span></div>
      <span>${R(it.price * l.qty)}</span></div>`;
  };

  const empty = (msg, cta = 'Shop the drop', href = '#/shop') =>
    `<div class="empty"><span>${msg}</span><a class="btn btn-outline" href="${href}">${cta}</a></div>`;

  /* ---------- views ---------- */
  const views = {};

  views.home = () => {
    const newIn = ['hat-forest', 'tee-forest', 'hat-white', 'tee-choc'].map(byId);
    return {
      title: 'Hashtag Tshisaah · Kasi Vibe streetwear from Mzansi',
      html: `
      <section class="hero">
        <div class="hero-copy">
          <span class="kicker gold">SUMMER '26 DROP</span>
          <h1>KASI VIBE<br>COLLECTION</h1>
          <p>Embroidered bucket hats in four washes, and the Certified tee.</p>
          <a class="btn btn-light" href="#/shop?cat=Hats">Shop hats ${icon('arrow')}</a>
        </div>
        <div class="hero-img"><img src="img/p4.jpeg" alt="Forest Kasi Vibe bucket hat with gold embroidery"></div>
      </section>

      <section class="wrap">
        <div class="sec-head"><h2>New in</h2><a class="link-arrow" href="#/shop">View all ${ITEMS.length} ${icon('chevR')}</a></div>
        <div class="grid4">${newIn.map(it => card(it)).join('')}</div>
      </section>

      <section class="split">
        <div class="split-img"><img src="img/p3.jpeg" alt="Forest Certified tee on a hanger" loading="lazy"></div>
        <div class="split-copy">
          <span class="cert">CERTIFIED</span>
          <span class="script">By #Tshisaah!!</span>
          <p>Heavyweight cotton, tonal gold embroidery. Two colourways.</p>
          <a class="btn btn-light" href="#/shop?cat=Tees">Shop tees ${icon('arrow')}</a>
        </div>
      </section>

      <section class="usp">
        <div>${icon('truck', 22)}<b>Nationwide delivery</b><span>Courier in 2–4 days, or PAXI from R 59</span></div>
        <div>${icon('shield', 22)}<b>Secure checkout</b><span>Card, Instant EFT and SnapScan</span></div>
        <div>${icon('refresh', 22)}<b>30-day returns</b><span>On unworn items, no stress</span></div>
        <div>${icon('chat', 22)}<b>WhatsApp updates</b><span>We message you when it ships</span></div>
      </section>

      <section class="wrap">
        <div class="sec-head"><h2>#Tshisaah lookbook</h2><a class="link-arrow" href="#/lookbook">See all ${icon('chevR')}</a></div>
        <div class="strip">${ITEMS.map(it => `<button class="strip-cell" data-act="lightbox" data-src="${it.img}" data-alt="${esc(it.name)}" style="--bg:${it.bg}"><img src="${it.img}" alt="${esc(it.name)}" loading="lazy"></button>`).join('')}</div>
      </section>`,
    };
  };

  views.shop = r => {
    const cat = CATS.some(c => c.key === r.q.get('cat')) ? r.q.get('cat') : 'all';
    const items = ITEMS.filter(i => (cat === 'all' || i.cat === cat) && (!ui.colors.size || ui.colors.has(i.color)));
    return {
      title: catLabel(cat) + ' · Hashtag Tshisaah',
      html: `
      <div class="shop">
        <aside class="filters" aria-label="Filters">
          <div class="f-h">CATEGORY</div>
          <div class="f-list">
            ${CATS.map(c => `<a href="#/shop${c.key === 'all' ? '' : '?cat=' + c.key}" class="f-cat ${cat === c.key ? 'on' : ''}" ${cat === c.key ? 'aria-current="page"' : ''}><span>${c.label}</span><span>${ITEMS.filter(i => c.key === 'all' || i.cat === c.key).length}</span></a>`).join('')}
          </div>
          <div class="f-h">COLOUR</div>
          <div class="f-list f-colors">
            ${COLORS.map(([l, sw]) => `<button class="f-color ${ui.colors.has(l) ? 'on' : ''}" data-act="color" data-color="${l}" aria-pressed="${ui.colors.has(l)}"><span class="box"></span><span class="sw" style="background:${sw}"></span>${l}</button>`).join('')}
          </div>
        </aside>
        <div>
          <div class="sec-head tight"><h1 class="h2">${catLabel(cat)}</h1><span class="muted">${items.length} items</span></div>
          ${items.length ? `<div class="grid3">${items.map(it => card(it)).join('')}</div>`
            : `<div class="empty"><span>No pieces match these filters.</span><button class="btn btn-outline" data-act="clear-colors">Clear colours</button></div>`}
        </div>
      </div>`,
    };
  };

  views.p = r => {
    const it = byId(r.arg);
    if (!it) return views.notfound();
    if (ui.pdpVid !== it.vid) {
      const sameProduct = ui.pdpVid && byId(ui.pdpVid) && byId(ui.pdpVid).pid === it.pid;
      ui.pdpVid = it.vid; ui.added = false;
      if (!sameProduct) { ui.size = it.sizes[Math.min(2, it.sizes.length - 1)]; ui.acc = 'details'; }
      track('view_item', { currency: 'ZAR', value: it.price, items: [{ item_id: it.vid, item_name: it.name }] });
    }
    const fav = !!state.favs[it.vid];
    const siblings = ITEMS.filter(i => i.pid === it.pid);
    const related = ITEMS.filter(i => i.pid !== it.pid).slice(0, 4);
    const acc = [['details', 'Details', it.details], ['fit', 'Size & fit', it.fit],
      ['delivery', 'Delivery & returns', 'Courier delivery nationwide in 2–4 working days, or collect at a PEP store with PAXI. Returns accepted within 30 days on unworn items.']];
    return {
      title: it.name + ' · ' + R(it.price) + ' · Hashtag Tshisaah',
      html: `
      <div class="pdp">
        <div class="pdp-gallery">
          <div class="pdp-thumbs">${siblings.map(v => `<a href="#/p/${v.vid}" class="${v.vid === it.vid ? 'on' : ''}" style="--bg:${v.bg}" aria-label="${esc(v.color)}"><img src="${v.img}" alt=""></a>`).join('')}</div>
          <div class="pdp-main" style="--bg:${it.bg}"><img src="${it.img}" alt="${esc(it.name)}"></div>
        </div>
        <div class="pdp-info">
          <a class="crumb" href="#/shop?cat=${it.cat}">${icon('chevL', 16)}Shop / ${catLabel(it.cat)}</a>
          <div class="pdp-brand"><span class="script-sm">#</span>#TSHISAAH</div>
          <h1 class="pdp-name">${esc(it.name)}</h1>
          <div class="muted">${esc(it.line)}</div>
          <div class="pdp-price">${R(it.price)}</div>
          <hr class="rule">
          <div class="label">COLOUR · ${esc(it.color.toUpperCase())}</div>
          <div class="swatches">${siblings.map(v => `<a href="#/p/${v.vid}" class="swatch ${v.vid === it.vid ? 'on' : ''}" title="${esc(v.color)}" aria-label="${esc(v.color)}" style="background:${(COLORS.find(c => c[0] === v.color) || [, '#ccc'])[1]}"></a>`).join('')}</div>
          <div class="label row-between"><span>SIZE</span><a href="#/help#size" class="u">SIZE GUIDE</a></div>
          <div class="sizes" role="radiogroup" aria-label="Size">${it.sizes.map(z => `<button role="radio" aria-checked="${z === ui.size}" class="${z === ui.size ? 'on' : ''}" data-act="size" data-size="${esc(z)}">${esc(z)}</button>`).join('')}</div>
          <button class="btn btn-dark btn-wide" data-act="add"><span class="row">${icon('plus', 20)}${ui.added ? 'Add another' : 'Add to bag'}</span><span>${R(it.price)}</span></button>
          ${ui.added ? `<a class="added-bar" href="#/bag"><span>${icon('check', 16)} Added to bag</span><span class="u">View bag (${cartCount()})</span></a>` : ''}
          <button class="btn btn-outline btn-wide" data-act="fav" data-vid="${it.vid}" aria-pressed="${fav}"><span class="row">${icon('heart', 18, fav)}${fav ? 'Saved' : 'Save to wishlist'}</span></button>
          <div class="acc">${acc.map(([k, t, b]) => `
            <div class="acc-item">
              <button class="acc-btn" data-act="acc" data-k="${k}" aria-expanded="${ui.acc === k}"><span>${t}</span><span class="chev ${ui.acc === k ? 'open' : ''}">${icon('chevD')}</span></button>
              ${ui.acc === k ? `<div class="acc-body">${esc(b)}</div>` : ''}
            </div>`).join('')}
          </div>
        </div>
      </div>
      <section class="wrap">
        <div class="sec-head"><h2>Complete the look</h2></div>
        <div class="grid4">${related.map(x => card(x)).join('')}</div>
      </section>`,
    };
  };

  views.saved = () => {
    const saved = ITEMS.filter(i => state.favs[i.vid]);
    return {
      title: 'Saved · Hashtag Tshisaah',
      html: `<div class="wrap page">
        <div class="sec-head tight"><h1 class="h2">Saved</h1><span class="muted">${saved.length} items</span></div>
        ${saved.length ? `<div class="grid4">${saved.map(it => card(it, `<a class="btn btn-outline btn-sm" href="#/p/${it.vid}">Choose size</a>`)).join('')}</div>`
          : empty('Nothing saved yet. Tap the heart on any piece.', 'Browse the shop')}
      </div>`,
    };
  };

  views.bag = () => {
    const n = cartCount(), sub = subtotal(state.cart);
    return {
      title: `Bag (${n}) · Hashtag Tshisaah`,
      html: `<div class="wrap page bag">
        <div>
          <h1 class="h2 page-h">Bag (${n})</h1>
          ${!n ? empty('Your bag is empty.') : state.cart.map((l, i) => {
            const it = byId(l.vid);
            return `<div class="bag-line">
              <a class="thumb lg" href="#/p/${it.vid}" style="--bg:${it.bg}"><img src="${it.img}" alt="${esc(it.name)}"></a>
              <div class="bag-mid">
                <a href="#/p/${it.vid}" class="bag-name">${esc(it.name)}</a>
                <span class="muted">Size ${esc(l.size)} · ${R(it.price)} each</span>
                <div class="qty"><button data-act="qty" data-i="${i}" data-d="-1" aria-label="Decrease quantity">−</button><span aria-live="polite">${l.qty}</span><button data-act="qty" data-i="${i}" data-d="1" aria-label="Increase quantity">+</button></div>
              </div>
              <div class="bag-end"><span>${R(it.price * l.qty)}</span><button class="u muted" data-act="remove" data-i="${i}">Remove</button></div>
            </div>`;
          }).join('')}
        </div>
        ${n ? `<aside class="summary">
          <div class="label">ORDER SUMMARY</div>
          <div class="row-between"><span>Subtotal</span><span>${R(sub)}</span></div>
          <div class="row-between muted"><span>Delivery</span><span>From R 59</span></div>
          <hr class="rule">
          <div class="row-between total"><span>Total</span><span>${R(sub)}</span></div>
          <a class="btn btn-dark btn-wide" href="#/checkout/details"><span>Checkout</span>${icon('arrow')}</a>
          <div class="muted small">Card · Instant EFT · SnapScan</div>
        </aside>` : ''}
      </div>`,
    };
  };

  /* ----- checkout ----- */
  const STEPS = ['details', 'delivery', 'payment'];
  const FIELDS = {
    details: [['email', 'EMAIL', 1, 'name@email.com', 'email', 'email'], ['phone', 'MOBILE (FOR WHATSAPP UPDATES)', 1, '07x xxx xxxx', 'tel', 'tel'],
      ['first', 'FIRST NAME', 1, '', 'text', 'given-name'], ['last', 'LAST NAME', 1, '', 'text', 'family-name']],
    delivery: [['street', 'STREET ADDRESS', 2, '', 'text', 'address-line1'], ['suburb', 'SUBURB', 1, '', 'text', 'address-level3'],
      ['city', 'CITY', 1, '', 'text', 'address-level2'], ['postal', 'POSTAL CODE', 1, '', 'text', 'postal-code'], ['province', 'PROVINCE', 1, '', 'select', 'address-level1']],
  };
  const stepKeys = step => (step === 'delivery' && state.delivery === 'collect') ? [] : (FIELDS[step] || []).map(f => f[0]);

  function validate(step) {
    const f = state.form, e = {};
    stepKeys(step).forEach(k => { if (!String(f[k] || '').trim()) e[k] = 'Required'; });
    if (step === 'details') {
      if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
      if (f.phone && String(f.phone).replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit number';
    }
    if (step === 'delivery' && f.postal && !/^\d{4}$/.test(String(f.postal).trim()) && state.delivery !== 'collect') e.postal = 'Enter a 4-digit code';
    return e;
  }

  const field = ([k, label, span, ph, type, ac]) => {
    const v = state.form[k] || '', err = ui.errors[k];
    const ctrl = type === 'select'
      ? `<select name="${k}" autocomplete="${ac}" ${err ? 'aria-invalid="true"' : ''}><option value="">Select…</option>${PROVINCES.map(p => `<option ${p === v ? 'selected' : ''}>${p}</option>`).join('')}</select>`
      : `<input name="${k}" type="${type}" value="${esc(v)}" placeholder="${ph}" autocomplete="${ac}" ${err ? 'aria-invalid="true"' : ''}>`;
    return `<label class="field ${span === 2 ? 'span2' : ''} ${err ? 'has-err' : ''}"><span>${label}</span>${ctrl}${err ? `<em>${err}</em>` : ''}</label>`;
  };

  const radioCard = (o, on, act, price) => `
    <button type="button" class="opt ${on ? 'on' : ''}" data-act="${act}" data-k="${o.key}" role="radio" aria-checked="${on}">
      <span class="dot"><span></span></span>
      <span class="opt-txt"><span>${o.label}</span><span class="muted small">${o.sub}</span></span>
      ${price != null ? `<span>${price}</span>` : ''}
    </button>`;

  views.checkout = r => {
    if (!cartCount()) return { title: 'Checkout · Hashtag Tshisaah', html: `<div class="wrap page">${empty('Your bag is empty.')}</div>` };
    let step = STEPS.includes(r.arg) ? r.arg : 'details';
    // Don't allow skipping ahead past an incomplete step
    for (const s of STEPS.slice(0, STEPS.indexOf(step))) { if (Object.keys(validate(s)).length) { step = s; break; } }
    if (step !== r.arg) { history.replaceState(null, '', '#/checkout/' + step); }
    if (!state.form.email && state.user) state.form.email = state.user.email;

    const idx = STEPS.indexOf(step), sub = subtotal(state.cart), del = delOf(state.delivery);
    const total = sub + (idx > 0 ? del.price : 0);
    const titles = ['Your details', 'Where should we deliver?', 'Payment'];
    const nextLabel = ['Continue to delivery', 'Continue to payment', 'Pay ' + R(sub + del.price)][idx];
    const payNote = {
      card: 'You’ll enter your card on Yoco’s secure payment page. We never see or store your card number.',
      eft: 'You’ll be sent to your bank via PayFast to approve the payment, then brought back here.',
      snap: 'A SnapScan code will appear on the next screen. Scan it with your SnapScan or banking app.',
    }[state.pay];

    return {
      title: 'Checkout · Hashtag Tshisaah', checkout: true,
      html: `<div class="wrap page co">
        <form class="co-main" id="coForm" novalidate data-step="${step}">
          <ol class="steps">${['Details', 'Delivery', 'Payment'].map((l, i) => `<li class="${i <= idx ? 'on' : ''}">${i < idx ? `<a href="#/checkout/${STEPS[i]}">` : '<span>'}<span class="bar"></span><span>0${i + 1}  ${l.toUpperCase()}</span>${i < idx ? '</a>' : '</span>'}</li>`).join('')}</ol>
          <h1 class="h2">${titles[idx]}</h1>
          ${step === 'delivery' ? `<div class="label">DELIVERY METHOD</div><div class="opts" role="radiogroup">${DEL.map(o => radioCard(o, o.key === state.delivery, 'del', o.price ? R(o.price) : 'Free')).join('')}</div>` : ''}
          ${step === 'payment' ? `<div class="opts" role="radiogroup">${PAY.map(o => radioCard(o, o.key === state.pay, 'pay')).join('')}</div><div class="note">${icon('lock', 16)} ${payNote}</div>
            ${CONFIG.demoMode ? '<div class="note demo">Preview mode: no money will be taken. The order is saved in this browser so you can try Track order and Account.</div>' : ''}` : ''}
          ${stepKeys(step).length ? `<div class="fields">${FIELDS[step].map(field).join('')}</div>` : ''}
          ${step === 'delivery' && state.delivery === 'collect' ? '<div class="note">We’ll WhatsApp you to book a collection time once your order is packed.</div>' : ''}
          <div class="co-actions">
            <a class="btn btn-outline" href="${idx ? '#/checkout/' + STEPS[idx - 1] : '#/bag'}">${icon('chevL', 16)}${idx ? 'Back' : 'Bag'}</a>
            <button class="btn btn-dark grow" type="submit"><span>${nextLabel}</span>${icon('arrow')}</button>
          </div>
        </form>
        <aside class="summary">
          <div class="label">ORDER SUMMARY · ${cartCount()} ITEMS</div>
          ${state.cart.map(l => lineRow(l)).join('')}
          <div class="row-between"><span>Subtotal</span><span>${R(sub)}</span></div>
          <div class="row-between muted"><span>Delivery</span><span>${idx > 0 ? (del.price ? R(del.price) : 'Free') : 'Next step'}</span></div>
          <hr class="rule">
          <div class="row-between total"><span>Total</span><span>${R(total)}</span></div>
          ${idx === 2 ? `<div class="muted small">Delivering to ${state.delivery === 'collect' ? 'studio collection' : esc(`${state.form.street}, ${state.form.suburb}, ${state.form.city}`)}</div>` : ''}
        </aside>
      </div>`,
    };
  };

  function placeOrder() {
    const f = state.form;
    const last = state.orders.reduce((m, o) => Math.max(m, +o.no.split('-')[1] || 0), 10482);
    const order = {
      no: 'TSH-' + (last + 1), email: f.email.trim(), phone: f.phone, name: `${f.first} ${f.last}`.trim(),
      status: 'received', createdAt: Date.now(), delivery: state.delivery, pay: state.pay,
      address: state.delivery === 'collect' ? 'Studio collection, by appointment' : `${f.street}, ${f.suburb}, ${f.city} ${f.postal}`,
      lines: state.cart.map(l => ({ ...l })),
    };
    const total = subtotal(order.lines) + delOf(order.delivery).price;
    track('purchase', { transaction_id: order.no, currency: 'ZAR', value: total, shipping: delOf(order.delivery).price });
    state.orders.push(order); state.cart = []; save();
    // Live mode: this is where the browser is handed to Yoco / PayFast — see README → Going live.
    location.hash = '#/order/' + order.no + '?new=1';
  }

  const orderTotal = o => subtotal(o.lines) + delOf(o.delivery).price;
  const orderSummary = o => {
    const del = delOf(o.delivery);
    return `<aside class="summary">
      <div class="label">ORDER #${o.no}</div>
      ${o.lines.map(l => lineRow(l)).join('')}
      <div class="row-between"><span>${del.label}</span><span>${del.price ? R(del.price) : 'Free'}</span></div>
      <hr class="rule">
      <div class="row-between total"><span>Total paid</span><span>${R(orderTotal(o))}</span></div>
      <div class="muted small">Delivering to<br>${esc(o.address)}</div>
    </aside>`;
  };

  views.order = r => {
    const o = findOrder(r.arg || '');
    if (!o) return views.notfound();
    const fresh = r.q.get('new') === '1';
    return {
      title: `Order #${o.no} · Hashtag Tshisaah`, checkout: fresh,
      html: `<div class="done">
        <div class="done-copy">
          ${fresh ? '<div class="script-xl">Sharp!</div><h1>Order placed.</h1>' : `<h1>Order #${o.no}</h1>`}
          <p>Order #${o.no}. A confirmation is on its way to ${esc(o.email)}. We’ll WhatsApp you when it ships.</p>
          <div class="row wrap-gap">
            <a class="btn btn-light" href="#/">Continue shopping ${icon('arrow')}</a>
            <a class="btn btn-ghost-light" href="#/track?no=${o.no}&email=${encodeURIComponent(o.email)}">Track this order</a>
          </div>
        </div>
        <div class="done-sum">${orderSummary(o)}</div>
      </div>`,
    };
  };

  const STATUS = [['received', 'Order received', 'We’ve got your order and payment.'], ['packed', 'Packed', 'Your pieces are packed and ready.'],
    ['shipped', 'Shipped', 'On its way with the courier.'], ['delivered', 'Delivered', 'Enjoy — tag us #Tshisaah.']];

  const timeline = o => {
    const at = STATUS.findIndex(s => s[0] === o.status);
    return `<div class="track-card">
      <div class="row-between"><span class="label">ORDER #${o.no}</span><span class="muted small">${new Date(o.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
      <ol class="timeline">${STATUS.map(([k, l, d], i) => `<li class="${i <= at ? 'on' : ''} ${i === at ? 'now' : ''}"><span class="tl-dot">${i <= at ? icon('check', 14) : ''}</span><span><b>${l}</b><span class="muted small">${i === at ? d : ''}</span></span></li>`).join('')}</ol>
      ${o.waybill ? `<div class="note">${icon('truck', 16)} Waybill ${esc(o.waybill)}</div>` : ''}
      ${orderSummary(o)}
    </div>`;
  };

  views.track = r => {
    const no = r.q.get('no') || '', email = r.q.get('email') || '';
    let result = '';
    if (no) {
      const o = findOrder(no);
      result = o && o.email.toLowerCase() === email.trim().toLowerCase() ? timeline(o)
        : `<div class="note err">We couldn’t find order “${esc(no)}” for that email. Check your confirmation email, or WhatsApp us.</div>`;
    }
    return {
      title: 'Track your order · Hashtag Tshisaah',
      html: `<div class="wrap page narrow">
        <h1 class="h2 page-h">Track your order</h1>
        <p class="muted">Enter the order number from your confirmation and the email you used at checkout.</p>
        <form class="fields" id="trackForm">
          <label class="field"><span>ORDER NUMBER</span><input name="no" value="${esc(no)}" placeholder="TSH-10482" required></label>
          <label class="field"><span>EMAIL</span><input name="email" type="email" value="${esc(email)}" placeholder="name@email.com" required></label>
          <button class="btn btn-dark span2" type="submit"><span>Track order</span>${icon('arrow')}</button>
        </form>
        ${CONFIG.demoMode && !no ? '<p class="muted small">Demo: try <b>TSH-10482</b> with <b>lerato.m@gmail.com</b>.</p>' : ''}
        ${result}
      </div>`,
    };
  };

  views.account = () => {
    if (state.user) {
      const mine = [...state.orders].filter(o => o.email.toLowerCase() === state.user.email.toLowerCase()).reverse();
      const saved = ITEMS.filter(i => state.favs[i.vid]).length;
      return {
        title: 'My account · Hashtag Tshisaah',
        html: `<div class="wrap page">
          <div class="sec-head tight"><h1 class="h2">Hi ${esc(state.user.name || 'there')}</h1><button class="u muted" data-act="signout">Sign out</button></div>
          <div class="acct">
            <div class="acct-cell"><span class="label">EMAIL</span><span>${esc(state.user.email)}</span></div>
            <div class="acct-cell"><span class="label">ORDERS</span><span>${mine.length}</span></div>
            <div class="acct-cell"><a href="#/saved"><span class="label">SAVED</span><span>${saved} items →</span></a></div>
          </div>
          <h2 class="h3">Order history</h2>
          ${mine.length ? `<div class="orders">${mine.map(o => `<a class="order-row" href="#/track?no=${o.no}&email=${encodeURIComponent(o.email)}">
              <span>#${o.no}</span><span class="muted">${new Date(o.createdAt).toLocaleDateString('en-ZA')}</span>
              <span class="tag">${(STATUS.find(s => s[0] === o.status) || STATUS[0])[1]}</span><span>${R(orderTotal(o))}</span>${icon('chevR')}</a>`).join('')}</div>`
            : empty('No orders yet.', 'Shop the drop')}
        </div>`,
      };
    }
    const up = ui.authMode === 'up';
    return {
      title: 'Sign in · Hashtag Tshisaah',
      html: `<div class="wrap page narrow">
        <div class="seg" role="tablist">
          <button role="tab" aria-selected="${!up}" class="${!up ? 'on' : ''}" data-act="auth" data-m="in">Sign in</button>
          <button role="tab" aria-selected="${up}" class="${up ? 'on' : ''}" data-act="auth" data-m="up">Create account</button>
        </div>
        <h1 class="h2 page-h">${up ? 'Create your account' : 'Welcome back'}</h1>
        <p class="muted">${up ? 'Check out faster, track every order and keep your saved pieces.' : 'Sign in to see your orders and saved pieces.'}</p>
        <form class="fields" id="authForm">
          ${up ? '<label class="field span2"><span>FIRST NAME</span><input name="name" autocomplete="given-name" required></label>' : ''}
          <label class="field span2"><span>EMAIL</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="field span2"><span>PASSWORD</span><input name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" required></label>
          <button class="btn btn-dark span2" type="submit"><span>${up ? 'Create account' : 'Sign in'}</span>${icon('arrow')}</button>
        </form>
        ${CONFIG.demoMode ? '<p class="muted small">Preview mode: accounts are kept on this device only, and passwords are not stored.</p>' : ''}
      </div>`,
    };
  };

  views.lookbook = () => ({
    title: 'Lookbook · Hashtag Tshisaah',
    html: `<div class="wrap page">
      <div class="sec-head tight"><h1 class="h2">Lookbook</h1><a class="link-arrow" href="${CONFIG.socials.instagram}" target="_blank" rel="noopener">${icon('instagram')} Tag #Tshisaah</a></div>
      <div class="gallery">${ITEMS.map(it => `<figure><button data-act="lightbox" data-src="${it.img}" data-alt="${esc(it.name)}" style="--bg:${it.bg}"><img src="${it.img}" alt="${esc(it.name)}" loading="lazy"></button>
        <figcaption><a href="#/p/${it.vid}">${esc(it.name)}</a><span>${R(it.price)}</span></figcaption></figure>`).join('')}</div>
    </div>`,
  });

  views.contact = () => ({
    title: 'Contact · Hashtag Tshisaah',
    html: `<div class="wrap page contact">
      <div>
        <h1 class="h2 page-h">Talk to us</h1>
        <p class="muted">Questions about sizing, an order, or bulk orders for your crew? Send a message and it opens straight in WhatsApp.</p>
        <form class="fields" id="contactForm">
          <label class="field"><span>NAME</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>ORDER NUMBER (OPTIONAL)</span><input name="order" placeholder="TSH-…"></label>
          <label class="field span2"><span>MESSAGE</span><textarea name="msg" rows="5" required></textarea></label>
          <button class="btn btn-dark span2" type="submit"><span>Send via WhatsApp</span>${icon('chat')}</button>
        </form>
      </div>
      <aside class="summary">
        <div class="label">REACH US</div>
        <a class="row" href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">${icon('chat')} WhatsApp</a>
        <a class="row" href="mailto:${CONFIG.email}">${icon('mail')} ${esc(CONFIG.email)}</a>
        <hr class="rule">
        <div class="label">FOLLOW</div>
        <div class="socials dark">${socials()}</div>
      </aside>
    </div>`,
  });

  views.help = () => ({
    title: 'Help · Hashtag Tshisaah',
    html: `<div class="wrap page narrow prose">
      <h1 class="h2 page-h">Help</h1>
      <section id="delivery"><h2 class="h3">Delivery</h2>
        <table class="tbl"><thead><tr><th>Method</th><th>Time</th><th>Cost</th></tr></thead><tbody>
        ${DEL.map(d => `<tr><td>${d.label}</td><td>${d.sub.split('·').pop().trim()}</td><td>${d.price ? R(d.price) : 'Free'}</td></tr>`).join('')}
        </tbody></table>
        <p>Orders are packed within 1–2 working days. We send your tracking number by WhatsApp and email when it ships.</p></section>
      <section id="returns"><h2 class="h3">Returns &amp; exchanges</h2>
        <p>Returns are accepted within 30 days on unworn, unwashed items with tags. WhatsApp us your order number to arrange a return or size swap.</p></section>
      <section id="size"><h2 class="h3">Size guide</h2>
        <table class="tbl"><thead><tr><th>Tee</th><th>S</th><th>M</th><th>L</th><th>XL</th></tr></thead><tbody>
          <tr><td>Chest (cm)</td><td>96</td><td>102</td><td>108</td><td>114</td></tr>
          <tr><td>Length (cm)</td><td>69</td><td>71</td><td>73</td><td>75</td></tr></tbody></table>
        <table class="tbl"><thead><tr><th>Bucket hat</th><th>S/M</th><th>L/XL</th></tr></thead><tbody>
          <tr><td>Head (cm)</td><td>56–57</td><td>58–60</td></tr></tbody></table>
        <p class="muted small">Tee measurements are a guide. Confirm final measurements with the supplier before launch.</p></section>
      <section id="payment"><h2 class="h3">Payment</h2>
        <p>Pay by card, Instant EFT or SnapScan. Card payments are handled on a secure payment page, so your card details never touch our site.</p></section>
      <section id="privacy"><h2 class="h3">Privacy (POPIA)</h2>
        <p>We only collect what we need to deliver your order: your name, contact details and address. We don’t sell or share your data, except with the courier delivering your parcel. Ask us any time to see or delete your information.</p></section>
      <section id="terms"><h2 class="h3">Terms</h2>
        <p>Prices are in South African Rand and include VAT where applicable. Stock is limited per drop and orders are confirmed once payment is received.</p></section>
    </div>`,
  });

  views.notfound = () => ({
    title: 'Not found · Hashtag Tshisaah',
    html: `<div class="wrap page">${empty('We couldn’t find that page.', 'Back to the shop')}</div>`,
  });

  function socials() {
    const s = CONFIG.socials;
    return `<a href="${s.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram', 20)}</a>
      <a href="${s.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">${icon('tiktok', 20)}</a>
      <a href="${s.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook', 20)}</a>
      <a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('chat', 20)}</a>`;
  }

  /* ---------- router ---------- */
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const qi = h.indexOf('?');
    const path = qi >= 0 ? h.slice(0, qi) : h;
    const parts = path.split('#')[0].split('/').filter(Boolean);
    return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts[1]) : null, q: new URLSearchParams(qi >= 0 ? h.slice(qi + 1) : ''), anchor: path.split('#')[1] };
  }

  let lastKey = null;
  function render() {
    const r = parse();
    const view = views[r.name] || views.notfound;
    const out = view(r);
    const app = document.getElementById('app');
    app.innerHTML = out.html;
    document.title = out.title;
    document.body.classList.toggle('in-checkout', !!out.checkout);

    const key = r.name + '/' + (r.arg || '') + '?' + r.q.toString() + '#' + (r.anchor || '');
    if (key !== lastKey) {
      lastKey = key;
      const target = r.anchor && document.getElementById(r.anchor);
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
      closeMenu();
    }

    // Header state
    document.querySelectorAll('[data-count="bag"]').forEach(e => { e.textContent = cartCount(); });
    document.querySelectorAll('[data-count="saved"]').forEach(e => { e.textContent = Object.values(state.favs).filter(Boolean).length; });
    const navKey = r.name === 'shop' ? 'shop-' + (r.q.get('cat') || 'all') : r.name;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey));
    document.getElementById('accountLink').textContent = state.user ? 'Hi ' + (state.user.name || 'there') : 'Account';
  }

  /* ---------- events ---------- */
  function setFav(vid) {
    state.favs[vid] = !state.favs[vid];
    if (!state.favs[vid]) delete state.favs[vid];
    save(); render();
    toast(state.favs[vid] ? 'Saved to your wishlist' : 'Removed from saved');
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    switch (act) {
      case 'fav': e.preventDefault(); setFav(el.dataset.vid); break;
      case 'color': { const c = el.dataset.color; ui.colors.has(c) ? ui.colors.delete(c) : ui.colors.add(c); render(); break; }
      case 'clear-colors': ui.colors.clear(); render(); break;
      case 'size': ui.size = el.dataset.size; render(); break;
      case 'acc': ui.acc = ui.acc === el.dataset.k ? null : el.dataset.k; render(); break;
      case 'add': {
        const it = byId(ui.pdpVid);
        const i = state.cart.findIndex(l => l.vid === it.vid && l.size === ui.size);
        if (i >= 0) state.cart[i].qty++; else state.cart.push({ vid: it.vid, size: ui.size, qty: 1 });
        ui.added = true; save(); render();
        track('add_to_cart', { currency: 'ZAR', value: it.price, items: [{ item_id: it.vid, item_name: it.name, item_variant: ui.size }] });
        toast(`Added ${it.name} (${ui.size})`);
        break;
      }
      case 'qty': {
        const i = +el.dataset.i; state.cart[i].qty += +el.dataset.d;
        state.cart = state.cart.filter(l => l.qty > 0); save(); render(); break;
      }
      case 'remove': state.cart.splice(+el.dataset.i, 1); save(); render(); break;
      case 'del': state.delivery = el.dataset.k; ui.errors = {}; save(); render(); break;
      case 'pay': state.pay = el.dataset.k; render(); break;
      case 'auth': ui.authMode = el.dataset.m; render(); break;
      case 'signout': state.user = null; save(); render(); toast('Signed out'); break;
      case 'menu': openMenu(); break;
      case 'menu-close': closeMenu(); break;
      case 'lightbox': {
        const lb = document.getElementById('lightbox'), img = lb.querySelector('img');
        img.src = el.dataset.src; img.alt = el.dataset.alt || '';
        if (lb.showModal) lb.showModal(); break;
      }
      case 'lb-close': document.getElementById('lightbox').close(); break;
      case 'skip': e.preventDefault(); document.getElementById('app').focus(); break;
    }
  });

  // Keep checkout input in state so re-renders and step changes don't lose it
  document.addEventListener('input', e => {
    const form = e.target.closest('#coForm');
    if (!form || !e.target.name) return;
    state.form[e.target.name] = e.target.value;
    if (ui.errors[e.target.name]) {
      delete ui.errors[e.target.name];
      const lbl = e.target.closest('.field'); lbl.classList.remove('has-err'); e.target.removeAttribute('aria-invalid');
      const em = lbl.querySelector('em'); if (em) em.remove();
    }
    save();
  });
  document.addEventListener('change', e => {
    if (e.target.closest('#coForm') && e.target.name) { state.form[e.target.name] = e.target.value; save(); }
  });

  document.addEventListener('submit', e => {
    const f = e.target;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f));
    if (f.id === 'coForm') {
      Object.assign(state.form, data); save();
      const step = f.dataset.step;
      ui.errors = validate(step);
      if (Object.keys(ui.errors).length) {
        render();
        const first = document.querySelector('[aria-invalid="true"]'); if (first) first.focus();
        return;
      }
      if (step === 'details') track('begin_checkout', { currency: 'ZAR', value: subtotal(state.cart) });
      if (step === 'payment') return placeOrder();
      location.hash = '#/checkout/' + STEPS[STEPS.indexOf(step) + 1];
    } else if (f.id === 'trackForm') {
      location.hash = `#/track?no=${encodeURIComponent(data.no.trim())}&email=${encodeURIComponent(data.email.trim())}`;
    } else if (f.id === 'authForm') {
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const email = data.email.trim();
      const known = state.orders.find(o => o.email.toLowerCase() === email.toLowerCase());
      state.user = { email, name: data.name || (known && known.name.split(' ')[0]) || email.split('@')[0] };
      save(); render(); toast('Signed in');
    } else if (f.id === 'contactForm') {
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const text = `Hi #Tshisaah, it's ${data.name}.${data.order ? ' Order ' + data.order + '.' : ''}\n\n${data.msg}`;
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  });

  /* ---------- menu ---------- */
  const drawer = document.getElementById('drawer');
  function openMenu() { drawer.hidden = false; document.querySelector('[data-act="menu"]').setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { if (drawer.hidden) return; drawer.hidden = true; document.querySelector('[data-act="menu"]').setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  drawer.addEventListener('click', e => { if (e.target === drawer || e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.getElementById('lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.target.close(); });

  /* ---------- static bits ---------- */
  document.querySelectorAll('[data-icon]').forEach(e => { e.outerHTML = icon(e.dataset.icon, e.dataset.icon === 'lock' ? 15 : 18); });
  document.querySelector('[data-act="menu"]').innerHTML = icon('menu', 22);
  document.querySelector('[data-act="menu-close"]').innerHTML = icon('x', 22);
  document.querySelector('[data-act="lb-close"]').innerHTML = icon('x', 22);
  document.getElementById('socials').innerHTML = socials();
  document.getElementById('year').textContent = new Date().getFullYear();
  const fab = document.getElementById('waFab');
  fab.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('Hi #Tshisaah, ')}`;
  fab.innerHTML = icon('chat', 26);

  window.addEventListener('hashchange', render);
  render();
})();
