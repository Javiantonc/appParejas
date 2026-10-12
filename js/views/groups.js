/* ==========================================================
   views/groups.js · Gastos compartidos en grupo (estilo Tricount)
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon } = ui;

  let activeGroupId = null;
  let activeTab = 'expenses'; // 'expenses' | 'balances'

  const CAT_ICONS = {
    food: '🍔',
    transport: '🚗',
    lodging: '🏨',
    ticket: '🎟️',
    supermarket: '🛒',
    other: '✨'
  };

  function formatMoney(amount, currency = '€') {
    return `${(Number(amount) || 0).toFixed(2)} ${currency}`;
  }

  function renderGroupSelector(groups, currentGrp) {
    return `
      <div class="groups-nav-bar" style="display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:16px">
        ${groups.map(g => `
          <button type="button" class="group-tab-btn ${g.id === currentGrp.id ? 'active' : ''}" data-group-id="${g.id}">
            <span style="font-size:18px">${esc(g.emoji || '✈️')}</span>
            <span class="group-tab-name">${esc(g.name)}</span>
            <span class="group-tab-badge">${(g.members || []).length} pers.</span>
          </button>
        `).join('')}
        <button type="button" class="btn ghost sm" data-add-group style="flex:none;gap:4px">
          ${icon('plus', 14)} Nuevo Grupo
        </button>
      </div>
    `;
  }

  function renderGroupHeader(summary) {
    const grp = summary.group;
    return `
      <div class="card group-summary-card" style="margin-bottom:20px;background:var(--surface);border-radius:20px;padding:22px;border:1px solid var(--line)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:14px">
            <span style="font-size:38px;line-height:1;display:inline-block">${esc(grp.emoji || '✈️')}</span>
            <div>
              <h2 style="font-size:22px;font-weight:800;margin:0 0 2px 0">${esc(grp.name)}</h2>
              <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)">
                ${grp.description ? `<span>${esc(grp.description)}</span> · ` : ''}
                <span>${(grp.members || []).length} participantes</span>
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn ghost sm" data-edit-group title="Editar miembros o nombre">${icon('edit', 14)} Ajustes Grupo</button>
            <button class="btn primary sm" data-add-expense>${icon('plus', 14)} Añadir Gasto</button>
          </div>
        </div>

        <!-- Métricas del grupo -->
        <div class="group-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:12px">
          <div style="background:var(--surface-2);padding:14px;border-radius:14px">
            <small class="muted" style="display:block;font-size:11px;font-weight:700;text-transform:uppercase">Gasto Total</small>
            <b style="font-size:22px;font-weight:800;color:var(--text);display:block;margin-top:2px">${formatMoney(summary.totalSpent, grp.currency)}</b>
          </div>
          <div style="background:var(--surface-2);padding:14px;border-radius:14px">
            <small class="muted" style="display:block;font-size:11px;font-weight:700;text-transform:uppercase">Nº de Gastos</small>
            <b style="font-size:22px;font-weight:800;color:var(--text);display:block;margin-top:2px">${summary.expenseCount}</b>
          </div>
          <div style="background:var(--surface-2);padding:14px;border-radius:14px">
            <small class="muted" style="display:block;font-size:11px;font-weight:700;text-transform:uppercase">Media por persona</small>
            <b style="font-size:22px;font-weight:800;color:var(--text);display:block;margin-top:2px">${formatMoney(summary.group.members.length ? (summary.totalSpent / summary.group.members.length) : 0, grp.currency)}</b>
          </div>
          <div style="background:var(--surface-2);padding:14px;border-radius:14px">
            <small class="muted" style="display:block;font-size:11px;font-weight:700;text-transform:uppercase">Pagos para cuadrar</small>
            <b style="font-size:22px;font-weight:800;color:var(--accent);display:block;margin-top:2px">${summary.transfers.length}</b>
          </div>
        </div>
      </div>
    `;
  }

  function renderTabs() {
    return `
      <div class="segmented-tabs" style="display:inline-flex;padding:4px;background:var(--surface-2);border-radius:14px;margin-bottom:18px">
        <button type="button" class="seg-btn ${activeTab === 'expenses' ? 'active' : ''}" data-tab="expenses" style="padding:8px 18px;border-radius:10px;font-size:14px;font-weight:700;background:${activeTab === 'expenses' ? 'var(--surface)' : 'transparent'};color:${activeTab === 'expenses' ? 'var(--text)' : 'var(--muted)'};box-shadow:${activeTab === 'expenses' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'}">
          💸 Gastos registrados
        </button>
        <button type="button" class="seg-btn ${activeTab === 'balances' ? 'active' : ''}" data-tab="balances" style="padding:8px 18px;border-radius:10px;font-size:14px;font-weight:700;background:${activeTab === 'balances' ? 'var(--surface)' : 'transparent'};color:${activeTab === 'balances' ? 'var(--text)' : 'var(--muted)'};box-shadow:${activeTab === 'balances' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'}">
          ⚖️ Balances &amp; ¿Quién debe a quién?
        </button>
      </div>
    `;
  }

  function renderExpensesList(summary) {
    const grp = summary.group;
    const exps = (store.state.expenses || [])
      .filter(e => e.groupId === grp.id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (!exps.length) {
      return `
        <div class="empty-box" style="text-align:center;padding:50px 20px;background:var(--surface);border-radius:18px;border:1px dashed var(--line)">
          <span style="font-size:44px;display:block;margin-bottom:10px">💸</span>
          <h3 style="font-size:18px;font-weight:700">Aún no hay gastos en este grupo</h3>
          <p class="muted" style="margin-top:4px;font-size:14px">Cada vez que alguien pague algo (cenas, gasolina, hotel, compras...), añádelo aquí para cuadrar las cuentas automáticamente.</p>
          <button class="btn primary" data-add-expense style="margin-top:16px">${icon('plus', 16)} Añadir el primer gasto</button>
        </div>
      `;
    }

    const memberMap = {};
    (grp.members || []).forEach(m => { memberMap[m.id] = m; });

    return `
      <div class="expenses-list" style="display:flex;flex-direction:column;gap:10px">
        ${exps.map(e => {
          const payer = memberMap[e.payerId] || { name: 'Alguien', emoji: '👤' };
          const catIcon = CAT_ICONS[e.category] || '✨';
          const splitCount = (e.splitWith && e.splitWith.length) || grp.members.length;
          const share = (Number(e.amount) / splitCount).toFixed(2);

          return `
            <div class="expense-card" data-exp-id="${e.id}" style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--surface);border-radius:16px;border:1px solid var(--line);cursor:pointer;transition:transform 0.15s, box-shadow 0.15s">
              <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">
                <span class="exp-cat-badge" style="width:42px;height:42px;border-radius:12px;background:var(--surface-2);display:grid;place-items:center;font-size:20px;flex:none">
                  ${catIcon}
                </span>
                <div style="overflow:hidden;text-overflow:ellipsis">
                  <div style="font-size:15px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.title)}</div>
                  <div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;margin-top:2px">
                    <span>Pagado por <b>${esc(payer.emoji)} ${esc(payer.name)}</b></span>
                    <span>·</span>
                    <span>${e.date || 'Sin fecha'}</span>
                    <span>·</span>
                    <span>Entre ${splitCount} personas (${share} €/u)</span>
                  </div>
                  ${e.notes ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;font-style:italic">${esc(e.notes)}</div>` : ''}
                </div>
              </div>

              <div style="text-align:right;flex:none;margin-left:14px">
                <b style="font-size:18px;font-weight:800;color:var(--text)">${formatMoney(e.amount, grp.currency)}</b>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Ver / Editar</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderBalancesView(summary) {
    const grp = summary.group;
    const members = grp.members || [];
    const balances = summary.balances || {};
    const transfers = summary.transfers || [];

    return `
      <div class="balances-container" style="display:flex;flex-direction:column;gap:24px">
        
        <!-- Estado de deudas (Liquidación estilo Tricount) -->
        <div class="card" style="background:var(--surface);padding:22px;border-radius:18px;border:1px solid var(--line)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h3 style="font-size:18px;font-weight:800;margin:0">🎯 Liquidación Óptima (¿Cómo saldar las cuentas?)</h3>
            <span class="chip" style="font-size:12px">Mínimas transferencias</span>
          </div>

          ${transfers.length === 0 ? `
            <div style="text-align:center;padding:24px 10px;color:var(--green)">
              <span style="font-size:36px;display:block;margin-bottom:8px">🎉</span>
              <b style="font-size:16px">¡Todas las cuentas están cuadradas!</b>
              <p class="muted" style="font-size:13px;margin-top:4px">Nadie le debe dinero a nadie en este momento.</p>
            </div>
          ` : `
            <p class="muted" style="font-size:13px;margin-bottom:14px">Para cuadrar todo el grupo y dejar los saldos a cero, basta con realizar las siguientes transferencias (por Bizum, transferencia o efectivo):</p>
            <div class="transfers-list" style="display:flex;flex-direction:column;gap:10px">
              ${transfers.map(t => `
                <div class="transfer-item" style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);padding:14px 18px;border-radius:14px;border:1px solid var(--line)">
                  <div style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600">
                    <span style="color:var(--red);font-weight:700">${esc(t.fromName)}</span>
                    <span style="color:var(--muted)">le debe pagar a</span>
                    <span style="color:var(--green);font-weight:700">${esc(t.toName)}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px">
                    <b style="font-size:18px;font-weight:800;color:var(--accent)">${formatMoney(t.amount, grp.currency)}</b>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Balances individuales -->
        <div class="card" style="background:var(--surface);padding:22px;border-radius:18px;border:1px solid var(--line)">
          <h3 style="font-size:18px;font-weight:800;margin:0 0 14px 0">👤 Balance Individual de Cada Participante</h3>
          <div class="members-balance-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:12px">
            ${members.map(m => {
              const bal = Math.round((balances[m.id] || 0) * 100) / 100;
              const paid = (summary.paidTotals && summary.paidTotals[m.id]) || 0;
              const share = (summary.shareTotals && summary.shareTotals[m.id]) || 0;

              let statusText = 'En paz (0.00 €)';
              let statusColor = 'var(--muted)';
              let bgBadge = 'var(--surface-2)';
              if (bal > 0.01) {
                statusText = `Se le deben ${formatMoney(bal, grp.currency)}`;
                statusColor = 'var(--green)';
                bgBadge = 'rgba(52, 199, 89, 0.12)';
              } else if (bal < -0.01) {
                statusText = `Debe ${formatMoney(-bal, grp.currency)}`;
                statusColor = 'var(--red)';
                bgBadge = 'rgba(255, 59, 48, 0.12)';
              }

              return `
                <div style="padding:14px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="display:flex;align-items:center;gap:8px">
                      <span style="font-size:22px">${esc(m.emoji || '👤')}</span>
                      <b style="font-size:15px">${esc(m.name)}</b>
                    </div>
                    <span style="font-size:12px;font-weight:800;color:${statusColor};background:${bgBadge};padding:4px 8px;border-radius:8px">
                      ${statusText}
                    </span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);border-top:1px dashed var(--line);padding-top:6px;margin-top:2px">
                    <span>Ha pagado: <b>${formatMoney(paid, grp.currency)}</b></span>
                    <span>Su parte: <b>${formatMoney(share, grp.currency)}</b></span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }

  function render(el) {
    const groups = store.state.groups || [];

    // Si aún no hay grupos, inicializar con uno de ejemplo o permitir crear
    if (!groups.length) {
      const currentUserName = (store.state.user && store.state.user.name) || (store.state.settings.partners[0].name) || 'Yo';
      const partnerName = (store.state.settings.partners[1] && store.state.settings.partners[1].name) || 'Pareja';
      const initialGroup = store.add('groups', {
        name: 'Viaje con amigos 🚗',
        type: 'trip',
        emoji: '✈️',
        currency: '€',
        description: 'Gastos compartidos del viaje',
        members: [
          { id: 'm1', name: currentUserName, emoji: '🦊' },
          { id: 'm2', name: partnerName, emoji: '🐼' },
          { id: 'm3', name: 'Carlos', emoji: '🦁' },
          { id: 'm4', name: 'Laura', emoji: '🦄' }
        ]
      });

      // Añadir gastos de demostración
      store.add('expenses', {
        groupId: initialGroup.id,
        title: 'Cena de bienvenida',
        amount: 84.50,
        currency: '€',
        date: store.dt.today(),
        payerId: 'm1',
        splitWith: ['m1', 'm2', 'm3', 'm4'],
        category: 'food',
        notes: 'Pizzas y bebidas'
      });

      store.add('expenses', {
        groupId: initialGroup.id,
        title: 'Gasolina ida y vuelta',
        amount: 60.00,
        currency: '€',
        date: store.dt.today(),
        payerId: 'm3',
        splitWith: ['m1', 'm2', 'm3', 'm4'],
        category: 'transport',
        notes: 'Depósito lleno'
      });
      activeGroupId = initialGroup.id;
    }

    const currentGroups = store.state.groups;
    if (!activeGroupId || !currentGroups.some(g => g.id === activeGroupId)) {
      activeGroupId = currentGroups[0].id;
    }

    const summary = store.getGroupSummary(activeGroupId);
    if (!summary) return;

    el.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <h1>Gastos en Grupo &amp; Viajes 💰</h1>
            <p>Gestiona viajes familiares o con amigos estilo Tricount: cada uno anota lo que paga y la app calcula quién le debe a quién.</p>
          </div>
          <span class="grow"></span>
          <button class="btn primary" data-add-expense>${icon('plus', 16)} Nuevo Gasto</button>
        </div>

        ${renderGroupSelector(currentGroups, summary.group)}
        ${renderGroupHeader(summary)}
        ${renderTabs()}
        ${activeTab === 'expenses' ? renderExpensesList(summary) : renderBalancesView(summary)}
      </div>
    `;

    // Eventos
    el.querySelectorAll('[data-group-id]').forEach(btn => {
      btn.onclick = () => {
        activeGroupId = btn.dataset.groupId;
        render(el);
      };
    });

    el.querySelectorAll('[data-add-group]').forEach(btn => {
      btn.onclick = () => {
        App.forms.group();
      };
    });

    el.querySelectorAll('[data-edit-group]').forEach(btn => {
      btn.onclick = () => {
        App.forms.group(summary.group);
      };
    });

    el.querySelectorAll('[data-add-expense]').forEach(btn => {
      btn.onclick = () => {
        App.forms.expense(null, activeGroupId);
      };
    });

    el.querySelectorAll('[data-tab]').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        render(el);
      };
    });

    el.querySelectorAll('[data-exp-id]').forEach(card => {
      card.onclick = () => {
        const expId = card.dataset.expId;
        const exp = store.get('expenses', expId);
        if (exp) App.forms.expense(exp, activeGroupId);
      };
    });
  }

  App.views.grupos = {
    render,
    selectGroup(id) {
      activeGroupId = id;
      App.refresh && App.refresh();
    }
  };
})();
