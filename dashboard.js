/* ==========================================================
   views/dashboard.js · pantalla de inicio
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon, avatar } = ui;
  const { dt, CATS, MEALS, PLAN_STATUS } = store;

  const ring = (p, color) => {
    const r = 26,
      c = 2 * Math.PI * r;
    return `<div class="ring"><svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="7"/>
      <circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/>
    </svg><b>${Math.round(p * 100)}%</b></div>`;
  };

  function render(el) {
    const S = store.state,
      today = dt.today();
    const h = new Date().getHours();
    const greet =
      h < 6
        ? "Buenas noches"
        : h < 13
          ? "Buenos días"
          : h < 21
            ? "Buenas tardes"
            : "Buenas noches";
    const [A, B] = S.settings.partners;

    const open = S.tasks.filter((t) => !t.done);
    const todayTasks = open.filter((t) => t.due === today);
    const overdue = open.filter((t) => t.due && t.due < today);
    const events = store.eventsOn(today);
    const todayPlans = S.plans.filter(
      (p) => p.date === today && p.status !== "idea",
    );

    const ws = dt.startOfWeek(today),
      we = dt.addDays(ws, 6);
    const week = S.tasks.filter((t) => t.due && t.due >= ws && t.due <= we);
    const weekDone = week.filter((t) => t.done).length;
    const pct = week.length ? weekDone / week.length : 0;

    const upcoming = S.plans
      .filter((p) => p.status === "planned" && p.date && p.date >= today)
      .sort((a, b) =>
        (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
      );
    const next = upcoming[0];

    // Reparto de tareas de la semana
    let na = 0,
      nb = 0;
    week.forEach((t) => {
      if (t.assignee === "a") na++;
      else if (t.assignee === "b") nb++;
      else {
        na += 0.5;
        nb += 0.5;
      }
    });
    const tot = na + nb || 1;

    const summary = [
      todayTasks.length
        ? `${todayTasks.length} tarea${todayTasks.length > 1 ? "s" : ""} para hoy`
        : "Hoy no tenéis tareas pendientes 🎉",
      todayPlans.length
        ? `${todayPlans.length} plan${todayPlans.length > 1 ? "es" : ""}`
        : "",
    ]
      .filter(Boolean)
      .join(" y ");

    const todayMeals = S.meals
      .filter((m) => m.date === today)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    const userName = S.user && S.user.name ? S.user.name : (A ? A.name : 'ti');

    el.innerHTML = `<div class="page">
      <section class="hero">
        <h1>¡Hola, ${esc(userName)}! 👋</h1>
        <p>${esc(dt.fmt(today, { weekday: "long", day: "numeric", month: "long" }))} · ${summary}</p>
        <div class="hero-actions">
          <button class="btn" data-a="task">${icon("plus", 16)} Tarea</button>
          <button class="btn" data-a="plan">${icon("plus", 16)} Plan</button>
          <button class="btn" data-a="meal">${icon("plus", 16)} Comida</button>
        </div>
      </section>

      <section class="stats">
        <div class="card stat"><div class="ico" style="--c:#34c759">✅</div><div><div class="num">${todayTasks.length}</div><div class="lbl">Tareas para hoy</div></div></div>
        <div class="card stat"><div class="ico" style="--c:#ff3b30">⏰</div><div><div class="num">${overdue.length}</div><div class="lbl">Vencidas</div></div></div>
        <div class="card stat">${ring(pct, "#ff4d7d")}<div><div class="num" style="font-size:20px">${weekDone}/${week.length}</div><div class="lbl">Hechas esta semana</div></div></div>
        <div class="card stat"><div class="ico" style="--c:#ff9500">💞</div><div style="min-width:0"><div class="num" style="font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${next ? esc(next.title) : "Nada aún"}</div><div class="lbl">${next ? esc(dt.rel(next.date)) : "Próximo plan"}</div></div></div>
      </section>

      <section class="grid2">
        <div class="card">
          <h2>Agenda de hoy <a class="link" href="#/calendario">Ver calendario</a></h2>
          <div class="agenda">${
            events.length
              ? events
                  .map(
                    (e) => `
            <div class="ag" style="--c:${e.color}" data-kind="${e.kind}" data-id="${e.id}">
              <div class="tm">${e.allDay ? "Todo el día" : dt.fromMin(e.start)}</div>
              <div style="flex:1;min-width:0"><div class="tt" ${e.done ? 'style="text-decoration:line-through;opacity:.6"' : ""}>${e.emoji} ${esc(e.title)}</div><div class="ss">${esc(e.sub || "")}</div></div>
            </div>`,
                  )
                  .join("")
              : `<div class="empty"><div class="big">☀️</div>Día libre. ¡Aprovechadlo!</div>`
          }</div>
        </div>
        <div class="card">
          <h2>Próximos planes <a class="link" href="#/planes">Ver todos</a></h2>
          ${
            upcoming.length
              ? upcoming
                  .slice(0, 4)
                  .map(
                    (p) => `
            <div class="mini-plan" data-plan="${p.id}">
              <div class="th ${p.photos[0] ? "" : ui.gradient(p.id)}" ${p.photos[0] ? `style="background-image:url('${p.photos[0]}')"` : ""}>${p.photos[0] ? "" : "💞"}</div>
              <div><b>${esc(p.title)}</b><span class="muted" style="font-size:13px">${esc(dt.rel(p.date))}${p.time ? " · " + p.time : ""}</span></div>
            </div>`,
                  )
                  .join("")
              : `<div class="empty"><div class="big">🗓️</div>Aún no hay planes. ¿Una cena?</div>`
          }
        </div>
      </section>

      <section class="grid3">
        <div class="card">
          <h2>Menú de hoy <a class="link" href="#/comidas">Semana</a></h2>
          ${
            todayMeals.length
              ? todayMeals
                  .map(
                    (m) => `
            <div class="meal-line" data-meal="${m.id}" style="cursor:pointer"><div class="em">${MEALS[m.type].emoji}</div>
              <div style="flex:1"><b>${esc(m.title)}</b><small>${MEALS[m.type].label} · ${m.time || MEALS[m.type].time}</small></div>${avatar(m.cook, 24)}</div>`,
                  )
                  .join("")
              : `<div class="empty"><div class="big">🍽️</div>Sin menú para hoy</div>`
          }
        </div>
        <div class="card">
          <h2>Reparto de la semana</h2>
          <p class="muted" style="font-size:13px">Tareas con fecha de esta semana</p>
          <div class="bal"><i style="width:${(na / tot) * 100}%;background:${A.color}"></i><i style="width:${(nb / tot) * 100}%;background:${B.color}"></i></div>
          <div class="bal-l"><span>${esc(A.emoji)} ${esc(A.name)} · ${Math.round((na / tot) * 100)}%</span><span>${Math.round((nb / tot) * 100)}% · ${esc(B.name)} ${esc(B.emoji)}</span></div>
        </div>
        <div class="card">
          <h2>Por categoría</h2>
          ${Object.entries(CATS)
            .map(([k, c]) => {
              const n = open.filter((t) => t.category === k).length;
              return `<div class="meal-line"><div class="em">${c.emoji}</div><div style="flex:1"><b>${c.label}</b></div><span class="badge" style="--c:${c.color}">${n} pendiente${n === 1 ? "" : "s"}</span></div>`;
            })
            .join("")}
        </div>
      </section>
    </div>`;

    el.querySelectorAll("[data-a]").forEach(
      (b) => (b.onclick = () => App.forms[b.dataset.a](null)),
    );
    el.querySelectorAll(".ag").forEach(
      (a) =>
        (a.onclick = () => App.forms.openEvent(a.dataset.kind, a.dataset.id)),
    );
    el.querySelectorAll("[data-plan]").forEach(
      (a) => (a.onclick = () => App.forms.planDetail(a.dataset.plan)),
    );
    el.querySelectorAll("[data-meal]").forEach(
      (a) => (a.onclick = () => App.forms.openEvent("meal", a.dataset.meal)),
    );
  }

  App.views.inicio = { render };
})();
