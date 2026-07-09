/**
 * Component Library - Shadcn-inspired UI Components
 * Vanilla JS, no framework dependencies
 */

const Components = {
  // Back Button
  backButton(onClick) {
    return `<button class="btn btn-icon" onclick="${onClick}" title="Back">\n      ←\n    </button>`;
  },

  // Header
  header(title, backTo = null) {
    return `
      <div class="header">
        <div class="header-left">
          ${backTo ? this.backButton(`setView('${backTo}')`) : '<div style="width:40px"></div>'}
        </div>
        <h1 class="header-title">${title}</h1>
        <div class="header-right" style="width:40px"></div>
      </div>
    `;
  },

  // Button
  button(text, onClick, variant = 'primary', disabled = false) {
    const btnClass = `btn btn-${variant} ${disabled ? 'disabled' : ''}`;
    return `<button class="${btnClass}" onclick="${onClick}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  },

  // Primary Button (Full Width)
  buttonPrimary(text, onClick, disabled = false) {
    return `<button class="btn btn-primary" style="width:100%;" onclick="${onClick}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  },

  // Ghost Button (Full Width)
  buttonGhost(text, onClick) {
    return `<button class="btn btn-ghost" style="width:100%;" onclick="${onClick}">${text}</button>`;
  },

  // Card
  card(content, gradient = false) {
    const cardClass = gradient ? 'card card-gradient' : 'card';
    return `<div class="${cardClass}">${content}</div>`;
  },

  // Input Field
  field(label, inputId, type = 'text', value = '', placeholder = '') {
    return `
      <div class="field">
        <label class="field-label" for="${inputId}">${label}</label>
        <input id="${inputId}" class="field-input" type="${type}" value="${value}" placeholder="${placeholder}">
      </div>
    `;
  },

  // Text Input
  input(id, label, value = '', placeholder = '') {
    return this.field(label, id, 'text', value, placeholder);
  },

  // Number Input
  inputNumber(id, label, value = '', placeholder = '') {
    return this.field(label, id, 'number', value, placeholder);
  },

  // Toggle Row with Switch
  // Fixed implementation: safe inline function to toggle the switch element and an optional "-wrap" element's display
  toggleRow(label, description, switchId, isOn = false) {
    return `
      <div class="toggle-row" onclick="(function(id){const el=document.getElementById(id); if(!el) return; el.classList.toggle('on'); const wrap=document.getElementById(id+'-wrap'); if(wrap) wrap.style.display = el.classList.contains('on') ? 'block' : 'none';})('${switchId}')">
        <div>
          <div style="font-weight:700;font-size:14px;">${label}</div>
          <div class="text-muted">${description}</div>
        </div>
        <div id="${switchId}" class="switch ${isOn ? 'on' : ''}" style="pointer-events:none;"></div>
      </div>
    `;
  },

  // Progress Bar
  progress(percent) {
    return `
      <div class="progress-track">
        <div class="progress-fill" style="width:${Math.min(100, percent)}%"></div>
      </div>
    `;
  },

  // Item Row (Cart Item)
  itemRow(name, price, extraBadge = false, editOnClick = null, deleteOnClick = null) {
    return `
      <div class="item-row">
        <div onclick="${editOnClick || 'void(0)'}" style="cursor:${editOnClick ? 'pointer' : 'default'};flex:1;">
          <div class="item-name">${name}</div>
          <div class="item-price">${price}</div>
        </div>
        <div class="item-actions">
          ${extraBadge ? `<span class="chip">⭐ Extra</span>` : ''}
          ${editOnClick ? `<button class="btn-delete" onclick="${editOnClick}" style="color:var(--text-secondary);">✎</button>` : ''}
          ${deleteOnClick ? `<button class="btn-delete" onclick="${deleteOnClick}">✕</button>` : ''}
        </div>
      </div>
    `;
  },

  // Chip
  chip(text, onClick, isActive = false) {
    return `<button class="chip ${isActive ? 'on' : ''}" onclick="${onClick}">${text}</button>`;
  },

  // Modal Header
  modalHeader(title, closeOnClick) {
    return `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="btn btn-icon" onclick="${closeOnClick}">✕</button>
      </div>
    `;
  },

  // Modal Sheet
  modalSheet(content) {
    return `<div class="modal-sheet">${content}</div>`;
  },

  // Ticket (Bill Card)
  ticket(billNum, stickers, items, total, isPwp = false, isBelowMin = false, minBelanja = 0) {
    const itemsHtml = items.map(item => `
      <div class="ticket-item">
        <span>${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}${item.extra ? ' <span style="color:var(--accent-gold-dark);">⭐</span>' : ''}</span>
        <span style="font-weight:600;">${item.total}</span>
      </div>
    `).join('');

    return `
      <div class="ticket">
        <div class="ticket-header">
          <div class="ticket-label">BILL ${billNum}</div>
          <div class="stamp">
            <div class="stamp-num">${stickers}</div>
            <div class="stamp-label">STICKER</div>
          </div>
        </div>
        ${itemsHtml}
        <div class="ticket-total">
          <span>Total</span>
          <span>${total}</span>
        </div>
        ${isPwp ? `<span class="pwp-tag">✓ PWP</span>` : ''}
        ${isBelowMin ? `<div class="text-muted" style="margin-top:6px;color:var(--accent-rose);">Belum capai minimum ${minBelanja} — tetap digabung ke bill terakhir.</div>` : ''}
      </div>
    `;
  },

  // Dot Navigation (Stepper)
  dots(total, current) {
    const dotsHtml = Array.from({ length: total })
      .map((_, i) => `<div class="dot ${i === current ? 'on' : ''}"></div>`)
      .join('');
    return `<div class="dots">${dotsHtml}</div>`;
  },

  // Checklist Item
  checkItem(name, price, isExtra = false, isChecked = false, onClick = null) {
    return `
      <div class="check-item ${isChecked ? 'picked' : ''}">
        <button class="check-box ${isChecked ? 'on' : ''}" onclick="${onClick || 'void(0)'}">
          ${isChecked ? '✓' : ''}
        </button>
        <div style="flex:1;">
          <div class="check-name">${name}${isExtra ? ' ⭐' : ''}</div>
        </div>
        <div class="item-price">${price}</div>
      </div>
    `;
  },

  // Empty State
  emptyState(icon, text) {
    return `
      <div class="empty-state">
        <span class="empty-icon">${icon}</span>
        <div>${text}</div>
      </div>
    `;
  },

  // Hero Number Display
  heroDisplay(number, label) {
    return `
      <div style="text-align:center;margin:20px 0;">
        <div class="hero-num">${number}</div>
        <div style="font-weight:700;color:var(--text-secondary);font-size:13px;margin-top:2px;">${label}</div>
      </div>
    `;
  },

  // Footer Navigation
  footerNav(items, activeView) {
    const itemsHtml = items.map(([view, icon, label]) => `
      <button class="nav-item ${activeView === view ? 'active' : ''}" onclick="setView('${view}')">
        <span class="nav-icon">${icon}</span>
        <span>${label}</span>
      </button>
    `).join('');
    return itemsHtml;
  },

  // Stats Row
  statRow(label, value) {
    return `
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span class="text-muted">${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  },

  // Info Box / Alert
  infoBox(icon, text, type = 'info') {
    const typeClass = type === 'warning' ? 'badge-warn' : '';
    const style = type === 'info'
      ? 'background:rgba(31,107,76,0.12);color:var(--accent-forest);padding:9px 12px;border-radius:10px;font-size:12px;margin-bottom:12px;'
      : 'background:rgba(255,69,58,0.08);color:var(--accent-rose);padding:9px 12px;border-radius:10px;font-size:12px;margin-bottom:12px;';
    return `<div class="${typeClass}" style="${style}"><span style="margin-right:8px">${icon}</span><span>${text}</span></div>`;
  }
};
