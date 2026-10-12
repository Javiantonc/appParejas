/* ==========================================================
   views/reminders.js · Cartera de Billetes, Reservas y Códigos QR
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon } = ui;
  const { dt, REMINDER_CATS } = store;

  let currentCategory = 'all';

  function reminderCard(r) {
    const cat = REMINDER_CATS[r.category] || REMINDER_CATS.general;
    return `
      <article class="ticket-card" data-id="${r.id}" style="--c:${cat.color}">
        <div class="ticket-strip">
          <span class="ticket-cat-icon">${cat.emoji}</span>
          <span class="ticket-cat-name">${cat.label}</span>
          ${r.date ? `<span class="ticket-date-pill">${esc(dt.rel(r.date))}${r.time ? ' · ' + r.time : ''}</span>` : '<span class="ticket-date-pill">Sin fecha</span>'}
        </div>

        <div class="ticket-main">
          <div class="ticket-info">
            <h3 class="ticket-title">${esc(r.title)}</h3>
            ${r.place ? `<div class="ticket-meta">${icon('pin', 14)} <span>${esc(r.place)}</span></div>` : ''}
            ${r.seat ? `<div class="ticket-meta">${icon('ticket', 14)} <span>${esc(r.seat)}</span></div>` : ''}
            ${r.locator ? `<div class="ticket-locator">Ref: <b>${esc(r.locator)}</b></div>` : ''}
          </div>

          <div class="ticket-qr-box">
            ${r.photo ? `
              <div class="ticket-qr-preview" data-zoom="${r.id}">
                <img src="${r.photo}" alt="QR / Billete">
                <span class="ticket-zoom-hint">${icon('search', 12)} Ver QR</span>
              </div>
            ` : `
              <div class="ticket-no-qr">
                ${icon('qr', 32)}
                <small>Sin QR adjunto</small>
              </div>
            `}
          </div>
        </div>

        ${r.notes ? `
          <div class="ticket-footer">
            <p>${esc(r.notes)}</p>
          </div>
        ` : ''}
      </article>
    `;
  }

  function render(el) {
    const all = store.state.reminders || [];
    const filtered = currentCategory === 'all'
      ? all
      : all.filter(r => r.category === currentCategory);

    const cmp = (a, b) => ((a.date || '9') + (a.time || '')).localeCompare((b.date || '9') + (b.time || ''));
    const sorted = [...filtered].sort(cmp);

    el.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <h1>Billetes, QR &amp; Reservas 🎟️</h1>
            <p>Guarda tus códigos QR de cine, tarjetas de embarque, reservas de hotel y entradas en un solo lugar.</p>
          </div>
          <span class="grow"></span>
          <button class="btn primary" data-new-reminder>${icon('plus', 16)} Añadir billete o QR</button>
        </div>

        <div class="toolbar chips" style="overflow-x:auto;padding-bottom:4px">
          <button class="chip ${currentCategory === 'all' ? 'on' : ''}" data-cat="all">Todos · ${all.length}</button>
          ${Object.entries(REMINDER_CATS).map(([k, c]) => {
            const count = all.filter(r => r.category === k).length;
            return `<button class="chip ${currentCategory === k ? 'on' : ''}" data-cat="${k}"><span class="dot" style="--c:${c.color}"></span>${c.emoji} ${c.label} (${count})</button>`;
          }).join('')}
        </div>

        ${sorted.length ? `
          <div class="ticket-grid">
            ${sorted.map(reminderCard).join('')}
          </div>
        ` : `
          <div class="empty card" style="text-align:center;padding:50px 20px">
            <div class="big" style="font-size:50px;margin-bottom:12px">🎟️ ✈️ 🍿</div>
            <h3 style="margin-bottom:8px">No tenéis billetes o códigos QR guardados</h3>
            <p class="muted" style="max-width:440px;margin:0 auto 20px">Sube vuestros códigos QR del cine, reservas de hotel, vuelos o billetes de tren para tenerlos siempre a mano sin tener que buscarlos en el correo.</p>
            <button class="btn primary" data-new-reminder>${icon('plus', 16)} Guardar primer billete / QR</button>
          </div>
        `}
      </div>
    `;

    // Filtros por categoría
    el.querySelectorAll('[data-cat]').forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        currentCategory = b.dataset.cat;
        render(el);
      };
    });

    // Añadir nuevo billete
    el.querySelectorAll('[data-new-reminder]').forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        App.forms.reminder(null);
      };
    });

    // Clic en la tarjeta para editar
    el.querySelectorAll('.ticket-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('[data-zoom]')) {
          e.stopPropagation();
          const r = store.get('reminders', card.dataset.id);
          if (r && r.photo) {
            ui.lightbox([r.photo], 0);
          }
          return;
        }
        e.preventDefault();
        App.forms.openEvent('reminder', card.dataset.id);
      };
    });
  }

  App.views.recordatorios = { render };
})();
