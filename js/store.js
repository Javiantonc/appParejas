/* ==========================================================
   store.js · datos, persistencia (localStorage) y helpers de fecha
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  const KEY = "nosotros.app.v1";

  /* ---------- Fechas ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = () => toISO(new Date());
  const addDays = (iso, n) => {
    const d = fromISO(iso);
    d.setDate(d.getDate() + n);
    return toISO(d);
  };
  const addMonths = (iso, n) => {
    const d = fromISO(iso),
      day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return toISO(d);
  };
  const startOfWeek = (iso) => {
    const d = fromISO(iso);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return toISO(d);
  };
  const startOfMonth = (iso) => {
    const d = fromISO(iso);
    d.setDate(1);
    return toISO(d);
  };
  const toMin = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fromMin = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const fmt = (iso, o) =>
    new Intl.DateTimeFormat("es-ES", o).format(fromISO(iso));
  const rel = (iso) => {
    const t = today();
    if (iso === t) return "Hoy";
    if (iso === addDays(t, 1)) return "Mañana";
    if (iso === addDays(t, -1)) return "Ayer";
    return fmt(iso, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).replace(".", "");
  };
  const dt = {
    pad,
    toISO,
    from: fromISO,
    today,
    addDays,
    addMonths,
    startOfWeek,
    startOfMonth,
    toMin,
    fromMin,
    fmt,
    rel,
  };

  /* ---------- Constantes ---------- */
  const CATS = {
    home: { label: "Hogar", emoji: "🏠", color: "#34c759" },
    work: { label: "Trabajo", emoji: "💼", color: "#0a84ff" },
    personal: { label: "Personal", emoji: "✨", color: "#bf5af2" },
  };
  const MEALS = {
    breakfast: { label: "Desayuno", emoji: "🥐", time: "09:00" },
    lunch: { label: "Comida", emoji: "🍝", time: "14:00" },
    dinner: { label: "Cena", emoji: "🌙", time: "21:00" },
    snack: { label: "Snack", emoji: "🍎", time: "17:30" },
  };
  const PLAN_STATUS = {
    idea: { label: "Idea", emoji: "💡", color: "#ff9500" },
    planned: { label: "Planeado", emoji: "📅", color: "#0a84ff" },
    done: { label: "Hecho", emoji: "✅", color: "#34c759" },
  };

  const PLAN_TYPES = {
    date: { label: "Cita Romántica", emoji: "💞", color: "#ff4d7d" },
    birthday: { label: "Cumpleaños", emoji: "🎂", color: "#ff9500" },
    wedding: { label: "Boda", emoji: "👰🤵", color: "#bf5af2" },
    communion: { label: "Comunión", emoji: "🕊️", color: "#0a84ff" },
    baptism: { label: "Bautizo", emoji: "👶", color: "#34c759" },
    anniversary: { label: "Aniversario", emoji: "💍", color: "#ff2d55" },
    trip: { label: "Viaje / Escapada", emoji: "✈️", color: "#5856d6" },
    party: { label: "Fiesta / Celebración", emoji: "🎉", color: "#ffcc00" },
    concert: { label: "Concierto / Festival", emoji: "🎵", color: "#af52de" },
    dinner: { label: "Cena Especial", emoji: "🍷", color: "#ff3b30" },
    other: { label: "Otro Plan", emoji: "✨", color: "#64d2ff" },
  };
  const PRIO = { low: "Baja", med: "Media", high: "Alta" };
  const REPEAT = {
    none: "No se repite",
    daily: "Cada día",
    weekly: "Cada semana",
    monthly: "Cada mes",
  };
  const KIND_COLOR = { plan: "#ff4d7d", meal: "#ff9500", reminder: "#bf5af2" };

  const REMINDER_CATS = {
    cinema: { label: "Cine / Espectáculo", emoji: "🍿", color: "#bf5af2" },
    flights: { label: "Vuelos / Billetes", emoji: "✈️", color: "#0a84ff" },
    hotel: { label: "Hotel / Alojamiento", emoji: "🏨", color: "#ff9500" },
    concert: { label: "Concierto / Evento", emoji: "🎟️", color: "#ff2d55" },
    restaurant: { label: "Reserva Restaurante", emoji: "🍷", color: "#ff3b30" },
    travel: { label: "Tren / Transporte", emoji: "🚄", color: "#5856d6" },
    general: { label: "Otro / Recuerdos", emoji: "📎", color: "#34c759" },
  };

  /* ---------- Estado ---------- */
  const uid = () =>
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  const defaults = () => ({
    user: null, // { name: '', surname: '', email: '', password: '' }
    settings: {
      theme: "light",
      coupleName: "Nosotros",
      pairCode: "", // Código de Pareja (ej: AMOR-7492)
      partners: [
        { id: "a", name: "Yo", color: "#ff4d7d", emoji: "🦊" },
        { id: "b", name: "Pareja", color: "#0a84ff", emoji: "🐼" },
      ],
    },
    tasks: [],
    plans: [],
    meals: [],
    reminders: [],
    seeded: false,
  });

  function sampleData() {
    const t = today();
    const mk = (o) =>
      Object.assign(
        {
          id: uid(),
          notes: "",
          duration: 60,
          priority: "med",
          repeat: "none",
          time: "",
          done: false,
        },
        o,
      );
    return {
      tasks: [
        mk({
          title: "Hacer la compra semanal",
          category: "home",
          assignee: "both",
          due: t,
          time: "18:00",
          notes: "Fruta, verdura, leche y detergente",
        }),
        mk({
          title: "Poner la lavadora",
          category: "home",
          assignee: "a",
          due: t,
        }),
        mk({
          title: "Reunión de equipo",
          category: "work",
          assignee: "b",
          due: t,
          time: "10:00",
          priority: "high",
        }),
        mk({
          title: "Entregar el informe",
          category: "work",
          assignee: "a",
          due: addDays(t, 2),
          time: "12:00",
          duration: 120,
          priority: "high",
        }),
        mk({
          title: "Limpiar el baño",
          category: "home",
          assignee: "b",
          due: addDays(t, 1),
          repeat: "weekly",
        }),
        mk({
          title: "Pagar el alquiler",
          category: "home",
          assignee: "both",
          due: addDays(t, 4),
          priority: "high",
          repeat: "monthly",
        }),
        mk({
          title: "Llamar a los abuelos",
          category: "personal",
          assignee: "both",
          due: addDays(t, -1),
        }),
        mk({
          title: "Sacar la basura",
          category: "home",
          assignee: "a",
          due: addDays(t, -2),
          done: true,
        }),
      ],
      plans: [
        {
          id: uid(),
          title: "Escapada a la sierra",
          status: "planned",
          date: addDays(t, 6),
          time: "10:00",
          duration: 480,
          place: "Sierra de Guadarrama",
          description: "Ruta suave por la mañana y comida en un pueblo.",
          photos: [],
          rating: 0,
        },
        {
          id: uid(),
          title: "Cena en el italiano nuevo",
          status: "planned",
          date: addDays(t, 3),
          time: "21:00",
          duration: 120,
          place: "Trattoria Roma",
          description: "Reservar mesa para dos.",
          photos: [],
          rating: 0,
        },
        {
          id: uid(),
          title: "Noche de pelis y manta",
          status: "idea",
          date: "",
          time: "",
          duration: 120,
          place: "En casa",
          description: "Maratón de nuestra saga favorita.",
          photos: [],
          rating: 0,
        },
        {
          id: uid(),
          title: "Museo del Prado",
          status: "done",
          date: addDays(t, -5),
          time: "11:00",
          duration: 180,
          place: "Madrid",
          description: "Nos encantó la sala de Velázquez.",
          photos: [],
          rating: 5,
        },
      ],
      meals: [
        {
          id: uid(),
          date: t,
          type: "lunch",
          title: "Pasta con tomate y albahaca",
          time: "14:00",
          cook: "a",
          notes: "",
          photo: "",
        },
        {
          id: uid(),
          date: t,
          type: "dinner",
          title: "Salmón con ensalada",
          time: "21:00",
          cook: "b",
          notes: "",
          photo: "",
        },
        {
          id: uid(),
          date: addDays(t, 1),
          type: "breakfast",
          title: "Tostadas con aguacate",
          time: "09:00",
          cook: "both",
          notes: "",
          photo: "",
        },
        {
          id: uid(),
          date: addDays(t, 1),
          type: "dinner",
          title: "Tortilla de patatas",
          time: "21:00",
          cook: "a",
          notes: "",
          photo: "",
        },
      ],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw),
          d = defaults();
        const loaded = Object.assign(d, s, {
          settings: Object.assign(d.settings, s.settings || {}),
        });
        if (!Array.isArray(loaded.reminders)) loaded.reminders = [];
        return loaded;
      }
    } catch (e) {
      /* datos corruptos: empezamos de cero */
    }
    const s = defaults();
    Object.assign(s, sampleData(), { seeded: true });
    return s;
  }

  const store = {
    dt,
    CATS,
    MEALS,
    PLAN_STATUS,
    PLAN_TYPES,
    REMINDER_CATS,
    PRIO,
    REPEAT,
    uid,
    state: load(),

    save(skipBroadcast) {
      try {
        localStorage.setItem(KEY, JSON.stringify(store.state));
        if (!skipBroadcast && App.sync && App.sync.broadcast) {
          App.sync.broadcast();
        }
        return true;
      } catch (e) {
        App.ui &&
          App.ui.toast(
            "No se pudo guardar: almacenamiento lleno. Prueba con menos fotos.",
            "error",
          );
        return false;
      }
    },
    getPairCode() {
      return store.state.settings.pairCode || localStorage.getItem('nosotros_pair_code') || '';
    },
    setPairCode(code) {
      store.state.settings.pairCode = code;
      if (code) {
        localStorage.setItem('nosotros_pair_code', code);
      } else {
        localStorage.removeItem('nosotros_pair_code');
      }
      store.save(true);
    },
    mergeRemote(payload, sender) {
      if (!payload) return;
      let changed = false;
      if (Array.isArray(payload.tasks)) {
        store.state.tasks = payload.tasks;
        changed = true;
      }
      if (Array.isArray(payload.plans)) {
        store.state.plans = payload.plans;
        changed = true;
      }
      if (Array.isArray(payload.meals)) {
        store.state.meals = payload.meals;
        changed = true;
      }
      if (Array.isArray(payload.reminders)) {
        store.state.reminders = payload.reminders;
        changed = true;
      }
      if (payload.coupleName) {
        store.state.settings.coupleName = payload.coupleName;
        changed = true;
      }
      if (Array.isArray(payload.partners) && payload.partners.length === 2) {
        store.state.settings.partners = payload.partners;
        changed = true;
      } else if (payload.partnerA && payload.partnerB) {
        store.state.settings.partners = [payload.partnerA, payload.partnerB];
        changed = true;
      }
      if (changed) {
        store.save(true);
        App.refresh && App.refresh();
        if (sender && App.ui) {
          App.ui.toast(`Sincronizado con ${sender} 💞`);
        }
      }
    },
    replace(s) {
      const d = defaults();
      store.state = Object.assign(d, s, {
        settings: Object.assign(d.settings, s.settings || {}),
      });
      store.save();
    },
    reset() {
      store.state = defaults();
      store.save();
    },
    addSamples() {
      const s = sampleData();
      ["tasks", "plans", "meals"].forEach((k) => store.state[k].push(...s[k]));
      store.save();
    },

    get(coll, id) {
      return store.state[coll].find((x) => x.id === id);
    },
    add(coll, obj) {
      const o = Object.assign({ id: uid() }, obj);
      store.state[coll].push(o);
      store.save();
      return o;
    },
    update(coll, id, patch) {
      const o = store.get(coll, id);
      if (o) {
        Object.assign(o, patch);
        store.save();
      }
      return o;
    },
    remove(coll, id) {
      store.state[coll] = store.state[coll].filter((x) => x.id !== id);
      store.save();
    },

    partner(id) {
      return store.state.settings.partners[id === "b" ? 1 : 0];
    },
    who(id) {
      return id === "both" ? "Ambos" : store.partner(id).name;
    },

    /** Marca/desmarca una tarea. Si se repite, avanza a la siguiente fecha. */
    toggleTask(id) {
      const t = store.get("tasks", id);
      if (!t) return null;
      if (!t.done && t.repeat && t.repeat !== "none" && t.due) {
        t.due =
          t.repeat === "daily"
            ? addDays(t.due, 1)
            : t.repeat === "weekly"
              ? addDays(t.due, 7)
              : addMonths(t.due, 1);
        store.save();
        return `¡Hecha! Próxima vez: ${rel(t.due).toLowerCase()}`;
      }
      t.done = !t.done;
      store.save();
      return t.done ? "¡Tarea completada! 🎉" : "Tarea reabierta";
    },

    /** Todos los eventos de un día para el calendario (tareas, planes y comidas). */
    eventsOn(iso) {
      const out = [],
        S = store.state;
      S.tasks.forEach((t) => {
        if (t.due !== iso) return;
        const s = toMin(t.time);
        out.push({
          kind: "task",
          id: t.id,
          title: t.title,
          done: t.done,
          allDay: s == null,
          start: s ?? 0,
          end: s == null ? 0 : Math.min(1440, s + (t.duration || 60)),
          color: CATS[t.category]?.color || "#0a84ff",
          sub: CATS[t.category]?.label,
          emoji: CATS[t.category]?.emoji,
        });
      });
      S.plans.forEach((p) => {
        if (p.date !== iso) return;
        const s = toMin(p.time);
        const typeInfo = PLAN_TYPES[p.type] || PLAN_TYPES.date;
        out.push({
          kind: "plan",
          id: p.id,
          title: p.title,
          done: p.status === "done",
          allDay: s == null,
          start: s ?? 0,
          end: s == null ? 0 : Math.min(1440, s + (p.duration || 120)),
          color: typeInfo.color || KIND_COLOR.plan,
          sub: p.place ? `${typeInfo.label} · ${p.place}` : typeInfo.label,
          emoji: typeInfo.emoji || "💞",
        });
      });
      S.meals.forEach((m) => {
        if (m.date !== iso) return;
        const s = toMin(m.time || MEALS[m.type].time);
        out.push({
          kind: "meal",
          id: m.id,
          title: m.title,
          done: false,
          allDay: false,
          start: s,
          end: Math.min(1440, s + 60),
          color: KIND_COLOR.meal,
          sub: MEALS[m.type].label,
          emoji: MEALS[m.type].emoji,
        });
      });
      (S.reminders || []).forEach((r) => {
        if (r.date !== iso) return;
        const s = toMin(r.time);
        const cat = REMINDER_CATS[r.category] || REMINDER_CATS.general;
        out.push({
          kind: "reminder",
          id: r.id,
          title: r.title,
          done: false,
          allDay: s == null,
          start: s ?? 0,
          end: s == null ? 0 : Math.min(1440, s + 60),
          color: cat.color || KIND_COLOR.reminder,
          sub: cat.label,
          emoji: cat.emoji || "🎟️",
        });
      });
      return out.sort((a, b) => b.allDay - a.allDay || a.start - b.start);
    },
  };

  App.store = store;
  store.save();
})();
