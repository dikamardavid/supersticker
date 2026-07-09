/**
 * SuperSticker App - Main Application Logic
 * Mobile-optimized with full-screen responsive design
 */

// ============ STATE ============
let state = {
  view: 'home',
  cart: [],
  bills: null,
  checkoutIndex: 0,
  checkoutPicked: {},
  history: [],
  editingId: null,
  settings: {
    minBelanja: 100000,
    pwpEnabled: false,
    pwpMin: 120000
  },
  campaign: {
    target: 50,
    progress: 23,
    reward: 'Rice Cooker',
    deadline: '31 Agu 2026'
  }
};

// ============ UTILITIES ============
function idr(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ============ OPTIMIZER ============
function expandForOptimizer(cart) {
  const units = [];
  cart.forEach(item => {
    const qty = item.qty && item.qty > 0 ? item.qty : 1;
    for (let i = 0; i < qty; i++) {
      units.push({
        groupId: item.id,
        name: item.name,
        price: item.price,
        extra: item.extra
      });
    }
  });
  return units;
}

function groupBinItems(binItems) {
  const map = new Map();
  binItems.forEach(it => {
    const key = it.groupId;
    if (!map.has(key)) {
      map.set(key, {
        name: it.name,
        unitPrice: it.price,
        extra: it.extra,
        qty: 0,
        total: 0
      });
    }
    const g = map.get(key);
    g.qty += 1;
    g.total += it.price;
  });
  return [...map.values()];
}

function optimizeBills(items, settings) {
  const minBelanja = settings.minBelanja > 0 ? settings.minBelanja : 100000;
  const pwpEnabled = !!settings.pwpEnabled;
  const pwpMin = pwpEnabled && settings.pwpMin > minBelanja ? settings.pwpMin : null;

  const boosters = items.filter(i => i.extra).sort((a, b) => b.price - a.price);
  const fillers = items.filter(i => !i.extra).sort((a, b) => b.price - a.price);

  let bins = boosters.map(b => ({
    items: [b],
    sum: b.price,
    hasExtra: true
  }));
  if (bins.length === 0) bins.push({ items: [], sum: 0, hasExtra: false });

  let remaining = [...fillers];

  while (remaining.length) {
    const open = bins.filter(b => b.sum < minBelanja);
    if (open.length === 0) break;
    open.sort((a, b) => a.sum - b.sum);
    const target = open[0];
    const f = remaining.shift();
    target.items.push(f);
    target.sum += f.price;
  }

  if (pwpMin && remaining.length) {
    remaining.sort((a, b) => a.price - b.price);
    let progressed = true;
    while (progressed && remaining.length) {
      progressed = false;
      const openPwp = bins.filter(b => b.sum >= minBelanja && b.sum < pwpMin);
      if (!openPwp.length) break;
      openPwp.sort((a, b) => a.sum - b.sum);
      const bin = openPwp[0];
      const f = remaining[0];
      if (bin.sum + f.price <= pwpMin * 1.6) {
        remaining.shift();
        bin.items.push(f);
        bin.sum += f.price;
        progressed = true;
      } else break;
    }
    remaining.sort((a, b) => b.price - a.price);
  }

  const extraBins = [];
  let scraps = { items: [], sum: 0, hasExtra: false };
  for (const f of remaining) {
    scraps.items.push(f);
    scraps.sum += f.price;
    if (scraps.sum >= minBelanja) {
      extraBins.push(scraps);
      scraps = { items: [], sum: 0, hasExtra: false };
    }
  }

  let all = [...bins, ...extraBins];

  let under = all.filter(b => b.sum < minBelanja);
  let over = all.filter(b => b.sum >= minBelanja);
  under.sort((a, b) => a.sum - b.sum);
  while (under.length > 1) {
    const b1 = under.shift();
    const b2 = under.shift();
    const merged = {
      items: [...b1.items, ...b2.items],
      sum: b1.sum + b2.sum,
      hasExtra: b1.hasExtra || b2.hasExtra
    };
    if (merged.sum >= minBelanja) {
      over.push(merged);
    } else {
      under.unshift(merged);
    }
  }
  if (under.length === 1) {
    const leftover = under[0];
    if (over.length) {
      over[over.length - 1].items.push(...leftover.items);
      over[over.length - 1].sum += leftover.sum;
    } else {
      over.push(leftover);
    }
  }
  if (scraps.items.length) {
    if (over.length) {
      over[over.length - 1].items.push(...scraps.items);
      over[over.length - 1].sum += scraps.sum;
    } else {
      over.push(scraps);
    }
  }

  return over.map(b => ({
    items: b.items,
    total: b.sum,
    baseSticker: b.sum >= minBelanja ? 1 : 0,
    extraSticker: b.hasExtra && b.sum >= minBelanja ? 1 : 0,
    pwp: pwpMin ? b.sum >= pwpMin : false
  })).filter(b => b.items.length);
}

// ============ NAVIGATION ============
function setView(v) {
  state.view = v;
  render();
}

function openModal(html) {
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = html;
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeModal() {
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('show');
  setTimeout(() => {
    overlay.innerHTML = '';
  }, 200);
}

// ============ RENDER ============
function render() {
  renderHeader();
  renderContent();
  renderFooter();
}

function renderHeader() {
  const headerMap = {
    home: ['SuperSticker', null],
    cart: [state.cart.length + ' barang', 'home'],
    result: ['Rencana Checkout', 'cart'],
    kasir: [`Checkout · Bill ${state.checkoutIndex + 1}/${state.bills?.length || 1}`, 'result'],
    summary: ['Selesai', 'home'],
    riwayat: ['Riwayat Belanja', 'home'],
    tracker: ['Tracker Campaign', 'home']
  };
  const [title, backTo] = headerMap[state.view];
  document.getElementById('topbar').innerHTML = Components.header(title, backTo);
}

function renderFooter() {
  const tabbar = document.getElementById('tabbar');
  const showTabs = ['home', 'riwayat', 'tracker'].includes(state.view);
  if (!showTabs) {
    tabbar.style.display = 'none';
    return;
  }
  tabbar.style.display = 'flex';
  const tabs = [
    ['home', '🏠', 'Home'],
    ['riwayat', '📋', 'Riwayat'],
    ['tracker', '🎯', 'Tracker']
  ];
  tabbar.innerHTML = Components.footerNav(tabs, state.view);
}

function renderContent() {
  const screen = document.getElementById('screen');
  let html = '';

  if (state.view === 'home') html = viewHome();
  else if (state.view === 'cart') html = viewCart();
  else if (state.view === 'result') html = viewResult();
  else if (state.view === 'kasir') html = viewKasir();
  else if (state.view === 'summary') html = viewSummary();
  else if (state.view === 'riwayat') html = viewRiwayat();
  else if (state.view === 'tracker') html = viewTracker();

  screen.innerHTML = `<div class="content-safe">${html}</div>`;
  screen.scrollTop = 0;
}

// ============ VIEWS ============

// HOME VIEW
function viewHome() {
  const c = state.campaign;
  const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
  const last = state.history[0];

  return `
    ${Components.card(`
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.4px;margin-bottom:8px;text-transform:uppercase;opacity:0.8;">Campaign Aktif</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
          <div style="font-family:'Space Grotesk';font-weight:700;font-size:20px;">${c.progress} / ${c.target} sticker</div>
          <div style="font-size:12px;font-weight:600;">${pct}%</div>
        </div>
        ${Components.progress(pct)}
        <div style="font-size:12px;margin-top:8px;">Hadiah: ${c.reward} · deadline ${c.deadline}</div>
      </div>
    `, true)}

    ${Components.buttonPrimary('🛒 Mulai Belanja Baru', 'startNewShopping()')}

    ${last ? `
      <div style="font-size:13px;font-weight:700;color:var(--text-secondary);margin:20px 0 12px;text-transform:uppercase;letter-spacing:0.3px;">Belanja Terakhir</div>
      ${Components.card(`
        <div onclick="setView('riwayat')" style="cursor:pointer;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <b>${last.date}</b>
            <span style="color:var(--text-secondary);">→</span>
          </div>
          <div class="text-muted">${idr(last.total)} · ${last.stickers} sticker · ${last.billCount} bill</div>
        </div>
      `)}
    ` : `
      <div class="text-muted" style="text-align:center;margin-top:20px;">Belum ada riwayat belanja.</div>
    `}
  `;
}

function startNewShopping() {
  state.cart = [];
  state.editingId = null;
  setView('cart');
}

// CART VIEW
function viewCart() {
  const total = state.cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const canOptimize = state.cart.length > 0;
  const s = state.settings;

  return `
    ${Components.card(`
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
        <div class="text-muted">Total keranjang</div>
        <div class="hero-num" style="font-size:24px;">${idr(total)}</div>
      </div>
      <div class="text-muted">Min per sticker: <b>${idr(s.minBelanja)}</b>${s.pwpEnabled ? ` · PWP aktif (${idr(s.pwpMin)})` : ''}</div>
    `)}

    ${Components.button('⚙️ Pengaturan Optimasi', 'openSettings()', 'secondary', false).replace('btn', 'btn').replace('style="width:100%;"', 'style="width:100%;margin-bottom:14px;"')}

    ${state.cart.length === 0 ? 
      Components.emptyState('🧺', 'Keranjang masih kosong.<br>Tambahkan barang belanja Anda.') :
      state.cart.map(item => `
        <div class="item-row">
          <div onclick="openAddItem('${item.id}')" style="cursor:pointer;flex:1;">
            <div class="item-name">${item.name}${item.qty > 1 ? ` <span style="color:var(--text-secondary);">×${item.qty}</span>` : ''}</div>
            <div class="item-price">${idr(item.price)}${item.qty > 1 ? ` /unit · total ${idr(item.price * item.qty)}` : ''}</div>
          </div>
          <div class="item-actions">
            <button class="chip ${item.extra ? 'on' : ''}" onclick="toggleExtra('${item.id}')">⭐ Extra</button>
            <button class="btn-delete" onclick="openAddItem('${item.id}')" style="color:var(--text-secondary);">✎</button>
            <button class="btn-delete" onclick="removeItem('${item.id}')">✕</button>
          </div>
        </div>
      `).join('')
    }

    ${Components.buttonGhost('+ Tambah Barang', 'openAddItem(null)').replace('style="width:100%;"', 'style="width:100%;margin:16px 0 8px;')}

    <div class="sticky-bottom">
      ${Components.buttonPrimary('⚡ Optimalkan Bill', 'runOptimize()', !canOptimize)}
    </div>
  `;
}

function toggleExtra(id) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.extra = !item.extra;
    render();
  }
}

function removeItem(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  render();
}

function openSettings() {
  const s = state.settings;
  const html = `
    <div class="modal-sheet">
      ${Components.modalHeader('Pengaturan Optimasi', 'closeModal()')}
      ${Components.inputNumber('set-min', 'Minimum belanja per sticker (Rp)', s.minBelanja)}
      <div class="text-muted" style="margin-bottom:16px;">Aturan campaign berubah per periode/toko — sesuaikan sendiri di sini.</div>
      ${Components.toggleRow('Sertakan cek PWP', 'Opsional — hanya penanda tambahan', 'set-pwp-flag', s.pwpEnabled)}
      <div id="set-pwp-min-wrap" style="display:${s.pwpEnabled ? 'block' : 'none'};">
        ${Components.inputNumber('set-pwp-min', 'Minimum PWP (Rp)', s.pwpMin)}
      </div>
      ${Components.buttonPrimary('Terapkan', 'saveSettings()')}
    </div>
  `;
  openModal(`<div class="modal-overlay show">${html}</div>`);
}

function saveSettings() {
  const minBelanja = parseFloat(document.getElementById('set-min').value);
  const pwpEnabled = document.getElementById('set-pwp-flag').classList.contains('on');
  const pwpMin = parseFloat(document.getElementById('set-pwp-min')?.value || state.settings.pwpMin);

  if (minBelanja && minBelanja > 0) {
    state.settings = { minBelanja, pwpEnabled, pwpMin };
    closeModal();
    render();
  }
}

function openAddItem(editId) {
  state.editingId = editId || null;
  const existing = editId ? state.cart.find(i => i.id === editId) : null;

  const html = `
    <div class="modal-sheet">
      ${Components.modalHeader(existing ? 'Edit Barang' : 'Tambah Barang', 'closeModal()')}
      ${Components.input('in-name', 'Nama Barang', existing?.name || '', 'cth. Indomie Goreng')}
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        ${Components.inputNumber('in-price', 'Harga Satuan (Rp)', existing?.price || '', '14500').replace('<div class="field">', '<div class="field" style="flex:2;">')}
        ${Components.inputNumber('in-qty', 'Qty', existing?.qty || 1, '1').replace('<div class="field">', '<div class="field" style="flex:1;">')}
      </div>
      ${Components.toggleRow('Barang Extra Sticker ⭐', 'Tandai jika barang ini berlabel bonus sticker', 'in-extra-flag', existing?.extra || false)}
      <div class="text-muted" style="margin-bottom:16px;">Qty &gt; 1 boleh terpecah otomatis ke bill berbeda kalau itu bikin sticker lebih maksimal.</div>
      ${Components.buttonPrimary(existing ? 'Simpan Perubahan' : 'Simpan', 'saveItem()')}
      ${existing ? `<button class="btn" style="width:100%;background:none;color:var(--accent-rose);margin-top:8px;" onclick="removeItem('${existing.id}'); closeModal();">Hapus Barang</button>` : ''}
    </div>
  `;
  openModal(`<div class="modal-overlay show">${html}</div>`);
}

function saveItem() {
  const name = document.getElementById('in-name').value.trim();
  const price = parseFloat(document.getElementById('in-price').value);
  const qty = Math.max(1, parseInt(document.getElementById('in-qty').value) || 1);
  const extra = document.getElementById('in-extra-flag').classList.contains('on');

  if (name && price && price > 0) {
    if (state.editingId) {
      const item = state.cart.find(i => i.id === state.editingId);
      if (item) {
        item.name = name;
        item.price = price;
        item.qty = qty;
        item.extra = extra;
      }
    } else {
      state.cart.push({ id: uid(), name, price, qty, extra });
    }
    state.editingId = null;
    closeModal();
    render();
  }
}

// RESULT VIEW
function runOptimize() {
  state.bills = optimizeBills(expandForOptimizer(state.cart), state.settings);
  state.checkoutIndex = 0;
  state.checkoutPicked = {};
  setView('result');
}

function viewResult() {
  const bills = state.bills;
  const minBelanja = state.settings.minBelanja;
  const totalStickers = bills.reduce((s, b) => s + b.baseSticker + b.extraSticker, 0);
  const cartTotal = state.cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const naive = cartTotal >= minBelanja ? 1 : 0;

  return `
    ${Components.heroDisplay(totalStickers, 'TOTAL STICKER')}
    <div class="text-muted" style="text-align:center;margin-bottom:20px;">(vs ${naive} sticker jika dibayar 1 bill · min ${idr(minBelanja)}/sticker)</div>

    ${bills.map((b, i) => {
      const grouped = groupBinItems(b.items);
      return Components.ticket(
        i + 1,
        b.baseSticker + b.extraSticker,
        grouped.map(g => ({
          name: g.name,
          qty: g.qty,
          extra: g.extra,
          total: idr(g.total)
        })),
        idr(b.total),
        b.pwp,
        b.total < minBelanja,
        idr(minBelanja)
      );
    }).join('')}

    ${Components.buttonPrimary('Mulai Checkout →', 'setView("kasir")').replace('style="width:100%;"', 'style="width:100%;margin-top:12px;"')}
  `;
}

// KASIR VIEW
function viewKasir() {
  const bills = state.bills;
  const idx = state.checkoutIndex;
  const bill = bills[idx];
  const key = 'b' + idx;
  const picked = state.checkoutPicked[key] || {};
  const grouped = groupBinItems(bill.items);

  return `
    ${Components.dots(bills.length, idx)}
    <div class="text-muted" style="text-align:center;margin-bottom:16px;">Tunjukkan barang ini ke kasir sebagai <b>satu transaksi</b></div>

    ${grouped.map((g, i) => {
      return Components.checkItem(
        g.name,
        idr(g.total),
        g.extra,
        !!picked[i],
        `togglePick(${idx},${i})`
      );
    }).join('')}

    <div class="ticket-total" style="margin-top:16px;">
      <span>Total</span>
      <span>${idr(bill.total)}</span>
    </div>
    <div style="text-align:right;margin-top:4px;" class="text-muted">Sticker: ${bill.baseSticker + bill.extraSticker}</div>

    ${state.settings.pwpEnabled && bill.pwp ? `
      <div class="text-muted" style="margin-top:12px;">💡 Bill ini juga lolos ambang PWP (${idr(state.settings.pwpMin)}) — cek rak PWP di toko kalau sempat.</div>
    ` : ''}

    <div class="sticky-bottom">
      ${Components.buttonPrimary(
        idx < bills.length - 1 ? '✓ Bill Selesai — Lanjut' : '✓ Bill Terakhir — Selesai',
        'finishBill()'
      )}
    </div>
  `;
}

function togglePick(idx, i) {
  const key = 'b' + idx;
  if (!state.checkoutPicked[key]) state.checkoutPicked[key] = {};
  state.checkoutPicked[key][i] = !state.checkoutPicked[key][i];
  render();
}

function finishBill() {
  if (state.checkoutIndex < state.bills.length - 1) {
    state.checkoutIndex++;
    render();
  } else {
    finishSession();
  }
}

// SUMMARY VIEW
function finishSession() {
  const bills = state.bills;
  const totalStickers = bills.reduce((s, b) => s + b.baseSticker + b.extraSticker, 0);
  const totalSpend = bills.reduce((s, b) => s + b.total, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  state.history.unshift({ date: dateStr, stickers: totalStickers, total: totalSpend, billCount: bills.length });
  state.campaign.progress = Math.min(state.campaign.target, state.campaign.progress + totalStickers);
  state.lastSession = { totalStickers, totalSpend, billCount: bills.length };
  setView('summary');
}

function viewSummary() {
  const r = state.lastSession;
  const c = state.campaign;
  const pct = Math.min(100, Math.round((c.progress / c.target) * 100));

  return `
    <div style="text-align:center;margin:24px 0;">
      <div style="font-size:48px;margin-bottom:12px;">🎊</div>
      <div class="hero-num">${r.totalStickers}</div>
      <div style="font-weight:700;color:var(--text-secondary);font-size:13px;margin-top:2px;">STICKER DIDAPAT HARI INI</div>
    </div>

    ${Components.card(`
      ${Components.statRow('Total belanja', idr(r.totalSpend))}
      ${Components.statRow('Jumlah bill', r.billCount)}
    `)}

    ${Components.card(`
      <div style="font-weight:700;font-size:13px;margin-bottom:12px;">Campaign progress</div>
      ${Components.progress(pct)}
      <div class="text-muted">${c.progress} / ${c.target} sticker · ${c.reward}</div>
    `)}

    ${Components.buttonPrimary('Kembali ke Home', 'setView("home")').replace('style="width:100%;"', 'style="width:100%;margin-top:12px;"')}
  `;
}

// RIWAYAT VIEW
function viewRiwayat() {
  if (state.history.length === 0) {
    return Components.emptyState('📋', 'Belum ada riwayat belanja.<br>Riwayat akan muncul setelah checkout.');
  }
  return state.history.map(h => `
    ${Components.card(`
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <b>${h.date}</b>
        <span>${h.stickers} sticker</span>
      </div>
      <div class="text-muted">${idr(h.total)} · ${h.billCount} bill</div>
    `)}
  `).join('');
}

// TRACKER VIEW
function viewTracker() {
  const c = state.campaign;
  const pct = Math.min(100, Math.round((c.progress / c.target) * 100));

  return `
    ${Components.heroDisplay(pct + '%', `${c.progress} dari ${c.target} sticker`)}
    ${Components.progress(pct)}

    ${Components.card(`
      ${Components.inputNumber('tk-target', 'Target sticker', c.target)}
      ${Components.input('tk-reward', 'Nama hadiah', c.reward)}
      ${Components.input('tk-deadline', 'Deadline', c.deadline)}
    `)}

    ${Components.buttonPrimary('Simpan Perubahan', 'saveTracker()')}
  `;
}

function saveTracker() {
  const target = parseInt(document.getElementById('tk-target').value) || state.campaign.target;
  const reward = document.getElementById('tk-reward').value.trim() || state.campaign.reward;
  const deadline = document.getElementById('tk-deadline').value.trim() || state.campaign.deadline;
  state.campaign = { ...state.campaign, target, reward, deadline };
  render();
}

// ============ INIT ============
window.addEventListener('DOMContentLoaded', () => {
  render();
});
