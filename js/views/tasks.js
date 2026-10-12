/* ==========================================================
   views/tasks.js · tareas del hogar, trabajo y personales
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon, avatar } = ui;
  const { dt, CATS, PRIO } = store;

  const f = { cat: 'all', who: 'all', status: 'open', q: '' };

  function match(t) {
    if (f.status === 'open' ? t.done : !t.done) return false;
    if (f.cat !== 'all' && t.category !== f.cat) return false;
    if (f.who !== 'all' && t.assignee !== f.who && t.assignee !== 'both') return false;
    if (f.q && !(t.title + ' ' + t.notes).toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  }

  const byDue = (a, b) => ((a.due || '9') + (a.time || '99')).localeCompare((b.due || '9') + (b.time || '99'));

  function item(t) {
    const c = CATS[t.category], today = dt.today();
    const late = !t.done && t.due && t.due < today;
    return `<div class="task ${t.done ? 'done' : ''}" data-id="${t.id}">
      <button class="check" style="--c:${c.color}" data-toggle aria-label="Completar">${t.done ? icon('tick', 14) : ''}</button>
      <div class="t-main">
        <div class="t-title">${esc(t.title)}</div>
        <div class="t-meta">
          <span class="badge" style="--c:${c.color}">${c.emoji} ${c.label}</span>
          ${t.due ? `<span class="badge" style="--c:${late ? '#ff3b30' : '#6e6e73'}">${icon('calendar', 12)} ${esc(dt.rel(t.due))}${t.time ? ' · ' + t.time : ''}</span>` : ''}
          ${t.priority === 'high' ? `<span class="badge" style="--c:#ff3b30">🔥 Alta</span>` : ''}
          ${t.repeat && t.repeat !== 'none' ? `<span class="badge">${icon('repeat', 12)} ${store.REPEAT[t.repeat]}</span>` : ''}
        </div>
      </div>
      ${avatar(t.assignee, 30)}
    </div>`;
  }

  function group(title, list, cls = '') {
    if (!list.length) return '';
    return `<section class="group"><div class="group-t ${cls}">${title} <em>${list.length}</em></div>${list.map(item).join('')}</section>`;
  }

  function render(el) {
    const S = store.state, today = dt.today();
    const [A, B] = S.settings.partners;
    const list = S.tasks.filter(match).sort(byDue);
    let html;
    if (f.status === 'done') {
      html = group('Completadas', list.slice().reverse());
    } else {
      html = group('Vencidas', list.filter(t => t.due && t.due < today), 'red')
        + group('Hoy', list.filter(t => t.due === today))
        + group('Próximas', list.filter(t => t.due && t.due > today))
        + group('Sin fecha', list.filter(t => !t.due));
    }
    if (!html) html = `<div class="empty card"><div class="big">${f.status === 'done' ? '🌱' : '🎉'}</div><b>${f.status === 'done' ? 'Aún no hay tareas completadas' : '¡Todo al día!'}</b><p>No hay tareas con estos filtros.</p></div>`;

    const chip = (key, val, label) => `<button class="chip ${f[key] === val ? 'on' : ''}" data-f="${key}" data-v="${val}">${label}</button>`;

    el.innerHTML = `<div class="page">
      <div class="page-head">
        <div><h1>Tareas</h1><p>Hogar, trabajo y todo lo que hay que hacer, repartido entre los dos.</p></div>
        <span class="grow"></span>
        <button class="btn primary" data-new>${icon('plus', 16)} Nueva tarea</button>
      </div>
      <div class="toolbar">
        <div class="seg"><button class="${f.status === 'open' ? 'on' : ''}" data-f="status" data-v="open">Pendientes</button><button class="${f.status === 'done' ? 'on' : ''}" data-f="status" data-v="done">Hechas</button></div>
        <div class="search"><input type="search" placeholder="Buscar tareas…" value="${esc(f.q)}" data-q></div>
      </div>
      <div class="toolbar chips">
        ${chip('cat', 'all', 'Todas')}${Object.entries(CATS).map(([k, c]) => chip('cat', k, `${c.emoji} ${c.label}`)).join('')}
        <span style="width:12px"></span>
        ${chip('who', 'all', 'Ambos')}${chip('who', 'a', `${esc(A.emoji)} ${esc(A.name)}`)}${chip('who', 'b', `${esc(B.emoji)} ${esc(B.name)}`)}
      </div>
      ${html}
    </div>`;

    const newBtn = el.querySelector('[data-new]');
    if (newBtn) {
      newBtn.onclick = (e) => {
        e.preventDefault();
        App.forms.task(null);
      };
    }

    el.querySelectorAll('[data-f]').forEach(b => {
      b.onclick = (e) => {
        e.preventDefault();
        f[b.dataset.f] = b.dataset.v;
        App.refresh();
      };
    });

    const q = el.querySelector('[data-q]');
    if (q) {
      q.oninput = () => {
        f.q = q.value;
        const pos = q.selectionStart;
        App.refresh();
        const nq = document.querySelector('[data-q]');
        if (nq) {
          nq.focus();
          nq.setSelectionRange(pos, pos);
        }
      };
    }

    el.querySelectorAll('.task').forEach(row => {
      row.onclick = e => {
        e.preventDefault();
        if (e.target.closest('[data-toggle]')) {
          e.stopPropagation();
          const m = store.toggleTask(row.dataset.id);
          App.refresh();
          if (m) ui.toast(m);
          return;
        }
        App.forms.task(store.get('tasks', row.dataset.id));
      };
    });
  }

  App.views.tareas = { render };
})();
