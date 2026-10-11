/* ==========================================================
   ui.js · iconos, modales, toasts, lightbox y componentes comunes
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    check:
      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    tick: '<polyline points="20 6 9 17 4 12"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    heart:
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    food: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
    sliders:
      '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    trash:
      '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    chevL: '<polyline points="15 18 9 12 15 6"/>',
    chevR: '<polyline points="9 18 15 12 9 6"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    clock:
      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    repeat:
      '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    search:
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  };
  const icon = (n, s = 20) =>
    `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  /* ---------- Componentes de formulario ---------- */
  const field = (label, inner) =>
    `<div class="fld"><span class="fl">${label}</span>${inner}</div>`;
  const seg = (name, opts, value) =>
    `<div class="seg">${opts
      .map(
        (o) =>
          `<label><input type="radio" name="${name}" value="${o.v}" ${String(o.v) === String(value) ? "checked" : ""}><span>${o.label}</span></label>`,
      )
      .join("")}</div>`;
  const select = (name, pairs, value) =>
    `<select name="${name}">${pairs
      .map(
        ([v, l]) =>
          `<option value="${v}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`,
      )
      .join("")}</select>`;

  function avatar(id, size = 26) {
    const P = App.store.state.settings.partners;
    const one = (p) =>
      `<span class="av" style="--c:${p.color};--s:${size}px" title="${esc(p.name)}">${esc(p.emoji)}</span>`;
    if (id === "both")
      return `<span class="av-stack">${one(P[0])}${one(P[1])}</span>`;
    return one(id === "b" ? P[1] : P[0]);
  }

  /** Texto "domingo 11 oct · 21:00–23:00" */
  function when(date, time, duration) {
    const { dt } = App.store;
    if (!date) return "Sin fecha";
    let s = dt
      .fmt(date, { weekday: "long", day: "numeric", month: "short" })
      .replace(".", "");
    if (time) {
      const end = dt.fromMin((dt.toMin(time) + (duration || 60)) % 1440);
      s += ` · ${time}–${end}`;
    }
    return s;
  }

  /* ---------- Modal ---------- */
  function modal({ title, html, size = "", onMount, onClose }) {
    const root = document.getElementById("overlay-root");
    const wrap = document.createElement("div");
    wrap.className = "overlay";
    wrap.innerHTML = `<div class="sheet ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="sheet-h"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Cerrar">${icon("x", 18)}</button></header>
      <div class="sheet-b">${html}</div></div>`;
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("open"));
    const onKey = (e) => {
      if (e.key === "Escape" && !document.querySelector(".lightbox")) close();
    };
    function close() {
      document.removeEventListener("keydown", onKey);
      wrap.classList.remove("open");
      setTimeout(() => {
        wrap.remove();
        onClose && onClose();
      }, 200);
    }
    document.addEventListener("keydown", onKey);
    wrap.addEventListener("mousedown", (e) => {
      if (e.target === wrap) close();
    });
    wrap.querySelector("[data-close]").onclick = close;
    onMount && onMount(wrap.querySelector(".sheet-b"), close);
    return { close, el: wrap };
  }

  function confirmBox(message, okLabel = "Eliminar") {
    return new Promise((resolve) => {
      let answered = false;
      modal({
        title: "Confirmar",
        size: "sm",
        html: `<p style="margin-bottom:18px">${esc(message)}</p>
          <div class="form-actions"><span class="grow"></span><button class="btn ghost" data-no>Cancelar</button><button class="btn danger" data-yes>${esc(okLabel)}</button></div>`,
        onMount(root, close) {
          root.querySelector("[data-no]").onclick = () => close();
          root.querySelector("[data-yes]").onclick = () => {
            answered = true;
            close();
            resolve(true);
          };
        },
        onClose() {
          if (!answered) resolve(false);
        },
      });
    });
  }

  function toast(msg, type = "") {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .3s";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function lightbox(list, i = 0) {
    const w = document.createElement("div");
    w.className = "lightbox";
    const draw = () => {
      w.innerHTML = `<button class="lb-x" data-x aria-label="Cerrar">${icon("x", 24)}</button>
        ${list.length > 1 ? `<button class="lb-n prev" data-p>${icon("chevL", 26)}</button><button class="lb-n next" data-n>${icon("chevR", 26)}</button>` : ""}
        <img src="${list[i]}" alt=""><div class="lb-c">${i + 1} / ${list.length}</div>`;
    };
    const close = () => {
      document.removeEventListener("keydown", key);
      w.remove();
    };
    const go = (d) => {
      i = (i + d + list.length) % list.length;
      draw();
    };
    const key = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    w.addEventListener("click", (e) => {
      if (e.target.closest("[data-p]")) return go(-1);
      if (e.target.closest("[data-n]")) return go(1);
      if (!e.target.matches("img")) close();
    });
    document.addEventListener("keydown", key);
    draw();
    document.body.appendChild(w);
  }

  /** Reduce una imagen a ~1100px y la devuelve como dataURL JPEG (ahorra espacio en localStorage). */
  function compress(file, max = 1100, q = 0.8) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const img = new Image();
        img.onerror = rej;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", q));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  const gradient = (id) =>
    "g" + ([...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 6);

  App.ui = {
    icon,
    esc,
    field,
    seg,
    select,
    avatar,
    when,
    modal,
    confirmBox,
    toast,
    lightbox,
    compress,
    gradient,
  };
})();
