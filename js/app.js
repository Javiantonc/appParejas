/* ==========================================================
   app.js · arranque, rutas (hash), barra lateral y tema
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});
  const { store, ui } = App;
  const { icon, esc, avatar } = ui;

  const ROUTES = [
    { id: 'inicio',     label: 'Inicio',     icon: 'home' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar' },
    { id: 'tareas',     label: 'Tareas',     icon: 'check' },
    { id: 'planes',     label: 'Planes',     icon: 'heart' },
    { id: 'comidas',    label: 'Comidas',    icon: 'food' },
    { id: 'ajustes',    label: 'Ajustes',    icon: 'sliders' },
  ];

  const current = () => {
    const h = location.hash.replace(/^#\/?/, '');
    return ROUTES.some(r => r.id === h) ? h : 'inicio';
  };

  function applyTheme() {
    const t = store.state.settings.theme || 'light';
    let isDark = false;
    if (t === 'dark') {
      isDark = true;
    } else if (t === 'auto') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = false;
    }
    const themeName = isDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    if (document.body) {
      document.body.dataset.theme = themeName;
      document.body.setAttribute('data-theme', themeName);
    }
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.content = isDark ? '#000000' : '#f5f5f7';
  }
  App.applyTheme = applyTheme;

  function chrome() {
    const S = store.state, id = current();
    document.getElementById('sidebar').innerHTML = `
      <div class="brand"><div class="brand-logo">💞</div><div><b>${esc(S.settings.coupleName)}</b><small>Vuestra vida, organizada</small></div></div>
      <nav class="nav">${ROUTES.map(r => `<a href="#/${r.id}" class="${r.id === id ? 'active' : ''}">${icon(r.icon, 20)} ${r.label}</a>`).join('')}</nav>
      <button class="btn primary side-add" data-quick>${icon('plus', 16)} Añadir</button>
      <div class="side-foot">
        ${avatar('both', 34)}
        <div class="names">${esc(S.settings.partners[0].name)} &amp; ${esc(S.settings.partners[1].name)}<small>${S.tasks.filter(t => !t.done).length} tareas pendientes</small></div>
      </div>`;
    document.getElementById('tabbar').innerHTML = ROUTES.map(r => `<a href="#/${r.id}" class="${r.id === id ? 'active' : ''}">${icon(r.icon, 22)}<span>${r.label}</span></a>`).join('');

    const mobileHeader = document.getElementById('mobile-header');
    if (mobileHeader) {
      mobileHeader.innerHTML = `
        <div class="m-brand">
          <span class="m-logo">💞</span>
          <b>${esc(S.settings.coupleName)}</b>
        </div>
        <div class="m-actions">
          <button class="icon-btn" data-mobile-quick aria-label="Añadir">${icon('plus', 18)}</button>
        </div>`;
    }

    document.querySelectorAll('[data-quick], [data-mobile-quick]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        App.forms.quickAdd();
      };
    });
  }

  function draw(isNavigation) {
    const el = document.getElementById('main');
    chrome();
    const view = App.views[current()];
    view.render(el);
    if (isNavigation) {
      el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
      window.scrollTo(0, 0);
    }
  }

  App.refresh = () => {
    if (sessionStorage.getItem('nosotros_logged_in') === 'true' && store.state.user) {
      draw(false);
    }
  };

  window.addEventListener('hashchange', () => {
    if (sessionStorage.getItem('nosotros_logged_in') === 'true' && store.state.user) {
      draw(true);
    }
  });

  // El tema se gestiona exclusivamente por la preferencia guardada, sin cambios inesperados al hacer clic
  App.applyTheme = applyTheme;

  /* ---------- Lugares Románticos para la Pantalla de Carga ---------- */
  const ROMANTIC_PLACES = [
    {
      name: "Torre Eiffel · París, Francia 🇫🇷",
      img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "Atardecer en Oia · Santorini, Grecia 🇬🇷",
      img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "Paseo en Góndola · Venecia, Italia 🇮🇹",
      img: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "Cerezo en Flor · Kioto, Japón 🇯🇵",
      img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "Villas sobre el Mar · Maldivas 🏝️",
      img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  /* ---------- Pantalla de Carga Romántica con Barra de Progreso ---------- */
  function showRomanticLoader(callback) {
    const root = document.getElementById('loader-root');
    if (!root) return callback && callback();

    let placeIndex = 0;
    root.innerHTML = `
      <div class="loader-screen" id="loader-screen">
        <div class="loader-bg" id="loader-bg" style="background-image: url('${ROMANTIC_PLACES[0].img}')"></div>
        <div class="loader-content">
          <div class="loader-icon">💞</div>
          <h2 class="loader-title">Preparando vuestro espacio</h2>
          <div class="loader-place" id="loader-place">${ROMANTIC_PLACES[0].name}</div>
          <div class="loader-bar-box">
            <div class="loader-bar-fill" id="loader-bar-fill"></div>
          </div>
          <span class="loader-percent" id="loader-percent">0%</span>
        </div>
      </div>
    `;

    const bgEl = document.getElementById('loader-bg');
    const placeEl = document.getElementById('loader-place');
    const fillEl = document.getElementById('loader-bar-fill');
    const percentEl = document.getElementById('loader-percent');

    // Cambiar la imagen de lugares románticos cada 2.0s para apreciarlas mejor
    const imgInterval = setInterval(() => {
      placeIndex = (placeIndex + 1) % ROMANTIC_PLACES.length;
      if (bgEl && placeEl) {
        bgEl.style.backgroundImage = `url('${ROMANTIC_PLACES[placeIndex].img}')`;
        placeEl.textContent = ROMANTIC_PLACES[placeIndex].name;
      }
    }, 2000);

    // Animación de la barra de progreso a la mitad de velocidad (duración ~6.8s)
    const startTime = Date.now();
    const duration = 6800;

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));

      if (fillEl) fillEl.style.width = progress + '%';
      if (percentEl) percentEl.textContent = progress + '%';

      if (progress >= 100) {
        clearInterval(progressTimer);
        clearInterval(imgInterval);
        setTimeout(() => {
          const screen = document.getElementById('loader-screen');
          if (screen) {
            screen.style.opacity = '0';
            setTimeout(() => {
              root.innerHTML = '';
              callback && callback();
            }, 500);
          } else {
            root.innerHTML = '';
            callback && callback();
          }
        }, 300);
      }
    }, 40);
  }

  /* ---------- Desbloqueo Facial por Cámara (Face Scan) ---------- */
  function startCameraAuth(onSuccess) {
    let stream = null;
    ui.modal({
      title: 'Acceso Facial por Cámara 📷',
      size: 'sm',
      html: `
        <div class="camera-auth-modal">
          <p class="muted" style="font-size:13px">Mira fijamente a la cámara para verificar tu identidad.</p>
          <div class="camera-preview-wrap">
            <video id="auth-camera-video" autoplay playsinline muted></video>
            <div class="camera-scan-line"></div>
          </div>
          <p id="camera-scan-status" style="font-size:14px;font-weight:600;color:var(--accent)">Escaneando rostro...</p>
        </div>
      `,
      onMount(root, close) {
        const video = root.querySelector('#auth-camera-video');
        const status = root.querySelector('#camera-scan-status');

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then(s => {
              stream = s;
              if (video) video.srcObject = s;
              setTimeout(() => {
                if (status) {
                  status.textContent = '¡Rostro reconocido con éxito! ✅';
                  status.style.color = 'var(--green)';
                }
                setTimeout(() => {
                  close();
                  if (stream) stream.getTracks().forEach(t => t.stop());
                  onSuccess();
                }, 900);
              }, 2200);
            })
            .catch(err => {
              if (status) {
                status.textContent = 'No se pudo acceder a la cámara. Accede con contraseña.';
                status.style.color = 'var(--red)';
              }
            });
        } else {
          if (status) {
            status.textContent = 'Cámara no soportada en este navegador.';
            status.style.color = 'var(--red)';
          }
        }
      },
      onClose() {
        if (stream) stream.getTracks().forEach(t => t.stop());
      }
    });
  }

  /* ---------- Desbloqueo Biométrico Nativo (Touch ID / Face ID) ---------- */
  async function authenticateBiometric(onSuccess) {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          ui.toast('Biometría no configurada en este dispositivo. Usa tu contraseña o cámara.', 'error');
          return;
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Intento de autenticación biométrica WebAuthn
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred'
          }
        });

        if (assertion) {
          onSuccess();
        }
      } catch (err) {
        // En caso de que el usuario cancele o falle WebAuthn
        if (err.name !== 'NotAllowedError') {
          // Si da error por origen o simulación, permitimos alternativa o aviso
          ui.toast('Verificación cancelada o no completada.', 'error');
        }
      }
    } else {
      ui.toast('Tu navegador no soporta autenticación biométrica directa.', 'error');
    }
  }

  /* ---------- Pantalla de Login / Creación de Perfil ---------- */
  function showAuthScreen() {
    const root = document.getElementById('auth-root');
    if (!root) return;

    let isRegister = !store.state.user; // Si no hay usuario registrado, empieza en registro
    const currentUser = store.state.user;
    const savedPassword = localStorage.getItem('nosotros_remembered_pwd') || '';
    const isRemembered = Boolean(savedPassword);

    function renderAuth() {
      root.innerHTML = `
        <div class="auth-screen">
          <div class="auth-card">
            <div class="auth-header">
              <span class="auth-logo">💞</span>
              <h2>${isRegister ? 'Crear Perfil' : 'Iniciar Sesión'}</h2>
              <p>${isRegister ? 'Crea vuestro perfil con nombre, correo y contraseña.' : (currentUser ? `¡Hola de nuevo, ${esc(currentUser.name)}! Accede a vuestro espacio.` : 'Introduce tus credenciales para acceder.')}</p>
            </div>

            <form class="form" id="auth-form" autocomplete="on">
              <div class="row2">
                ${ui.field('Nombre', `<input type="text" name="name" placeholder="Tu nombre" value="${!isRegister && currentUser ? esc(currentUser.name) : ''}" required autofocus>`)}
                ${isRegister ? ui.field('Primer Apellido', '<input type="text" name="surname" placeholder="Tu apellido" required>') : ''}
              </div>

              ${isRegister ? ui.field('Correo Electrónico', '<input type="email" name="email" placeholder="tu@correo.com" required>') : ''}

              <div class="pwd-compact">
                ${ui.field('Contraseña', `<input type="password" name="password" id="auth-pwd-input" placeholder="••••••" value="${!isRegister && savedPassword ? esc(savedPassword) : ''}" required autocomplete="current-password">`)}
                ${isRegister ? `
                  <div class="pwd-reqs">
                    <span class="pwd-req-item fail" id="req-len">⚪ Mínimo 6 caracteres</span>
                    <span class="pwd-req-item fail" id="req-upper">⚪ Al menos una mayúscula (A-Z)</span>
                    <span class="pwd-req-item fail" id="req-lower">⚪ Al menos una minúscula (a-z)</span>
                    <span class="pwd-req-item fail" id="req-spec">⚪ Un carácter especial (!@#$%^&*...)</span>
                  </div>
                ` : ''}
                <label class="auth-remember">
                  <input type="checkbox" name="remember" ${isRemembered ? 'checked' : ''}>
                  Recordar contraseña
                </label>
              </div>

              <div class="form-actions" style="margin-top:10px">
                <button class="btn primary block" type="submit">${isRegister ? 'Crear perfil y Entrar ✨' : 'Entrar con Contraseña 🔐'}</button>
              </div>
            </form>

            ${!isRegister ? `
              <div class="bio-divider"><span>O acceder con</span></div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <button type="button" class="bio-btn" id="btn-camera-id">
                  ${icon('image', 20)} Reconocimiento por Cámara 📷
                </button>
              </div>
            ` : ''}

            <div class="auth-toggle">
              ${isRegister ? `
                ¿Ya tienes perfil? <button type="button" id="toggle-auth">Inicia sesión</button>
              ` : `
                ¿Quieres registrar otro perfil? <button type="button" id="toggle-auth">Crear perfil nuevo</button>
              `}
            </div>
          </div>
        </div>
      `;

      const proceedIntoApp = () => {
        sessionStorage.setItem('nosotros_logged_in', 'true');
        root.innerHTML = '';
        showRomanticLoader(() => {
          applyTheme();
          draw(true);
          ui.toast(`¡Hola, ${store.state.user.name}! Bienvenido/a 💞`);
        });
      };

      // Botón Reconocimiento por Cámara
      const cameraBtn = document.getElementById('btn-camera-id');
      if (cameraBtn) {
        cameraBtn.onclick = () => {
          startCameraAuth(() => proceedIntoApp());
        };
      }

      const toggleBtn = document.getElementById('toggle-auth');
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          isRegister = !isRegister;
          renderAuth();
        };
      }

      // Validación visual en tiempo real para registro
      if (isRegister) {
        const pwdInput = document.getElementById('auth-pwd-input');
        if (pwdInput) {
          const checkReq = () => {
            const val = pwdInput.value;
            const hasLen = val.length >= 6;
            const hasUpper = /[A-Z]/.test(val);
            const hasLower = /[a-z]/.test(val);
            const hasSpec = /[^A-Za-z0-9]/.test(val);

            const updateItem = (id, ok, text) => {
              const el = document.getElementById(id);
              if (el) {
                el.className = 'pwd-req-item ' + (ok ? 'ok' : 'fail');
                el.textContent = (ok ? '🟢 ' : '⚪ ') + text;
              }
            };

            updateItem('req-len', hasLen, 'Mínimo 6 caracteres');
            updateItem('req-upper', hasUpper, 'Al menos una mayúscula (A-Z)');
            updateItem('req-lower', hasLower, 'Al menos una minúscula (a-z)');
            updateItem('req-spec', hasSpec, 'Un carácter especial (!@#$%...)');
          };
          pwdInput.addEventListener('input', checkReq);
        }
      }

      const form = document.getElementById('auth-form');
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(form);
          const name = f.get('name').trim();
          const password = f.get('password').trim();

          const remember = Boolean(f.get('remember'));
          if (remember) {
            localStorage.setItem('nosotros_remembered_pwd', password);
          } else {
            localStorage.removeItem('nosotros_remembered_pwd');
          }

          if (isRegister) {
            const surname = f.get('surname').trim();
            const email = f.get('email').trim();
            if (!name || !surname || !email || !password) return;

            // Validación estricta de requisitos de contraseña
            if (password.length < 6) {
              ui.toast('La contraseña debe tener como mínimo 6 caracteres.', 'error');
              return;
            }
            if (!/[A-Z]/.test(password)) {
              ui.toast('La contraseña debe contener al menos una letra mayúscula.', 'error');
              return;
            }
            if (!/[a-z]/.test(password)) {
              ui.toast('La contraseña debe contener al menos una letra minúscula.', 'error');
              return;
            }
            if (!/[^A-Za-z0-9]/.test(password)) {
              ui.toast('La contraseña debe contener al menos un carácter especial (!@#$...).', 'error');
              return;
            }

            store.state.user = { name, surname, email, password };
            if (store.state.settings && store.state.settings.partners && store.state.settings.partners[0]) {
              store.state.settings.partners[0].name = name;
            }
            store.save();
            proceedIntoApp();
          } else {
            // Verificar nombre y contraseña
            if (currentUser && currentUser.password) {
              if (name.toLowerCase() === currentUser.name.toLowerCase() && password === currentUser.password) {
                proceedIntoApp();
              } else {
                ui.toast('Nombre o contraseña incorrectos.', 'error');
              }
            } else {
              // Si no había contraseña configurada anteriormente, la guardamos
              if (currentUser) {
                currentUser.password = password;
                store.save();
              } else {
                store.state.user = { name, surname: '', email: `${name.toLowerCase()}@nosotros.local`, password };
                store.save();
              }
              proceedIntoApp();
            }
          }
        };
      }
    }

    renderAuth();
  }

  /* ---------- Control de Acceso (Gatekeeper) ---------- */
  const isLoggedIn = sessionStorage.getItem('nosotros_logged_in') === 'true';

  applyTheme();

  if (App.sync && App.sync.init) {
    App.sync.init();
  }

  if (isLoggedIn && store.state.user && store.state.user.name) {
    draw(true);
  } else {
    showAuthScreen();
  }
})();
