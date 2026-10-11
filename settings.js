/* ==========================================================
   views/settings.js · ajustes: nombres, tema y copia de seguridad
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  App.views = App.views || {};
  const { store, ui } = App;
  const { esc, field, seg, icon } = ui;

  const EMOJIS = ['🦊', '🐼', '🐻', '🐱', '🐶', '🦄', '🐰', '🦁', '🐯', '🐨', '🦋', '🌸', '🌙', '⭐', '🔥', '💚'];

  function render(el) {
    const S = store.state;
    const [A, B] = S.settings.partners;
    const partner = (p, i) => `<div class="partner-row" data-p="${i}">
      ${field(i === 0 ? 'Persona 1' : 'Persona 2', `<input type="text" name="name${i}" value="${esc(p.name)}" maxlength="20">`)}
      ${field('Emoji', `<input type="text" name="emoji${i}" value="${esc(p.emoji)}" maxlength="4" style="text-align:center">`)}
      ${field('Color', `<input type="color" name="color${i}" value="${p.color}">`)}
    </div>`;

    el.innerHTML = `<div class="page">
      <div class="page-head"><div><h1>Ajustes</h1><p>Personalizad la app a vuestro gusto.</p></div></div>
      <div class="settings">
        <form class="card form" data-form>
          <h2>Mi Perfil</h2>
          <div class="row2">
            ${field('Nombre', `<input type="text" name="userName" value="${esc(S.user ? S.user.name : '')}" placeholder="Tu nombre" required>`)}
            ${field('Primer Apellido', `<input type="text" name="userSurname" value="${esc(S.user ? S.user.surname : '')}" placeholder="Tu apellido" required>`)}
          </div>
          ${field('Correo electrónico', `<input type="email" name="userEmail" value="${esc(S.user ? S.user.email : '')}" placeholder="tu@correo.com" required>`)}

          <h2 style="margin-top:10px">Pareja</h2>
          ${field('Nombre del equipo', `<input type="text" name="couple" value="${esc(S.settings.coupleName)}" maxlength="30">`)}
          ${partner(A, 0)}${partner(B, 1)}
          <div><span class="fl">Emojis rápidos (toca uno y luego la persona)</span>
            <div class="emoji-pick">${EMOJIS.map(e => `<button type="button" data-e="${e}">${e}</button>`).join('')}</div></div>
          ${field('Tema', seg('theme', [{ v: 'auto', label: '🌗 Auto' }, { v: 'light', label: '☀️ Claro' }, { v: 'dark', label: '🌙 Oscuro' }], S.settings.theme))}
          <button class="btn primary" type="submit">Guardar cambios</button>
        </form>

        <div class="card form">
          <h2>Datos</h2>
          <p class="muted">Todo se guarda en este navegador. Descarga una copia de seguridad (incluye las fotos) para no perder nada o llevarla a otro dispositivo.</p>
          <div class="set-actions">
            <button class="btn" data-export>⬇️ Exportar copia</button>
            <label class="btn" style="cursor:pointer">⬆️ Importar<input type="file" accept="application/json" hidden data-import></label>
          </div>
          <hr style="border:0;border-top:1px solid var(--line)">
          <div class="set-actions">
            <button class="btn" data-samples>✨ Añadir ejemplos</button>
            <button class="btn danger" data-reset>${icon('trash', 16)} Borrar todo</button>
          </div>
          <p class="muted" style="font-size:12px">Almacenamiento usado: ${(JSON.stringify(S).length / 1024).toFixed(0)} KB de ~5 000 KB.</p>
        </div>
      </div>
    </div>`;

    let lastInput = null;
    el.querySelectorAll('input[name^=emoji]').forEach(i => i.addEventListener('focus', () => { lastInput = i; }));
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { (lastInput || el.querySelector('input[name=emoji0]')).value = b.dataset.e; });

    el.querySelector('[data-form]').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const uName = f.get('userName').trim();
      const uSurname = f.get('userSurname').trim();
      const uEmail = f.get('userEmail').trim();
      if (uName && uSurname && uEmail) {
        S.user = { name: uName, surname: uSurname, email: uEmail };
      }
      S.settings.coupleName = f.get('couple').trim() || 'Nosotros';
      S.settings.theme = f.get('theme');
      [0, 1].forEach(i => {
        S.settings.partners[i].name = f.get('name' + i).trim() || (i ? 'Pareja' : (uName || 'Yo'));
        S.settings.partners[i].emoji = f.get('emoji' + i).trim() || '🙂';
        S.settings.partners[i].color = f.get('color' + i);
      });
      store.save(); App.applyTheme(); App.refresh(); ui.toast('Ajustes guardados ✨');
    };

    el.querySelector('[data-export]').onclick = () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `nosotros-${store.dt.today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    el.querySelector('[data-import]').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.plans) || !Array.isArray(data.meals)) throw new Error('formato');
        if (await ui.confirmBox('Esto reemplazará todos los datos actuales por los de la copia. ¿Continuar?', 'Importar')) {
          store.replace(data); App.applyTheme(); App.refresh(); ui.toast('Copia importada ✅');
        }
      } catch (err) { ui.toast('El archivo no es una copia válida', 'error'); }
      e.target.value = '';
    };
    el.querySelector('[data-samples]').onclick = () => { store.addSamples(); App.refresh(); ui.toast('Ejemplos añadidos'); };
    el.querySelector('[data-reset]').onclick = async () => {
      if (await ui.confirmBox('Se borrarán todas las tareas, planes, comidas y fotos. Esta acción no se puede deshacer.', 'Borrar todo')) {
        store.reset(); App.applyTheme(); App.refresh(); ui.toast('Datos borrados');
      }
    };
  }

  App.views.ajustes = { render };
})();
