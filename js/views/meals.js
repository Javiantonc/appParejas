/* ==========================================================
   views/meals.js · planificador semanal de comidas
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon, avatar } = ui;
  const { dt, MEALS } = store;

  let weekStart = dt.startOfWeek(dt.today());

  function render(el) {
    const days = Array.from({ length: 7 }, (_, i) => dt.addDays(weekStart, i));
    const today = dt.today();
    const label = `${dt.fmt(days[0], { day: 'numeric', month: 'short' })} – ${dt.fmt(days[6], { day: 'numeric', month: 'short' })}`.replace(/\./g, '');
    const meals = store.state.meals;

    el.innerHTML = `<div class="page">
      <div class="page-head">
        <div><h1>Comidas</h1><p>Planificad el menú de la semana y quién cocina cada día.</p></div>
        <span class="grow"></span>
        <div class="week-nav">
          <div class="nav-btns"><button data-nav="-1" aria-label="Semana anterior">${icon('chevL', 18)}</button><button data-today>Hoy</button><button data-nav="1" aria-label="Semana siguiente">${icon('chevR', 18)}</button></div>
        </div>
        <button class="btn primary" data-new>${icon('plus', 16)} Añadir comida</button>
      </div>
      <p class="muted" style="margin:-10px 0 16px;font-weight:600">${esc(label)}</p>
      <div class="meal-grid">
        ${days.map(d => {
          const D = dt.from(d);
          return `<div class="day-card ${d === today ? 'today' : ''}">
            <header><b>${esc(new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(D))}</b><span>${D.getDate()} ${esc(new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(D).replace('.', ''))}</span></header>
            ${Object.entries(MEALS).map(([type, mt]) => {
              const list = meals.filter(m => m.date === d && m.type === type);
              return `<div class="slot" data-slot="${d}|${type}">
                <div class="slot-h">
                  <span>${mt.emoji} ${mt.label}</span>
                  <button type="button" class="icon-btn" data-add="${d}|${type}" aria-label="Añadir ${mt.label}">${icon('plus', 14)}</button>
                </div>
                ${list.length ? list.map(m => `<div class="meal" data-id="${m.id}">
                    <div class="th" ${m.photo ? `style="background-image:url('${m.photo}')"` : ''}>${m.photo ? '' : mt.emoji}</div>
                    <div style="flex:1;min-width:0"><b>${esc(m.title)}</b><small>${m.time || mt.time}</small></div>${avatar(m.cook, 22)}</div>`).join('')
                  : `<div class="slot-empty" data-add="${d}|${type}">+ Añadir ${esc(mt.label).toLowerCase()}</div>`}
              </div>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>
    </div>`;

    el.querySelectorAll('[data-nav]').forEach(b => b.onclick = (e) => {
      e.preventDefault();
      weekStart = dt.addDays(weekStart, 7 * +b.dataset.nav);
      App.refresh();
    });

    const todayBtn = el.querySelector('[data-today]');
    if (todayBtn) {
      todayBtn.onclick = (e) => {
        e.preventDefault();
        weekStart = dt.startOfWeek(today);
        App.refresh();
      };
    }

    const newBtn = el.querySelector('[data-new]');
    if (newBtn) {
      newBtn.onclick = (e) => {
        e.preventDefault();
        App.forms.meal(null, { date: days.includes(today) ? today : days[0] });
      };
    }

    el.querySelectorAll('[data-add]').forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const [date, type] = b.dataset.add.split('|');
        App.forms.meal(null, { date, type, time: (MEALS[type] && MEALS[type].time) || '14:00' });
      };
    });

    el.querySelectorAll('.slot').forEach(s => {
      s.onclick = (e) => {
        if (e.target.closest('.meal') || e.target.closest('[data-add]')) return;
        e.preventDefault();
        const [date, type] = s.dataset.slot.split('|');
        App.forms.meal(null, { date, type, time: (MEALS[type] && MEALS[type].time) || '14:00' });
      };
    });

    el.querySelectorAll('.meal').forEach(m => {
      m.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        App.forms.openEvent('meal', m.dataset.id);
      };
    });
  }

  App.views.comidas = { render };
})();
