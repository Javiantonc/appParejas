/* ==========================================================
   forms.js · formularios de tarea, plan y comida + añadir rápido
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  const { store, ui } = App;
  const { esc, icon, seg, field, select } = ui;
  const { dt, CATS, MEALS, PLAN_STATUS, REPEAT } = store;

  const partnerOpts = () => {
    const [a, b] = store.state.settings.partners;
    return [
      { v: 'a', label: `${esc(a.emoji)} ${esc(a.name)}` },
      { v: 'b', label: `${esc(b.emoji)} ${esc(b.name)}` },
      { v: 'both', label: '👫 Ambos' },
    ];
  };
  const done = (msg) => { App.refresh(); if (msg) ui.toast(msg); };

  /* ---------------- TAREA ---------------- */
  function task(t, pre) {
    const isNew = !t;
    const d = Object.assign({ title: '', notes: '', category: 'home', assignee: 'both', due: dt.today(), time: '', duration: 60, priority: 'med', repeat: 'none' }, t || pre || {});
    ui.modal({
      title: isNew ? 'Nueva tarea' : 'Editar tarea',
      html: `<form class="form" autocomplete="off">
        <input class="big-input" name="title" placeholder="¿Qué hay que hacer?" value="${esc(d.title)}" required>
        ${field('Categoría', seg('category', Object.entries(CATS).map(([k, c]) => ({ v: k, label: `${c.emoji} ${c.label}` })), d.category))}
        ${field('¿Quién se encarga?', seg('assignee', partnerOpts(), d.assignee))}
        <div class="row2">
          ${field('Fecha', `<input type="date" name="due" value="${d.due || ''}">`)}
          ${field('Hora', `<input type="time" name="time" value="${d.time || ''}">`)}
        </div>
        <div class="row2">
          ${field('Duración', select('duration', [[15, '15 min'], [30, '30 min'], [60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h'], [240, '4 h']], d.duration))}
          ${field('Repetir', select('repeat', Object.entries(REPEAT), d.repeat))}
        </div>
        ${field('Prioridad', seg('priority', [{ v: 'low', label: 'Baja' }, { v: 'med', label: 'Media' }, { v: 'high', label: 'Alta 🔥' }], d.priority))}
        ${field('Notas', `<textarea name="notes" rows="3" placeholder="Detalles, enlaces…">${esc(d.notes)}</textarea>`)}
        <div class="form-actions">
          ${isNew ? '' : `<button type="button" class="btn danger" data-del>${icon('trash', 16)} Eliminar</button>`}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button class="btn primary" type="submit">${isNew ? 'Añadir tarea' : 'Guardar'}</button>
        </div></form>`,
      onMount(root, close) {
        const form = root.querySelector('form');
        if (isNew && !pre) form.title.focus();
        root.querySelector('[data-cancel]').onclick = close;
        const del = root.querySelector('[data-del]');
        if (del) del.onclick = async () => { if (await ui.confirmBox('¿Eliminar esta tarea?')) { store.remove('tasks', t.id); close(); done('Tarea eliminada'); } };
        form.onsubmit = e => {
          e.preventDefault();
          const f = new FormData(form);
          const data = {
            title: f.get('title').trim(), notes: f.get('notes').trim(), category: f.get('category'), assignee: f.get('assignee'),
            due: f.get('due') || '', time: f.get('time') || '', duration: +f.get('duration'), priority: f.get('priority'), repeat: f.get('repeat'),
          };
          if (!data.title) return;
          if (isNew) store.add('tasks', Object.assign(data, { done: false })); else store.update('tasks', t.id, data);
          close(); done(isNew ? 'Tarea añadida ✅' : 'Cambios guardados');
        };
      },
    });
  }

  /* ---------------- PLAN ---------------- */
  function plan(p, pre) {
    const isNew = !p;
    const d = Object.assign({
      title: '',
      type: 'date',
      status: 'planned',
      date: '',
      time: '',
      duration: 120,
      place: '',
      description: '',
      photos: [],
      rating: 0
    }, p || pre || {});

    const photos = [...(d.photos || [])];
    const typeOpts = Object.entries(store.PLAN_TYPES || {}).map(([k, t]) => [k, `${t.emoji} ${t.label}`]);

    ui.modal({
      title: isNew ? 'Nuevo plan o celebración 🎉' : 'Editar plan o celebración', size: 'lg',
      html: `<form class="form" autocomplete="off">
        <input class="big-input" name="title" placeholder="¿Qué tenéis en mente? (ej: Boda de Laura & Carlos, Cumpleaños, Escapada…)" value="${esc(d.title)}" required>
        <div class="row2">
          ${field('Tipo de Evento / Celebración', select('type', typeOpts, d.type || 'date'))}
          ${field('Estado', seg('status', Object.entries(PLAN_STATUS).map(([k, s]) => ({ v: k, label: `${s.emoji} ${s.label}` })), d.status))}
        </div>
        <div class="row2">
          ${field('Fecha', `<input type="date" name="date" value="${d.date || ''}">`)}
          ${field('Hora', `<input type="time" name="time" value="${d.time || ''}">`)}
        </div>
        <div class="row2">
          ${field('Duración', select('duration', [[60, '1 h'], [120, '2 h'], [180, '3 h'], [240, '4 h'], [480, 'Todo el día']], d.duration))}
          ${field('Lugar / Restaurante / Iglesia / Salón', `<input type="text" name="place" placeholder="Ej: Finca Las Palmeras, Parroquia, Casa…" value="${esc(d.place)}">`)}
        </div>
        ${field('Descripción / Qué llevar / Notas del evento', `<textarea name="notes" rows="3" placeholder="Detalles: regalo, código de vestimenta, reservas, horarios…">${esc(d.description)}</textarea>`)}
        ${field('Valoración (si ya lo hicisteis)', select('rating', [[0, 'Sin valorar'], [1, '❤'], [2, '❤❤'], [3, '❤❤❤'], [4, '❤❤❤❤'], [5, '❤❤❤❤❤']], d.rating))}
        ${field('Fotos', `<label class="drop" data-drop>${icon('image', 26)}<b>Añadir fotos</b><small>Toca o arrastra imágenes aquí</small><input type="file" accept="image/*" multiple hidden></label><div class="photo-grid" data-photos></div>`)}
        <div class="form-actions">
          ${isNew ? '' : `<button type="button" class="btn danger" data-del>${icon('trash', 16)} Eliminar</button>`}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button class="btn primary" type="submit">${isNew ? 'Añadir plan' : 'Guardar'}</button>
        </div></form>`,
      onMount(root, close) {
        const form = root.querySelector('form'), grid = root.querySelector('[data-photos]');
        const input = root.querySelector('input[type=file]'), drop = root.querySelector('[data-drop]');
        const draw = () => { grid.innerHTML = photos.map((s, i) => `<div class="ph"><img src="${s}" alt=""><button type="button" data-rm="${i}" aria-label="Quitar">${icon('x', 14)}</button></div>`).join(''); };
        const addFiles = async files => {
          for (const f of files) { if (!f.type.startsWith('image/')) continue; try { photos.push(await ui.compress(f)); } catch (e) { ui.toast('No se pudo leer una imagen', 'error'); } }
          draw();
        };
        draw();
        input.onchange = async () => { await addFiles([...input.files]); input.value = ''; };
        ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
        ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
        drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));
        grid.onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { photos.splice(+b.dataset.rm, 1); draw(); } };
        root.querySelector('[data-cancel]').onclick = close;
        const del = root.querySelector('[data-del]');
        if (del) del.onclick = async () => { if (await ui.confirmBox('¿Eliminar este plan y sus fotos?')) { store.remove('plans', p.id); close(); done('Plan eliminado'); } };
        form.onsubmit = e => {
          e.preventDefault();
          const f = new FormData(form);
          const data = {
            title: f.get('title').trim(),
            type: f.get('type') || 'date',
            status: f.get('status'),
            date: f.get('date') || '',
            time: f.get('time') || '',
            duration: +f.get('duration'),
            place: f.get('place').trim(),
            description: (f.get('notes') || f.get('description') || '').trim(),
            rating: +f.get('rating'),
            photos: [...photos],
          };
          if (!data.title) return;
          if (isNew) store.add('plans', data); else store.update('plans', p.id, data);
          close(); done(isNew ? 'Plan / Evento añadido 🎉' : 'Plan actualizado');
        };
      },
    });
  }

  function planDetail(id) {
    const p = store.get('plans', id); if (!p) return;
    const st = PLAN_STATUS[p.status];
    const typeInfo = (store.PLAN_TYPES && store.PLAN_TYPES[p.type]) || store.PLAN_TYPES.date;
    const gallery = p.photos.length ? `
      <img class="gallery-main" src="${p.photos[0]}" alt="" data-ph="0">
      ${p.photos.length > 1 ? `<div class="gallery-th">${p.photos.slice(1).map((s, i) => `<img src="${s}" alt="" data-ph="${i + 1}">`).join('')}</div>` : ''}` : '';
    ui.modal({
      title: p.title, size: 'lg',
      html: `${gallery}
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <span class="badge" style="--c:${typeInfo.color};background:var(--surface-2);color:var(--text);font-weight:700">${typeInfo.emoji} ${typeInfo.label}</span>
          <span class="badge" style="--c:${st.color}">${st.emoji} ${st.label}</span>
        </div>
        <div class="detail-meta">
          <div>${icon('calendar', 16)} ${esc(ui.when(p.date, p.time, p.duration))}</div>
          ${p.place ? `<div>${icon('pin', 16)} ${esc(p.place)}</div>` : ''}
          ${p.rating ? `<div class="hearts">${'❤'.repeat(p.rating)}</div>` : ''}
        </div>
        ${p.description ? `<p style="margin:10px 0 18px;white-space:pre-wrap">${esc(p.description)}</p>` : ''}
        <div class="form-actions">
          <button class="btn danger" data-del>${icon('trash', 16)}</button>
          <label class="btn" style="cursor:pointer">
            ${icon('image', 16)} Añadir foto
            <input type="file" accept="image/*" hidden data-add-photo>
          </label>
          <span class="grow"></span>
          ${p.status !== 'done' ? `<button class="btn" data-done>✅ Marcar como hecho</button>` : ''}
          <button class="btn primary" data-edit>${icon('edit', 16)} Editar</button>
        </div>`,
      onMount(root, close) {
        root.querySelectorAll('[data-ph]').forEach(img => img.onclick = () => ui.lightbox(p.photos, +img.dataset.ph));
        root.querySelector('[data-edit]').onclick = () => { close(); setTimeout(() => plan(p), 220); };
        const addPhotoInput = root.querySelector('[data-add-photo]');
        if (addPhotoInput) {
          addPhotoInput.onchange = async () => {
            if (addPhotoInput.files[0]) {
              try {
                const compressed = await ui.compress(addPhotoInput.files[0]);
                p.photos = p.photos || [];
                p.photos.push(compressed);
                store.update('plans', p.id, { photos: p.photos });
                close();
                planDetail(p.id);
                done('¡Foto guardada en el recuerdo! 📸');
              } catch (e) {
                ui.toast('No se pudo cargar la imagen', 'error');
              }
            }
          };
        }
        const dn = root.querySelector('[data-done]');
        if (dn) dn.onclick = () => { store.update('plans', p.id, { status: 'done' }); close(); done('¡Plan hecho! Añade fotos para el recuerdo 📸'); };
        root.querySelector('[data-del]').onclick = async () => { if (await ui.confirmBox('¿Eliminar este plan?')) { store.remove('plans', p.id); close(); done('Plan eliminado'); } };
      },
    });
  }

  /* ---------------- COMIDA ---------------- */
  function meal(m, pre) {
    const isNew = !m;
    const d = Object.assign({ title: '', date: dt.today(), type: 'lunch', time: '', cook: 'both', notes: '', photo: '' }, m || pre || {});
    if (!d.time) d.time = MEALS[d.type].time;
    let photo = d.photo || '';
    ui.modal({
      title: isNew ? 'Añadir comida' : 'Editar comida',
      html: `<form class="form" autocomplete="off">
        <input class="big-input" name="title" placeholder="¿Qué vais a comer?" value="${esc(d.title)}" required>
        ${field('Momento', seg('type', Object.entries(MEALS).map(([k, c]) => ({ v: k, label: `${c.emoji} ${c.label}` })), d.type))}
        <div class="row2">
          ${field('Fecha', `<input type="date" name="date" value="${d.date}" required>`)}
          ${field('Hora', `<input type="time" name="time" value="${d.time}">`)}
        </div>
        ${field('¿Quién cocina?', seg('cook', partnerOpts(), d.cook))}
        ${field('Notas / ingredientes', `<textarea name="notes" rows="3" placeholder="Ingredientes, receta, enlace…">${esc(d.notes)}</textarea>`)}
        ${field('Foto', `<label class="drop">${icon('image', 24)}<b>Añadir foto</b><small>Del plato o de la receta</small><input type="file" accept="image/*" hidden></label><div class="photo-grid" data-photo></div>`)}
        <div class="form-actions">
          ${isNew ? '' : `<button type="button" class="btn danger" data-del>${icon('trash', 16)} Eliminar</button>`}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button class="btn primary" type="submit">${isNew ? 'Añadir' : 'Guardar'}</button>
        </div></form>`,
      onMount(root, close) {
        const form = root.querySelector('form'), grid = root.querySelector('[data-photo]'), input = root.querySelector('input[type=file]');
        const draw = () => { grid.innerHTML = photo ? `<div class="ph"><img src="${photo}" alt=""><button type="button" data-rm aria-label="Quitar">${icon('x', 14)}</button></div>` : ''; };
        draw();
        input.onchange = async () => { if (input.files[0]) { try { photo = await ui.compress(input.files[0]); } catch (e) { ui.toast('No se pudo leer la imagen', 'error'); } draw(); } input.value = ''; };
        grid.onclick = e => { if (e.target.closest('[data-rm]')) { photo = ''; draw(); } };
        // Al cambiar el momento del día, sugerimos su hora habitual (si no se ha tocado la hora)
        let touched = !isNew;
        form.time.addEventListener('input', () => { touched = true; });
        form.querySelectorAll('input[name=type]').forEach(r => r.addEventListener('change', () => { if (!touched) form.time.value = MEALS[r.value].time; }));
        root.querySelector('[data-cancel]').onclick = close;
        const del = root.querySelector('[data-del]');
        if (del) del.onclick = async () => { if (await ui.confirmBox('¿Eliminar esta comida?')) { store.remove('meals', m.id); close(); done('Comida eliminada'); } };
        form.onsubmit = e => {
          e.preventDefault();
          const f = new FormData(form);
          const data = { title: f.get('title').trim(), type: f.get('type'), date: f.get('date'), time: f.get('time') || MEALS[f.get('type')].time, cook: f.get('cook'), notes: f.get('notes').trim(), photo };
          if (!data.title || !data.date) return;
          if (isNew) store.add('meals', data); else store.update('meals', m.id, data);
          close(); done(isNew ? 'Comida añadida 🍽️' : 'Comida actualizada');
        };
      },
    });
  }

  /* ---------------- RECORDATORIO / BILLETE / QR / RESERVA ---------------- */
  function reminder(r, pre) {
    const isNew = !r;
    const d = Object.assign({
      title: '',
      category: 'cinema',
      date: dt.today(),
      time: '',
      code: '',
      locator: '',
      seat: '',
      place: '',
      notes: '',
      photo: ''
    }, r || pre || {});

    let photo = d.photo || '';
    const catOpts = Object.entries(store.REMINDER_CATS).map(([k, c]) => ({ v: k, label: `${c.emoji} ${c.label}` }));

    ui.modal({
      title: isNew ? 'Nuevo recordatorio / entrada 🎟️' : 'Editar entrada o reserva',
      size: 'lg',
      html: `<form class="form" autocomplete="off">
        <input class="big-input" name="title" placeholder="Ej: Entradas Cine Avatar, Vuelo Madrid-París, Hotel…" value="${esc(d.title)}" required>
        ${field('Tipo de recordatorio', seg('category', catOpts, d.category))}
        <div class="row2">
          ${field('Fecha del evento / reserva', `<input type="date" name="date" value="${d.date || ''}">`)}
          ${field('Hora', `<input type="time" name="time" value="${d.time || ''}">`)}
        </div>
        <div class="row2">
          ${field('Localizador / Ref. Reserva', `<input type="text" name="locator" placeholder="Ej: Y8X3KP, #4920…" value="${esc(d.locator)}">`)}
          ${field('Asiento / Sala / Habitación', `<input type="text" name="seat" placeholder="Ej: Butacas F12-F13, Hab. 304…" value="${esc(d.seat)}">`)}
        </div>
        ${field('Lugar / Dirección', `<input type="text" name="place" placeholder="Ej: Cines Callao, Terminal T4, Hotel Riu…" value="${esc(d.place)}">`)}
        ${field('Texto / Código QR / Enlace', `<input type="text" name="code" placeholder="Código de barras, código numérico o enlace web…" value="${esc(d.code)}">`)}
        ${field('Foto del QR / Entrada / PDF capturado', `<label class="drop">${icon('qr', 26)}<b>Subir código QR o foto del billete</b><small>Toca para adjuntar la entrada o justificante</small><input type="file" accept="image/*" hidden></label><div class="photo-grid" data-photo></div>`)}
        ${field('Notas adicionales', `<textarea name="notes" rows="2" placeholder="Recordar llevar DNI, check-in online hecho, equipaje de mano…">${esc(d.notes)}</textarea>`)}
        <div class="form-actions">
          ${isNew ? '' : `<button type="button" class="btn danger" data-del>${icon('trash', 16)} Eliminar</button>`}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button class="btn primary" type="submit">${isNew ? 'Guardar recordatorio 🎟️' : 'Guardar cambios'}</button>
        </div>
      </form>`,
      onMount(root, close) {
        const form = root.querySelector('form');
        const grid = root.querySelector('[data-photo]');
        const input = root.querySelector('input[type=file]');

        const draw = () => {
          grid.innerHTML = photo ? `<div class="ph" style="aspect-ratio:auto;max-height:220px;border-radius:14px;overflow:hidden;position:relative"><img src="${photo}" alt="QR / Billete" style="max-height:220px;width:100%;object-fit:contain;background:#000;border-radius:14px"><button type="button" data-rm aria-label="Quitar">${icon('x', 14)}</button></div>` : '';
        };
        draw();

        input.onchange = async () => {
          if (input.files[0]) {
            try {
              photo = await ui.compress(input.files[0], 1200, 0.75);
            } catch (e) {
              ui.toast('No se pudo procesar la imagen', 'error');
            }
            draw();
          }
          input.value = '';
        };

        grid.onclick = e => {
          if (e.target.closest('[data-rm]')) {
            photo = '';
            draw();
          }
        };

        root.querySelector('[data-cancel]').onclick = close;
        const del = root.querySelector('[data-del]');
        if (del) del.onclick = async () => {
          if (await ui.confirmBox('¿Eliminar este recordatorio?')) {
            store.remove('reminders', r.id);
            close();
            done('Recordatorio eliminado');
          }
        };

        form.onsubmit = e => {
          e.preventDefault();
          const f = new FormData(form);
          const data = {
            title: f.get('title').trim(),
            category: f.get('category'),
            date: f.get('date') || '',
            time: f.get('time') || '',
            locator: f.get('locator').trim(),
            seat: f.get('seat').trim(),
            place: f.get('place').trim(),
            code: f.get('code').trim(),
            notes: f.get('notes').trim(),
            photo
          };
          if (!data.title) return;
          if (isNew) store.add('reminders', data);
          else store.update('reminders', r.id, data);
          close();
          done(isNew ? '¡Billetes / QR guardados con éxito! 🎟️' : 'Recordatorio actualizado');
        };
      }
    });
  }

  /* ---------------- Añadir rápido y abrir evento ---------------- */
  function openEvent(kind, id) {
    if (kind === 'task') {
      const t = store.get('tasks', id);
      if (t) task(t);
    } else if (kind === 'plan') {
      planDetail(id);
    } else if (kind === 'meal') {
      const m = store.get('meals', id);
      if (m) meal(m);
    } else if (kind === 'reminder') {
      const r = store.get('reminders', id);
      if (r) reminder(r);
    }
  }

  function quickAdd(initialDate, initialTime) {
    let date = initialDate || dt.today();
    let time = initialTime || '';

    const eventsToday = store.eventsOn(date);
    const dateFormatted = dt.fmt(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const eventsListHTML = eventsToday.length ? `
      <div style="margin-bottom:16px">
        <span class="fl" style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;display:block">
          Cosas programadas este día (toca para modificar):
        </span>
        <div style="display:flex;flex-direction:column;gap:7px;max-height:180px;overflow-y:auto;padding-right:2px">
          ${eventsToday.map(e => `
            <div class="quick-ev-item" data-ev-kind="${e.kind}" data-ev-id="${e.id}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface-2);border-radius:12px;cursor:pointer;border-left:4px solid ${e.color};transition:0.15s">
              <span style="font-size:16px">${e.emoji || '📌'}</span>
              <div style="flex:1;min-width:0">
                <b style="display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${e.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${esc(e.title)}</b>
                <small class="muted" style="font-size:11.5px">${e.allDay ? 'Todo el día' : dt.fromMin(e.start) + ' – ' + dt.fromMin(e.end)}</small>
              </div>
              <span class="muted" style="font-size:12px;font-weight:600">Editar ✏️</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div style="padding:10px 12px;background:var(--surface-2);border-radius:12px;margin-bottom:16px;text-align:center">
        <p class="muted" style="font-size:13px;margin:0">No hay nada programado todavía para este día.</p>
      </div>
    `;

    ui.modal({
      title: 'Organizar día 📅',
      size: 'sm',
      html: `
        <div style="margin-bottom:14px">
          <label class="fl" style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:4px;display:block">Fecha y hora a programar:</label>
          <div style="display:flex;gap:8px">
            <input type="date" id="qa-date" value="${date}" style="flex:1;padding:8px 10px;font-size:13px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;font-weight:600">
            <input type="time" id="qa-time" value="${time}" style="width:110px;padding:8px 10px;font-size:13px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px">
          </div>
        </div>

        ${eventsListHTML}

        <span class="fl" style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;display:block">
          ¿Qué quieres añadir a este día?
        </span>
        <div class="quick" style="grid-template-columns:repeat(5,1fr)">
          <button type="button" data-k="task"><span>✅</span>Tarea</button>
          <button type="button" data-k="plan"><span>💞</span>Plan</button>
          <button type="button" data-k="meal"><span>🍝</span>Comida</button>
          <button type="button" data-k="reminder"><span>🎟️</span>Billete/QR</button>
          <button type="button" data-k="expense"><span>💸</span>Gasto</button>
        </div>
      `,
      onMount(root, close) {
        const dInput = root.querySelector('#qa-date');
        const tInput = root.querySelector('#qa-time');

        // Si cambian la fecha en el selector, recargar para mostrar los eventos de esa fecha elegida
        if (dInput) {
          dInput.addEventListener('change', () => {
            const newDate = dInput.value;
            const newTime = tInput ? tInput.value : '';
            if (newDate && newDate !== date) {
              close();
              quickAdd(newDate, newTime);
            }
          });
        }

        // Clic en cualquier evento existente de la lista para modificarlo
        root.querySelectorAll('[data-ev-kind]').forEach(row => {
          row.onclick = () => {
            const k = row.dataset.evKind;
            const id = row.dataset.evId;
            close();
            setTimeout(() => {
              openEvent(k, id);
            }, 180);
          };
        });

        // Botones de añadir
        root.querySelectorAll('[data-k]').forEach(b => {
          b.onclick = () => {
            const k = b.dataset.k;
            const chosenDate = dInput ? dInput.value : date;
            const chosenTime = tInput ? tInput.value : time;
            close();
            setTimeout(() => {
              if (k === 'task') task(null, { due: chosenDate, time: chosenTime || '' });
              if (k === 'plan') plan(null, { date: chosenDate, time: chosenTime || '', status: 'planned' });
              if (k === 'meal') {
                const h = chosenTime ? dt.toMin(chosenTime) : null;
                const type = h == null ? 'lunch' : h < 11 * 60 ? 'breakfast' : h < 16 * 60 ? 'lunch' : h < 19 * 60 ? 'snack' : 'dinner';
                meal(null, { date: chosenDate, type, time: chosenTime || MEALS[type].time });
              }
              if (k === 'reminder') {
                reminder(null, { date: chosenDate, time: chosenTime || '' });
              }
              if (k === 'expense') {
                expense(null);
              }
            }, 200);
          };
        });
      },
    });
  }

  /* ---------------- GRUPO (VIAJES / AMIGOS / FAMILIA) ---------------- */
  function group(g) {
    const isNew = !g;
    const currentUserName = (store.state.user && store.state.user.name) || (store.state.settings.partners[0].name) || 'Yo';
    const partnerName = (store.state.settings.partners[1] && store.state.settings.partners[1].name) || 'Pareja';
    const defaultMembers = [
      { id: 'm1', name: currentUserName, emoji: '🦊' },
      { id: 'm2', name: partnerName, emoji: '🐼' }
    ];

    const d = Object.assign({
      name: '',
      type: 'trip', // trip, friends, family, flat, other
      emoji: '✈️',
      currency: '€',
      description: '',
      members: defaultMembers
    }, g || {});

    const emojis = ['✈️', '🏖️', '⛰️', '🎉', '🍻', '🍕', '🏠', '🚗', '⛺', '🎸', '🎁', '✨'];
    const types = [
      { v: 'trip', label: '✈️ Viaje' },
      { v: 'friends', label: '🍻 Amigos' },
      { v: 'family', label: '🏡 Familia' },
      { v: 'flat', label: '🏠 Piso / Convivencia' },
      { v: 'other', label: '✨ Otro' }
    ];

    let membersList = JSON.parse(JSON.stringify(d.members || defaultMembers));

    function renderMembersListHTML() {
      return membersList.map((m, idx) => `
        <div class="group-member-item" data-idx="${idx}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:18px">${esc(m.emoji || '👤')}</span>
          <input type="text" class="member-name-input" data-idx="${idx}" value="${esc(m.name)}" placeholder="Nombre" style="flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:var(--surface)">
          ${membersList.length > 2 ? `<button type="button" class="icon-btn del-member-btn" data-idx="${idx}" title="Eliminar participante" style="color:var(--red)">${icon('x', 14)}</button>` : ''}
        </div>
      `).join('');
    }

    ui.modal({
      title: isNew ? 'Nuevo Grupo de Gastos' : 'Editar Grupo',
      html: `<form class="form" autocomplete="off">
        <div class="row2">
          ${field('Icono', `
            <div class="emoji-pick" id="grp-emoji-pick">
              ${emojis.map(e => `<button type="button" class="${e === d.emoji ? 'active' : ''}" data-e="${e}">${e}</button>`).join('')}
            </div>
            <input type="hidden" name="emoji" value="${d.emoji}">
          `)}
          ${field('Tipo de Grupo', select('type', types.map(t => [t.v, t.label]), d.type))}
        </div>
        ${field('Nombre del Grupo', `<input class="big-input" name="name" placeholder="Ej: Viaje a Roma, Cena amigos, Casa..." value="${esc(d.name)}" required>`)}
        ${field('Descripción / Destino', `<input type="text" name="description" placeholder="Ej: Vacaciones de verano 2026" value="${esc(d.description)}">`)}
        
        <div class="fld">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span class="fl" style="margin-bottom:0">Participantes (${membersList.length})</span>
            <button type="button" class="btn ghost sm" id="add-member-btn" style="padding:4px 10px;font-size:12px">${icon('plus', 13)} Añadir persona</button>
          </div>
          <div id="members-container">${renderMembersListHTML()}</div>
          <small class="muted" style="display:block;margin-top:4px">Puedes añadir a tantos amigos o familiares como participen en el viaje o grupo.</small>
        </div>

        <div class="form-actions">
          ${isNew ? '' : `<button type="button" class="btn danger" data-del>${icon('trash', 16)} Eliminar Grupo</button>`}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button class="btn primary" type="submit">${isNew ? 'Crear Grupo' : 'Guardar'}</button>
        </div>
      </form>`,
      onMount(root, close) {
        const form = root.querySelector('form');
        const membersCont = root.querySelector('#members-container');
        const addMemberBtn = root.querySelector('#add-member-btn');

        // Emoji picker
        root.querySelectorAll('#grp-emoji-pick button').forEach(b => {
          b.onclick = () => {
            root.querySelectorAll('#grp-emoji-pick button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            form.emoji.value = b.dataset.e;
          };
        });

        function wireMembersEvents() {
          membersCont.querySelectorAll('.member-name-input').forEach(input => {
            input.oninput = () => {
              const idx = parseInt(input.dataset.idx, 10);
              if (membersList[idx]) membersList[idx].name = input.value;
            };
          });
          membersCont.querySelectorAll('.del-member-btn').forEach(btn => {
            btn.onclick = () => {
              const idx = parseInt(btn.dataset.idx, 10);
              if (membersList.length > 2) {
                membersList.splice(idx, 1);
                membersCont.innerHTML = renderMembersListHTML();
                wireMembersEvents();
              }
            };
          });
        }
        wireMembersEvents();

        addMemberBtn.onclick = () => {
          const emojisPool = ['🐼', '🦁', '🐨', '🐯', '🐸', '🐙', '🦄', '🐶', '🦊', '🐱'];
          const randEmoji = emojisPool[membersList.length % emojisPool.length];
          membersList.push({
            id: 'm_' + store.uid(),
            name: `Amigo ${membersList.length + 1}`,
            emoji: randEmoji
          });
          membersCont.innerHTML = renderMembersListHTML();
          wireMembersEvents();
          const lastInput = membersCont.querySelector(`input[data-idx="${membersList.length - 1}"]`);
          if (lastInput) { lastInput.focus(); lastInput.select(); }
        };

        root.querySelector('[data-cancel]').onclick = close;
        const del = root.querySelector('[data-del]');
        if (del) {
          del.onclick = async () => {
            if (await ui.confirmBox(`¿Eliminar el grupo "${d.name}" y todos sus gastos?`)) {
              store.remove('groups', g.id);
              store.state.expenses = (store.state.expenses || []).filter(e => e.groupId !== g.id);
              store.save();
              close();
              done('Grupo eliminado');
            }
          };
        }

        form.onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(form);
          const name = f.get('name').trim();
          if (!name) return;

          // Limpiar participantes vacíos
          const cleanedMembers = membersList
            .map(m => ({ id: m.id || ('m_' + store.uid()), name: (m.name || '').trim(), emoji: m.emoji || '👤' }))
            .filter(m => m.name.length > 0);

          if (cleanedMembers.length < 2) {
            ui.toast('Añade al menos 2 personas al grupo', 'error');
            return;
          }

          const data = {
            name,
            type: f.get('type') || 'trip',
            emoji: f.get('emoji') || '✈️',
            currency: '€',
            description: f.get('description').trim(),
            members: cleanedMembers
          };

          if (isNew) {
            const created = store.add('groups', data);
            close();
            done('¡Grupo creado! 🎉');
            if (App.views.grupos && App.views.grupos.selectGroup) {
              App.views.grupos.selectGroup(created.id);
            }
          } else {
            store.update('groups', g.id, data);
            close();
            done('Grupo actualizado');
          }
        };
      }
    });
  }

  /* ---------------- GASTO / TRICOUNT ---------------- */
  function expense(exp, defaultGroupId) {
    const isNew = !exp;
    const groups = store.state.groups || [];
    if (!groups.length) {
      ui.toast('Primero crea un grupo para añadir gastos', 'info');
      group();
      return;
    }

    const currentGroup = groups.find(g => g.id === (exp ? exp.groupId : defaultGroupId)) || groups[0];
    const members = currentGroup.members || [];

    const d = Object.assign({
      groupId: currentGroup.id,
      title: '',
      amount: '',
      currency: '€',
      date: dt.today(),
      payerId: members[0] ? members[0].id : '',
      splitWith: members.map(m => m.id), // por defecto todos
      category: 'food', // food, transport, lodging, ticket, activity, other
      notes: ''
    }, exp || {});

    const EXP_CATS = [
      { v: 'food', label: '🍔 Comida / Restaurante' },
      { v: 'transport', label: '🚗 Gasolina / Transporte' },
      { v: 'lodging', label: '🏨 Alojamiento / Hotel' },
      { v: 'ticket', label: '🎟️ Entradas / Actividades' },
      { v: 'supermarket', label: '🛒 Supermercado / Compra' },
      { v: 'other', label: '✨ Otros Gastos' }
    ];

    let selectedSplit = Array.isArray(d.splitWith) && d.splitWith.length ? [...d.splitWith] : members.map(m => m.id);

    function renderSplitCheckboxes(membersList) {
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <small class="muted">Dividir entre (${selectedSplit.length} de ${membersList.length}):</small>
          <button type="button" class="btn ghost sm" id="toggle-all-split" style="font-size:11px;padding:2px 8px">
            ${selectedSplit.length === membersList.length ? 'Desmarcar todos' : 'Todos'}
          </button>
        </div>
        <div class="split-checkboxes-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:6px">
          ${membersList.map(m => {
            const checked = selectedSplit.includes(m.id);
            return `
              <label class="split-check-item ${checked ? 'active' : ''}" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:10px;border:1px solid ${checked ? 'var(--accent)' : 'var(--line)'};background:${checked ? 'var(--accent-soft)' : 'var(--surface-2)'};cursor:pointer;font-size:13px;font-weight:600">
                <input type="checkbox" name="split_person" value="${m.id}" ${checked ? 'checked' : ''} style="display:none">
                <span>${esc(m.emoji || '👤')}</span>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.name)}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
    }

    ui.modal({
      title: isNew ? 'Añadir Gasto' : 'Editar Gasto',
      html: `<form class="form" autocomplete="off">
        <div class="row2">
          ${field('Importe (€)', `<input type="number" step="0.01" min="0.01" class="big-input" name="amount" placeholder="0.00" value="${d.amount || ''}" required autofocus style="font-weight:800;color:var(--accent)">`)}
          ${field('Fecha', `<input type="date" name="date" value="${d.date || dt.today()}">`)}
        </div>
        ${field('¿Qué se ha pagado? (Concepto)', `<input type="text" name="title" placeholder="Ej: Cena del viernes, Gasolina, Supermercado..." value="${esc(d.title)}" required>`)}
        
        <div class="row2">
          ${groups.length > 1 ? field('Grupo', select('groupId', groups.map(g => [g.id, `${g.emoji} ${g.name}`]), d.groupId)) : `<input type="hidden" name="groupId" value="${d.groupId}">`}
          ${field('Categoría', select('category', EXP_CATS.map(c => [c.v, c.label]), d.category))}
        </div>

        ${field('¿Quién ha pagado?', select('payerId', members.map(m => [m.id, `${m.emoji || '👤'} ${m.name}`]), d.payerId))}

        <div class="fld">
          <span class="fl">¿Entre quiénes se divide?</span>
          <div id="split-container">${renderSplitCheckboxes(members)}</div>
          <div id="split-calc-hint" style="margin-top:6px;font-size:12px;color:var(--muted);font-weight:600"></div>
        </div>

        ${field('Notas opcionales', `<input type="text" name="notes" placeholder="Detalles o aclaraciones..." value="${esc(d.notes)}">`)}

        <div class="form-actions">
          ${isNew ? '' : `<button type="button" class="btn danger" data-del>${icon('trash', 16)} Eliminar</button>`}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button class="btn primary" type="submit">${isNew ? 'Guardar Gasto' : 'Guardar'}</button>
        </div>
      </form>`,
      onMount(root, close) {
        const form = root.querySelector('form');
        const splitCont = root.querySelector('#split-container');
        const hint = root.querySelector('#split-calc-hint');

        function updateHint() {
          const amt = parseFloat(form.amount.value) || 0;
          if (amt > 0 && selectedSplit.length > 0) {
            const pp = (amt / selectedSplit.length).toFixed(2);
            hint.textContent = `💡 Son ${pp} € por persona (${selectedSplit.length} participantes)`;
          } else {
            hint.textContent = '';
          }
        }

        form.amount.addEventListener('input', updateHint);

        function wireSplitEvents() {
          splitCont.querySelectorAll('label').forEach(label => {
            const cb = label.querySelector('input');
            label.onclick = (e) => {
              e.preventDefault();
              cb.checked = !cb.checked;
              const mid = cb.value;
              if (cb.checked) {
                if (!selectedSplit.includes(mid)) selectedSplit.push(mid);
              } else {
                selectedSplit = selectedSplit.filter(x => x !== mid);
              }
              splitCont.innerHTML = renderSplitCheckboxes(members);
              wireSplitEvents();
              updateHint();
            };
          });

          const toggleAllBtn = root.querySelector('#toggle-all-split');
          if (toggleAllBtn) {
            toggleAllBtn.onclick = () => {
              if (selectedSplit.length === members.length) {
                selectedSplit = [members[0].id];
              } else {
                selectedSplit = members.map(m => m.id);
              }
              splitCont.innerHTML = renderSplitCheckboxes(members);
              wireSplitEvents();
              updateHint();
            };
          }
        }
        wireSplitEvents();
        updateHint();

        root.querySelector('[data-cancel]').onclick = close;
        const del = root.querySelector('[data-del]');
        if (del) {
          del.onclick = async () => {
            if (await ui.confirmBox('¿Eliminar este gasto?')) {
              store.remove('expenses', exp.id);
              close();
              done('Gasto eliminado');
            }
          };
        }

        form.onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(form);
          const amount = parseFloat(f.get('amount'));
          const title = f.get('title').trim();
          if (!amount || isNaN(amount) || amount <= 0) {
            ui.toast('Introduce un importe válido', 'error');
            return;
          }
          if (!title) {
            ui.toast('Introduce el concepto del gasto', 'error');
            return;
          }
          if (!selectedSplit.length) {
            ui.toast('Selecciona al menos una persona para dividir', 'error');
            return;
          }

          const data = {
            groupId: f.get('groupId') || currentGroup.id,
            title,
            amount,
            currency: '€',
            date: f.get('date') || dt.today(),
            payerId: f.get('payerId') || (members[0] && members[0].id),
            splitWith: selectedSplit,
            category: f.get('category') || 'food',
            notes: f.get('notes').trim()
          };

          if (isNew) {
            store.add('expenses', data);
            close();
            done('¡Gasto registrado! 💸');
          } else {
            store.update('expenses', exp.id, data);
            close();
            done('Gasto guardado');
          }
        };
      }
    });
  }

  function registerModal(onSuccess) {
    const user = store.state.user || { name: '', surname: '', email: '' };
    ui.modal({
      title: 'Bienvenido a Nosotros 💞',
      size: 'sm',
      html: `<form class="form" autocomplete="on">
        <p class="muted" style="font-size:13px;line-height:1.4">Introduce tus datos para personalizar tu experiencia.</p>
        ${field('Nombre', `<input type="text" name="name" placeholder="Tu nombre" value="${esc(user.name)}" required autofocus>`)}
        ${field('Primer Apellido', `<input type="text" name="surname" placeholder="Tu apellido" value="${esc(user.surname)}" required>`)}
        ${field('Correo Electrónico', `<input type="email" name="email" placeholder="ejemplo@correo.com" value="${esc(user.email)}" required>`)}
        <div class="form-actions" style="margin-top:12px">
          <span class="grow"></span>
          <button class="btn primary block" type="submit">Empezar ✨</button>
        </div>
      </form>`,
      onMount(root, close) {
        const form = root.querySelector('form');
        form.onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(form);
          const name = f.get('name').trim();
          const surname = f.get('surname').trim();
          const email = f.get('email').trim();
          if (!name || !surname || !email) return;

          store.state.user = { name, surname, email };
          // Sincronizar el nombre con Persona 1 para mayor coherencia
          if (store.state.settings && store.state.settings.partners && store.state.settings.partners[0]) {
            store.state.settings.partners[0].name = name;
          }
          store.save();
          close();
          ui.toast(`¡Hola, ${name}! Bienvenido/a 👋`);
          if (onSuccess) onSuccess();
          App.refresh();
        };
      }
    });
  }

  App.forms = { task, plan, planDetail, meal, reminder, group, expense, quickAdd, openEvent, registerModal };
})();
