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

        <div class="card sync-card">
          <div class="sync-header">
            <div>
              <h2>💞 Conexión en Pareja</h2>
              <p class="muted">Conecta tu móvil con el de tu pareja para ver y añadir cosas juntos en tiempo real.</p>
            </div>
            <span id="sync-status-badge" class="sync-pill ${App.sync && App.sync.connected ? 'on' : (App.sync && App.sync.pairCode ? 'wait' : 'off')}">
              ${App.sync && App.sync.connected ? `🟢 Conectado (${App.sync.pairCode})` : (App.sync && App.sync.pairCode ? `🟡 Conectando (${App.sync.pairCode})...` : '⚪ Sin vincular')}
            </span>
          </div>

          ${S.settings.pairCode ? `
            <div class="pair-code-box">
              <div style="flex:1">
                <span class="fl" style="font-size:12px">Vuestro Código de Pareja:</span>
                <div class="pair-code-text" id="display-pair-code">${esc(S.settings.pairCode)}</div>
              </div>
              <button class="btn" type="button" id="btn-copy-code">${icon('share', 16)} Copiar</button>
            </div>
            <p class="muted" style="font-size:13px">Dile a tu pareja que ponga este mismo código en su aplicación para estar sincronizados.</p>
            <div class="pair-actions" style="margin-top:10px">
              <button class="btn" type="button" id="btn-sync-now">🔄 Sincronizar ahora</button>
              <button class="btn danger" type="button" id="btn-unlink-code">Desvincular</button>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px">
              <button class="btn primary" type="button" id="btn-generate-code">✨ Generar mi Código de Pareja</button>
              <div style="text-align:center;font-size:12px;color:var(--muted);font-weight:600">O SI TU PAREJA YA TIENE UN CÓDIGO</div>
              <div style="display:flex;gap:8px">
                <input type="text" id="input-pair-code" placeholder="Ej: AMOR-8492" maxlength="12" style="text-transform:uppercase;font-weight:700;letter-spacing:0.05em">
                <button class="btn" type="button" id="btn-join-code">Unirme</button>
              </div>
            </div>
          `}
        </div>

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

    // Botones de Sincronización en Pareja
    const btnGen = el.querySelector('#btn-generate-code');
    if (btnGen) {
      btnGen.onclick = () => {
        const words = ['AMOR', 'VIDA', 'CORAZON', 'SOL', 'LUNA', 'JUNTOS', 'PAREJA'];
        const word = words[Math.floor(Math.random() * words.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        const code = `${word}-${num}`;
        store.setPairCode(code);
        App.sync && App.sync.connect(code);
        App.refresh();
        ui.toast(`¡Código creado: ${code}! Compártelo con tu pareja 💞`);
      };
    }

    const btnJoin = el.querySelector('#btn-join-code');
    if (btnJoin) {
      btnJoin.onclick = () => {
        const inp = el.querySelector('#input-pair-code');
        const code = (inp ? inp.value : '').trim().toUpperCase();
        if (!code || code.length < 4) {
          ui.toast('Introduce un código de pareja válido.', 'error');
          return;
        }
        store.setPairCode(code);
        App.sync && App.sync.connect(code);
        App.refresh();
        ui.toast(`¡Conectado al código ${code}! Esperando sincronización... ✨`);
      };
    }

    const btnCopy = el.querySelector('#btn-copy-code');
    if (btnCopy) {
      btnCopy.onclick = async () => {
        const code = S.settings.pairCode;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(code);
          ui.toast('¡Código copiado al portapapeles! 📋');
        } else {
          ui.toast(`Código: ${code}`);
        }
      };
    }

    const btnSyncNow = el.querySelector('#btn-sync-now');
    if (btnSyncNow) {
      btnSyncNow.onclick = () => {
        if (App.sync) {
          App.sync.broadcast();
          ui.toast('Datos enviados a tu pareja 🚀');
        }
      };
    }

    const btnUnlink = el.querySelector('#btn-unlink-code');
    if (btnUnlink) {
      btnUnlink.onclick = async () => {
        if (await ui.confirmBox('¿Desvincular este dispositivo de tu pareja? Los datos actuales se mantendrán en tu teléfono.', 'Desvincular')) {
          App.sync && App.sync.disconnect();
          store.setPairCode('');
          App.refresh();
          ui.toast('Dispositivo desvinculado.');
        }
      };
    }

    // Cambiar tema de inmediato al pulsar cualquiera de los botones (Auto, Claro, Oscuro)
    el.querySelectorAll('input[name=theme]').forEach(r => {
      const applySelectedTheme = () => {
        S.settings.theme = r.value;
        store.save();
        App.applyTheme();
        App.refresh();
      };
      r.addEventListener('change', applySelectedTheme);
      r.addEventListener('click', applySelectedTheme);
      const label = r.closest('label');
      if (label) {
        label.addEventListener('click', () => {
          setTimeout(applySelectedTheme, 10);
        });
      }
    });

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
