/* CRÈME — croissant ordering demo. Everything here is local; nothing is sent anywhere. */
(() => {
  'use strict';

  const DELIVERY_MIN = 10;
  const CART_KEY = 'creme-demo-basket';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let products = [];
  let byId = new Map();
  let currency = 'USD';
  let money = (n) => `$${n.toFixed(2)}`;
  let cart = {}; // product id -> quantity

  /* ---------- Utilities ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const pad = (n) => String(n).padStart(2, '0');
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const formatDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
  };

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-shown'), 2600);
  }

  /* ---------- Product data ---------- */
  async function loadProducts() {
    // Prefer the source file when served over HTTP; fall back to the generated copy for file://.
    try {
      const res = await fetch('docs/products.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch {
      return window.CREME_PRODUCTS;
    }
  }

  /* ---------- Carousel ---------- */
  function renderProducts() {
    const track = $('#carouselTrack');
    track.innerHTML = products.map((p, i) => `
      <li class="product-card" data-id="${esc(p.id)}">
        <div class="product-media">
          <img src="${esc(p.image)}" alt="${esc(p.name)} croissant" width="1122" height="1402" ${i < 4 ? '' : 'loading="lazy"'} decoding="async">
          <span class="product-tag">${esc(p.tag)}</span>
        </div>
        <div class="product-info">
          <div class="product-head">
            <h3 class="product-name">${esc(p.name)}</h3>
            <span class="product-price">${money(p.price)}</span>
          </div>
          <p class="product-desc">${esc(p.description)}</p>
          <div class="product-actions">
            <button class="btn btn-ghost" type="button" data-action="ingredients" aria-haspopup="dialog">Ingredients<span class="visually-hidden"> for ${esc(p.name)}</span></button>
            <button class="btn btn-primary" type="button" data-action="add">Add to Cart<span class="visually-hidden">: ${esc(p.name)}</span></button>
          </div>
        </div>
      </li>`).join('');

    track.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.closest('.product-card').dataset.id;
      if (btn.dataset.action === 'add') {
        addToCart(id, btn);
      } else {
        openIngredients(id, btn);
      }
    });
  }

  function initCarousel() {
    const track = $('#carouselTrack');
    const prev = $('#carouselPrev');
    const next = $('#carouselNext');

    const step = () => {
      const card = track.querySelector('.product-card');
      if (!card) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const perView = Math.max(1, Math.floor((track.clientWidth + gap) / (card.offsetWidth + gap)));
      return perView * (card.offsetWidth + gap);
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: reducedMotion.matches ? 'auto' : 'smooth' });

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    update();
    // Images can change track width once loaded
    $$('img', track).forEach((img) => img.addEventListener('load', update, { once: true }));
  }

  /* ---------- Dialog helpers ---------- */
  const openers = new WeakMap();

  function openDialog(dlg, opener) {
    if (dlg.open) return;
    openers.set(dlg, opener || document.activeElement);
    dlg.showModal();
    document.documentElement.classList.add('is-locked');
  }

  function closeDialog(dlg) {
    if (dlg.open) dlg.close();
  }

  function initDialogs() {
    $$('dialog').forEach((dlg) => {
      // Close buttons
      dlg.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) closeDialog(dlg);
      });
      // Outside click: the press must start AND end on the backdrop (avoids closing on text-selection drags)
      let downOnBackdrop = false;
      dlg.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === dlg; });
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg && downOnBackdrop) closeDialog(dlg);
        downOnBackdrop = false;
      });
      // Escape is handled natively via the "cancel" event; "close" fires for every path.
      dlg.addEventListener('close', () => {
        if (!$$('dialog').some((d) => d.open)) document.documentElement.classList.remove('is-locked');
        const opener = openers.get(dlg);
        if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- Ingredients modal ---------- */
  let ingProductId = null;

  function openIngredients(id, opener) {
    const p = byId.get(id);
    if (!p) return;
    ingProductId = id;
    const img = $('#ingImg');
    img.src = p.image;
    img.alt = `${p.name} croissant`;
    $('#ingTag').textContent = p.tag;
    $('#ingTitle').textContent = p.name;
    $('#ingPrice').textContent = money(p.price);
    $('#ingList').textContent = p.ingredients;
    $('#ingAllergens').innerHTML = p.allergens.map((a) => `<li>${esc(a)}</li>`).join('');
    $('#ingAdd').innerHTML = `Add to Cart<span class="visually-hidden">: ${esc(p.name)}</span>`;
    const dlg = $('#ingredientsModal');
    openDialog(dlg, opener);
    $('.modal-panel', dlg).scrollTop = 0;
  }

  function initIngredients() {
    $('#ingAdd').addEventListener('click', () => {
      const dlg = $('#ingredientsModal');
      const opener = openers.get(dlg);
      closeDialog(dlg);
      if (ingProductId) addToCart(ingProductId, opener);
    });
  }

  /* ---------- Basket ---------- */
  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      Object.entries(saved).forEach(([id, q]) => {
        const qty = Math.floor(Number(q));
        if (byId.has(id) && qty > 0) cart[id] = Math.min(qty, 999);
      });
    } catch { /* storage unavailable — basket stays in memory */ }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }

  const totalUnits = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(cart).reduce((sum, [id, q]) => sum + byId.get(id).price * q, 0);
  const fulfilment = () => $('input[name="fulfilment"]:checked').value;

  function addToCart(id, opener) {
    cart[id] = Math.min((cart[id] || 0) + 1, 999);
    saveCart();
    renderCart();
    bumpCount();
    showCartView();
    openDialog($('#cartDrawer'), opener);
    $('#cartStatus').textContent = `Added ${byId.get(id).name} — ${cart[id]} in basket`;
  }

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, 999);
    saveCart();
    renderCart();
  }

  function bumpCount() {
    const el = $('#basketCount');
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function renderCart() {
    const units = totalUnits();
    $('#basketCount').textContent = units;
    $('#basketCountSr').textContent = `${units} ${units === 1 ? 'item' : 'items'}`;
    $('#basketBtn').setAttribute('aria-label', `Basket, ${units} ${units === 1 ? 'croissant' : 'croissants'}`);

    const empty = units === 0;
    $('#cartEmpty').hidden = !empty;
    $('#cartSummary').hidden = empty;

    const lines = $('#cartLines');
    // Preserve focus on a qty button across re-render
    const focused = document.activeElement?.closest?.('.cart-line') ? {
      id: document.activeElement.closest('.cart-line').dataset.id,
      action: document.activeElement.dataset.qty,
    } : null;

    lines.innerHTML = Object.entries(cart).map(([id, q]) => {
      const p = byId.get(id);
      return `
        <li class="cart-line" data-id="${esc(id)}">
          <img src="${esc(p.image)}" alt="" width="64" height="76" loading="lazy">
          <div>
            <p class="cart-line-name">${esc(p.name)}</p>
            <p class="cart-line-meta">${money(p.price)} each</p>
            <button class="remove-btn" type="button" data-qty="remove">Remove<span class="visually-hidden"> ${esc(p.name)}</span></button>
          </div>
          <div class="cart-line-right">
            <div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}">
              <button type="button" data-qty="dec" aria-label="Decrease ${esc(p.name)}">−</button>
              <output aria-live="polite">${q}</output>
              <button type="button" data-qty="inc" aria-label="Increase ${esc(p.name)}">+</button>
            </div>
            <span class="cart-line-total">${money(p.price * q)}</span>
          </div>
        </li>`;
    }).join('');

    if (focused) {
      const target = $(`.cart-line[data-id="${CSS.escape(focused.id)}"] [data-qty="${focused.action}"]`, lines);
      (target || $('#cartTitle').closest('.drawer-panel').querySelector('.modal-close')).focus();
    }

    $('#cartUnits').textContent = `(${units} ${units === 1 ? 'croissant' : 'croissants'})`;
    $('#cartSubtotal').textContent = money(subtotal());
    updateFulfilment();
  }

  function updateFulfilment() {
    const units = totalUnits();
    const isDelivery = fulfilment() === 'delivery';
    const met = units >= DELIVERY_MIN;
    const remaining = Math.max(0, DELIVERY_MIN - units);

    $('#thresholdFill').style.width = `${Math.min(100, (units / DELIVERY_MIN) * 100)}%`;
    const bar = $('#thresholdBar');
    bar.setAttribute('aria-valuenow', Math.min(units, DELIVERY_MIN));
    bar.setAttribute('aria-valuetext', `${Math.min(units, DELIVERY_MIN)} of ${DELIVERY_MIN} croissants`);
    $('#threshold').classList.toggle('is-met', met);
    $('#thresholdText').textContent = met
      ? `Delivery unlocked — ${units} croissants in your basket.`
      : `Delivery needs ${DELIVERY_MIN} croissants in total. Add ${remaining} more to unlock it. Pickup is available for any quantity.`;

    const addrField = $('#addressField');
    addrField.hidden = !isDelivery;
    $('#orderAddress').required = isDelivery;
    if (!isDelivery) setError($('#orderAddress'), '');

    const btn = $('#checkoutBtn');
    const blocked = units === 0 || (isDelivery && !met);
    btn.disabled = blocked;
    btn.textContent = isDelivery ? 'Place Demo Delivery Order' : 'Place Demo Pickup Order';
    $('#checkoutHint').textContent = isDelivery && !met
      ? `Add ${remaining} more ${remaining === 1 ? 'croissant' : 'croissants'} to place a delivery order, or switch to Pickup.`
      : 'Demo only — no order is sent and no payment is taken.';
  }

  function buildTimeSlots() {
    const sel = $('#orderTime');
    // Hours: daily 7:30 AM – 6:30 PM; last slot 6:00 PM
    for (let mins = 7 * 60 + 30; mins <= 18 * 60; mins += 30) {
      const v = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
      sel.add(new Option(formatTime(v), v));
    }
  }

  function setError(input, msg) {
    const err = input.closest('.field')?.querySelector('.field-error');
    if (err) err.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validateCheckout() {
    const date = $('#orderDate');
    const time = $('#orderTime');
    const addr = $('#orderAddress');
    const isDelivery = fulfilment() === 'delivery';
    const errors = [];

    if (!date.value) errors.push([date, 'Choose a date.']);
    else if (date.value < todayISO()) errors.push([date, 'Choose today or a later date.']);
    else setError(date, '');

    if (!time.value) errors.push([time, 'Choose a preferred time.']);
    else if (date.value === todayISO()) {
      const now = new Date();
      const [h, m] = time.value.split(':').map(Number);
      if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) errors.push([time, 'That time has passed today — choose a later slot or another date.']);
      else setError(time, '');
    } else setError(time, '');

    if (isDelivery && addr.value.trim().length < 6) errors.push([addr, 'Enter a delivery address.']);
    else setError(addr, '');

    errors.forEach(([el, msg]) => setError(el, msg));
    if (errors.length) errors[0][0].focus();
    return errors.length === 0;
  }

  function showCartView() {
    $('#cartView').hidden = false;
    $('#confirmView').hidden = true;
  }

  function showConfirmation() {
    const isDelivery = fulfilment() === 'delivery';
    const ref = `DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const items = Object.entries(cart).map(([id, q]) => `${q} × ${esc(byId.get(id).name)}`).join('<br>');
    const rows = [
      ['Reference', `${ref} <span class="muted">(not a real order)</span>`],
      ['Items', items],
      ['Subtotal', `${money(subtotal())} <span class="muted">— not charged</span>`],
      ['Method', isDelivery ? 'Delivery' : 'Pickup at counter'],
      ['When', `${esc(formatDate($('#orderDate').value))}, ${esc(formatTime($('#orderTime').value))}`],
    ];
    if (isDelivery) rows.push(['Address', esc($('#orderAddress').value.trim())]);
    const notes = $('#orderNotes').value.trim();
    if (notes) rows.push(['Notes', esc(notes)]);

    $('#confirmDetails').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('#cartView').hidden = true;
    const view = $('#confirmView');
    view.hidden = false;
    view.scrollTop = 0;
    view.focus();
  }

  function initCart() {
    loadCart();
    buildTimeSlots();
    $('#orderDate').min = todayISO();
    renderCart();

    $('#basketBtn').addEventListener('click', (e) => {
      $('#cartStatus').textContent = '';
      showCartView();
      openDialog($('#cartDrawer'), e.currentTarget);
    });

    $('#cartBrowse').addEventListener('click', () => {
      closeDialog($('#cartDrawer'));
      $('#filling').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });

    $('#cartLines').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty]');
      if (!btn) return;
      const id = btn.closest('.cart-line').dataset.id;
      const q = cart[id] || 0;
      if (btn.dataset.qty === 'inc') setQty(id, q + 1);
      else if (btn.dataset.qty === 'dec') setQty(id, q - 1);
      else setQty(id, 0);
    });

    $$('input[name="fulfilment"]').forEach((r) => r.addEventListener('change', updateFulfilment));

    // Clear an error as soon as the user fixes the field
    ['#orderDate', '#orderTime', '#orderAddress'].forEach((s) => {
      $(s).addEventListener('input', (e) => setError(e.target, ''));
      $(s).addEventListener('change', (e) => setError(e.target, ''));
    });

    $('#checkoutForm').addEventListener('submit', (e) => {
      e.preventDefault();
      updateFulfilment();
      if ($('#checkoutBtn').disabled) return;
      if (validateCheckout()) showConfirmation();
    });

    $('#backToCartBtn').addEventListener('click', () => { showCartView(); $('#checkoutBtn').focus(); });

    $('#newOrderBtn').addEventListener('click', () => {
      cart = {};
      saveCart();
      $('#checkoutForm').reset();
      $$('#checkoutForm [aria-invalid]').forEach((el) => setError(el, ''));
      renderCart();
      showCartView();
      $('#cartBrowse').focus();
    });

    // Keep the cart in sync if another tab changes it
    window.addEventListener('storage', (e) => {
      if (e.key !== CART_KEY) return;
      cart = {};
      loadCart();
      renderCart();
    });
  }

  /* ---------- Wholesale & Event inquiry forms ---------- */
  function initInquiries() {
    $$('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dlg = document.getElementById(btn.dataset.open);
        const form = $('form', dlg);
        form.reset();
        $$('[aria-invalid]', form).forEach((el) => setError(el, ''));
        $('.form-view', dlg).hidden = false;
        $('.ack-view', dlg).hidden = true;
        $('input[type="date"]', form).min = todayISO();
        openDialog(dlg, btn);
        $('.modal-panel', dlg).scrollTop = 0;
      });
    });

    $$('.inquiry-form').forEach((form) => {
      $$('input, select, textarea', form).forEach((el) => {
        el.addEventListener('input', () => setError(el, ''));
        el.addEventListener('change', () => setError(el, ''));
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = form.elements;
        const errors = [];
        const need = (el, msg) => { if (!el.value.trim()) errors.push([el, msg]); else setError(el, ''); };

        need(f.name, 'Enter your name.');
        if (!f.email.value.trim()) errors.push([f.email, 'Enter your email.']);
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) errors.push([f.email, 'Enter a valid email address.']);
        else setError(f.email, '');
        need(f.business, form.dataset.kind === 'wholesale' ? 'Enter your business name.' : 'Choose an event type.');
        const qty = Number(f.quantity.value);
        if (!f.quantity.value || !Number.isInteger(qty) || qty < 1) errors.push([f.quantity, 'Enter an estimated quantity of at least 1.']);
        else setError(f.quantity, '');
        if (!f.date.value) errors.push([f.date, 'Choose a date.']);
        else if (f.date.value < todayISO()) errors.push([f.date, 'Choose today or a later date.']);
        else setError(f.date, '');
        need(f.location, 'Enter a location.');

        errors.forEach(([el, msg]) => setError(el, msg));
        if (errors.length) { errors[0][0].focus(); return; }

        const dlg = form.closest('dialog');
        const first = esc(f.name.value.trim().split(/\s+/)[0]);
        const when = esc(formatDate(f.date.value));
        $('.ack-text', dlg).innerHTML = form.dataset.kind === 'wholesale'
          ? `Thank you, ${first}. Your wholesale request for <strong>${esc(f.business.value.trim())}</strong> — about ${qty} croissants per week from ${when} — has been previewed on this page only.`
          : `Thank you, ${first}. Your <strong>${esc(f.business.value.toLowerCase())}</strong> request for about ${qty} croissants on ${when} has been previewed on this page only.`;
        $('.form-view', dlg).hidden = true;
        const ack = $('.ack-view', dlg);
        ack.hidden = false;
        $('.modal-panel', dlg).scrollTop = 0;
        ack.focus();
      });
    });
  }

  /* ---------- Scroll reveals (replay in both directions) ---------- */
  function initReveals() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    const nav = $('#siteNav');
    const links = $('#navLinks');
    const menuBtn = $('#menuBtn');

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.6);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setMenu = (open) => {
      links.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) setMenu(false);
    });

    // Active link highlighting
    const map = new Map($$('a[data-nav]', links).map((a) => [a.dataset.nav, a]));
    const sections = ['top', 'filling', 'wholesale', 'about'].map((id) => document.getElementById(id));
    const setActive = () => {
      const probe = window.innerHeight * 0.4;
      let current = 'top';
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= probe) current = s.id; });
      map.forEach((a, id) => {
        a.classList.toggle('is-active', id === current);
        if (id === current) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', setActive, { passive: true });
    window.addEventListener('resize', setActive);
    window.addEventListener('load', setActive);
    setActive();

    // Footer placeholders — they do not lead anywhere
    $$('[data-placeholder]').forEach((b) => b.addEventListener('click', () => {
      toast(`${b.dataset.placeholder} is a placeholder in this demo — there is no real page.`);
    }));
  }

  /* ---------- Boot ---------- */
  async function init() {
    initNav();
    initReveals();
    initDialogs();

    const data = await loadProducts();
    products = data.products;
    currency = data.currency || 'USD';
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    money = (n) => fmt.format(n);
    byId = new Map(products.map((p) => [p.id, p]));

    renderProducts();
    initCarousel();
    initIngredients();
    initCart();
    initInquiries();
  }

  init();
})();
