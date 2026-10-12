/* ==========================================================
   views/calendar.js · calendario estilo Apple (día / semana / mes)
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, icon } = ui;
  const { dt } = store;

  const HOUR = 56; // px por hora (debe coincidir con --hour del CSS)
  let mode = null; // 'day' | 'week' | 'month'
  let cursor = dt.today();
  const filters = { task: true, plan: true, meal: true, reminder: true };
  let scrollTop = null;
  let timer = null;

  const FILTER_META = [
    { k: "task", label: "Tareas", color: "#34c759" },
    { k: "plan", label: "Planes", color: "#ff4d7d" },
    { k: "meal", label: "Comidas", color: "#ff9500" },
    { k: "reminder", label: "Billetes/QR", color: "#bf5af2" },
  ];

  const WD = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

  function visibleDays() {
    if (mode === "day") return [cursor];
    const s = dt.startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => dt.addDays(s, i));
  }

  function title() {
    const d = dt.from(cursor);
    const month = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(d);
    if (mode === "day")
      return `<b>${d.getDate()} ${month}</b> ${d.getFullYear()}`;
    return `<b>${month}</b> ${d.getFullYear()}`;
  }

  /* ---------- Colocación de eventos solapados ---------- */
  function layout(list) {
    const items = list
      .map((e) => ({ e, s: e.start, en: Math.max(e.end, e.start + 30) }))
      .sort((a, b) => a.s - b.s || b.en - a.en);
    const groups = [];
    let cur = null;
    items.forEach((it) => {
      if (!cur || it.s >= cur.end) {
        cur = { end: it.en, items: [] };
        groups.push(cur);
      }
      cur.items.push(it);
      cur.end = Math.max(cur.end, it.en);
    });
    groups.forEach((g) => {
      const cols = [];
      g.items.forEach((it) => {
        let c = cols.findIndex((end) => end <= it.s);
        if (c < 0) {
          c = cols.length;
          cols.push(it.en);
        } else cols[c] = it.en;
        it.c = c;
      });
      g.items.forEach((it) => {
        it.n = cols.length;
      });
    });
    return items
      .map((it) => {
        const top = (it.s / 60) * HOUR,
          h = Math.max(((it.en - it.s) / 60) * HOUR - 2, 20);
        const w = 100 / it.n,
          e = it.e;
        return `<div class="ev ${e.done ? "done" : ""}" style="--c:${e.color};top:${top}px;height:${h}px;left:calc(${it.c * w}% + 1px);width:calc(${w}% - 3px)" data-kind="${e.kind}" data-id="${e.id}">
        <b>${e.emoji} ${esc(e.title)}</b>${h > 36 ? `<small>${dt.fromMin(e.start)} – ${dt.fromMin(e.end)}</small>` : ""}</div>`;
      })
      .join("");
  }

  const pill = (e) =>
    `<div class="pill ${e.done ? "done" : ""}" style="--c:${e.color}" data-kind="${e.kind}" data-id="${e.id}" title="${esc(e.title)}">${e.allDay ? "" : dt.fromMin(e.start) + " "}${esc(e.title)}</div>`;

  /* ---------- Vista día / semana ---------- */
  function gridHTML(days) {
    const n = days.length,
      today = dt.today();
    const evs = days.map((d) =>
      store.eventsOn(d).filter((e) => filters[e.kind]),
    );
    const now = new Date(),
      nowMin = now.getHours() * 60 + now.getMinutes();
    const hasToday = days.includes(today);

    const head = days
      .map((d) => {
        const D = dt.from(d);
        const wd =
          mode === "day"
            ? new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(D)
            : WD[(D.getDay() + 6) % 7];
        return `<div class="ch ${d === today ? "today" : ""}" data-day="${d}"><span class="wd">${wd}</span><span class="dn">${D.getDate()}</span></div>`;
      })
      .join("");

    const allday = days
      .map(
        (d, i) =>
          `<div class="ad" data-date="${d}">${evs[i]
            .filter((e) => e.allDay)
            .map(pill)
            .join("")}</div>`,
      )
      .join("");

    let labels = "";
    for (let h = 1; h < 24; h++)
      labels += `<span style="top:${h * HOUR}px">${dt.pad(h)}:00</span>`;
    if (hasToday)
      labels += `<span class="nowlbl" style="top:${(nowMin / 60) * HOUR}px">${dt.fromMin(nowMin)}</span>`;

    const cols = days
      .map(
        (
          d,
          i,
        ) => `<div class="col ${d === today ? "is-today" : ""}" data-date="${d}">
      ${layout(evs[i].filter((e) => !e.allDay))}
      ${d === today ? `<div class="now" style="top:${(nowMin / 60) * HOUR}px"></div>` : ""}</div>`,
      )
      .join("");

    return `<div class="tg-head" style="--n:${n}"><div></div>${head}</div>
      <div class="tg-allday" style="--n:${n}"><div class="gl">todo el día</div>${allday}</div>
      <div class="tg-scroll"><div class="tg-body" style="--n:${n}"><div class="gutter">${labels}</div>${cols}</div></div>`;
  }

  /* ---------- Vista mes ---------- */
  function monthHTML() {
    const first = dt.startOfMonth(cursor);
    const start = dt.startOfWeek(first);
    const month = dt.from(first).getMonth();
    const lastDay = dt.from(dt.addDays(dt.addMonths(first, 1), -1));
    const spanDays = Math.round((lastDay - dt.from(start)) / 864e5) + 1;
    const weeks = Math.ceil(spanDays / 7);
    const today = dt.today();
    let cells = "";
    for (let i = 0; i < weeks * 7; i++) {
      const d = dt.addDays(start, i),
        D = dt.from(d);
      const evs = store.eventsOn(d).filter((e) => filters[e.kind]);
      cells += `<div class="mday ${D.getMonth() !== month ? "dim" : ""} ${d === today ? "today" : ""}" data-date="${d}">
        <span class="num">${D.getDate()}</span>${evs.slice(0, 3).map(pill).join("")}${evs.length > 3 ? `<div class="more">+${evs.length - 3} más</div>` : ""}</div>`;
    }
    return `<div class="m-head">${WD.map((w) => `<div>${w}</div>`).join("")}</div><div class="m-grid">${cells}</div>`;
  }

  /* ---------- Render ---------- */
  function render(el) {
    clearInterval(timer);
    if (!mode) mode = window.innerWidth < 700 ? "day" : "week";

    el.innerHTML = `<div class="page">
      <div class="cal-toolbar">
        <div class="cal-title"><h1>${title()}</h1></div>
        <div class="cal-ctrl">
          <div class="seg" data-mode>
            ${[
              ["day", "Día"],
              ["week", "Semana"],
              ["month", "Mes"],
            ]
              .map(
                ([k, l]) =>
                  `<button class="${mode === k ? "on" : ""}" data-m="${k}">${l}</button>`,
              )
              .join("")}
          </div>
          <div class="nav-btns"><button data-nav="-1" aria-label="Anterior">${icon("chevL", 18)}</button><button data-today>Hoy</button><button data-nav="1" aria-label="Siguiente">${icon("chevR", 18)}</button></div>
          <button class="btn primary" data-add>${icon("plus", 16)} Añadir</button>
        </div>
      </div>
      <div class="cal-filters chips">${FILTER_META.map((f) => `<button class="chip ${filters[f.k] ? "on" : ""}" data-f="${f.k}"><span class="dot" style="--c:${f.color}"></span>${f.label}</button>`).join("")}</div>
      <div class="cal-card" id="cal-body">${mode === "month" ? monthHTML() : gridHTML(visibleDays())}</div>
    </div>`;

    const body = el.querySelector("#cal-body");
    const scroller = body.querySelector(".tg-scroll");
    if (scroller) {
      if (scrollTop == null) {
        const nowH = new Date().getHours();
        scrollTop = Math.max(
          0,
          (visibleDays().includes(dt.today()) ? nowH - 2 : 7) * HOUR,
        );
      }
      scroller.scrollTop = scrollTop;
      scroller.addEventListener("scroll", () => {
        scrollTop = scroller.scrollTop;
      });
    }

    /* Controles */
    el.querySelectorAll("[data-m]").forEach(
      (b) =>
        (b.onclick = () => {
          mode = b.dataset.m;
          App.refresh();
        }),
    );
    el.querySelectorAll("[data-nav]").forEach(
      (b) =>
        (b.onclick = () => {
          const k = +b.dataset.nav;
          cursor =
            mode === "month"
              ? dt.addMonths(cursor, k)
              : dt.addDays(cursor, k * (mode === "week" ? 7 : 1));
          App.refresh();
        }),
    );
    el.querySelector("[data-today]").onclick = () => {
      cursor = dt.today();
      scrollTop = null;
      App.refresh();
    };
    el.querySelectorAll("[data-f]").forEach(
      (b) =>
        (b.onclick = () => {
          filters[b.dataset.f] = !filters[b.dataset.f];
          App.refresh();
        }),
    );

    /* Interacción con el calendario */
    const addBtn = el.querySelector("[data-add]");
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        App.forms.quickAdd(cursor);
      };
    }

    el.addEventListener("click", (e) => {
      const ev = e.target.closest("[data-kind]");
      if (ev) {
        e.preventDefault();
        e.stopPropagation();
        return App.forms.openEvent(ev.dataset.kind, ev.dataset.id);
      }
      const head = e.target.closest(".ch");
      if (head) {
        e.preventDefault();
        cursor = head.dataset.day;
        App.forms.quickAdd(cursor);
        return;
      }
      const md = e.target.closest(".mday");
      if (md) {
        e.preventDefault();
        cursor = md.dataset.date;
        App.forms.quickAdd(cursor);
        return;
      }
      const ad = e.target.closest(".ad");
      if (ad && ad.dataset.date) {
        e.preventDefault();
        cursor = ad.dataset.date;
        App.forms.quickAdd(cursor);
        return;
      }
      const col = e.target.closest(".col");
      if (col) {
        e.preventDefault();
        const y = e.clientY - col.getBoundingClientRect().top;
        const min = Math.min(23 * 60, Math.floor((y / HOUR) * 2) * 30);
        App.forms.quickAdd(col.dataset.date, dt.fromMin(min));
      }
    });

    // Actualiza la línea roja de "ahora" cada minuto
    timer = setInterval(() => {
      if (
        document.querySelector(".cal-card") &&
        !document.querySelector(".overlay")
      )
        App.refresh();
      else if (!document.querySelector(".cal-card")) clearInterval(timer);
    }, 60000);
  }

  App.views.calendario = { render };
})();
