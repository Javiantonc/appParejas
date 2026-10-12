/* ==========================================================
   views/plans.js · planes en pareja con fotos
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon } = ui;
  const { dt, PLAN_STATUS } = store;

  let filter = 'all';

  function card(p) {
    const st = PLAN_STATUS[p.status] || PLAN_STATUS.planned;
    const typeInfo = (store.PLAN_TYPES && store.PLAN_TYPES[p.type]) || store.PLAN_TYPES.date;
    const photo = p.photos && p.photos[0];
    return `<article class="plan" data-id="${p.id}">
      <div class="cover ${photo ? '' : ui.gradient(p.id)}" ${photo ? `style="background-image:url('${photo}')"` : ''}>
        ${photo ? '' : typeInfo.emoji}
        <span class="badge tag" style="--c:${typeInfo.color};background:var(--surface)">${typeInfo.emoji} ${typeInfo.label}</span>
        ${p.photos && p.photos.length ? `<span class="cnt">${icon('image', 13)} ${p.photos.length}</span>` : ''}
      </div>
      <div class="pb">
        <h3>${esc(p.title)}</h3>
        <div class="pm">
          <span>${icon('calendar', 13)} ${p.date ? esc(dt.rel(p.date)) + (p.time ? ' · ' + p.time : '') : 'Sin fecha'}</span>
          ${p.place ? `<span>${icon('pin', 13)} ${esc(p.place)}</span>` : ''}
          ${p.rating ? `<span class="hearts">${'❤'.repeat(p.rating)}</span>` : ''}
        </div>
      </div>
    </article>`;
  }

  function section(title, list) {
    if (!list.length) return '';
    return `<section class="group"><div class="group-t">${title} <em>${list.length}</em></div><div class="plan-grid">${list.map(card).join('')}</div></section>`;
  }

  function render(el) {
    const all = store.state.plans, today = dt.today();
    const cmp = (a, b) => ((a.date || '9') + (a.time || '')).localeCompare((b.date || '9') + (b.time || ''));
    const planned = all.filter(p => p.status === 'planned').sort(cmp);
    const ideas = all.filter(p => p.status === 'idea').sort(cmp);
    const done = all.filter(p => p.status === 'done').sort((a, b) => cmp(b, a));
    const show = k => filter === 'all' || filter === k;

    const html = (show('planned') ? section('Próximos planes y eventos', planned) : '')
      + (show('idea') ? section('Ideas', ideas) : '')
      + (show('done') ? section('Recuerdos y momentos pasados', done) : '');

    el.innerHTML = `<div class="page">
      <div class="page-head">
        <div><h1>Planes &amp; Celebraciones</h1><p>Citas, cumpleaños, bodas, comuniones, viajes y momentos para recordar.</p></div>
        <span class="grow"></span>
        <button class="btn primary" data-new>${icon('plus', 16)} Nuevo plan o evento</button>
      </div>
      <div class="toolbar chips" style="overflow-x:auto;padding-bottom:4px">
        <button class="chip ${filter === 'all' ? 'on' : ''}" data-f="all">Todos · ${all.length}</button>
        ${Object.entries(PLAN_STATUS).map(([k, s]) => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${s.emoji} ${s.label}s</button>`).join('')}
      </div>
      ${html || `<div class="empty card"><div class="big">🎂 🎉 👰</div><b>Todavía no hay planes o celebraciones</b><p>Añadid un cumpleaños, una boda, una cita romántica o vuestro próximo viaje.</p></div>`}
    </div>`;

    const newBtn = el.querySelector('[data-new]');
    if (newBtn) {
      newBtn.onclick = (e) => {
        e.preventDefault();
        App.forms.plan(null);
      };
    }

    el.querySelectorAll('[data-f]').forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        filter = b.dataset.f;
        App.refresh();
      };
    });

    el.addEventListener('click', (e) => {
      const card = e.target.closest('.plan');
      if (card && card.dataset.id) {
        e.preventDefault();
        App.forms.planDetail(card.dataset.id);
      }
    });
  }

  App.views.planes = { render };
})();
