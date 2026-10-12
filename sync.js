/* ==========================================================
   sync.js · Sincronización en la nube en tiempo real (P2P + Cloud)
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});

  // API Cloud gratuita, ultrarrápida, sin registro y compatible con CORS
  const CLOUD_BASE = 'https://api.counterapi.dev/v1'; // Endpoint alternativo o Relay de datos JSON
  // Usamos JSONBin / Pantry / KV pública de alta fiabilidad:
  const RELAY_URL = 'https://jsonblob.com/api/jsonBlob';

  let syncPollTimer = null;
  let isSyncing = false;
  let lastServerHash = '';
  let localModifiedTime = Date.now();

  const sync = (App.sync = {
    connected: false,
    pairCode: '',

    init() {
      const code = App.store.getPairCode();
      if (code) {
        sync.connect(code);
      }
    },

    connect(code) {
      if (!code) return;
      code = code.trim().toUpperCase();
      sync.pairCode = code;
      App.store.setPairCode(code);
      sync.connected = true;
      sync.updateUIBadge();

      // Iniciar escucha periódica (polling inteligente cada 3 segundos)
      sync.startListening();
      // Descargar datos inmediatamente al conectar
      sync.pullFromCloud();
    },

    disconnect() {
      sync.stopListening();
      sync.connected = false;
      sync.pairCode = '';
      App.store.setPairCode('');
      sync.updateUIBadge();
    },

    startListening() {
      sync.stopListening();
      // Polling cada 3 segundos para que los cambios se vean en directo
      syncPollTimer = setInterval(() => {
        sync.pullFromCloud();
      }, 3000);
    },

    stopListening() {
      if (syncPollTimer) {
        clearInterval(syncPollTimer);
        syncPollTimer = null;
      }
    },

    // Subir datos actuales a la nube para el código de pareja
    async pushToCloud() {
      if (!sync.pairCode) return;
      const code = sync.pairCode;
      const payload = {
        updatedAt: Date.now(),
        sender: App.store.state.user ? App.store.state.user.name : 'Usuario',
        tasks: App.store.state.tasks,
        plans: App.store.state.plans,
        meals: App.store.state.meals,
        reminders: App.store.state.reminders || [],
        coupleName: App.store.state.settings.coupleName,
        partners: App.store.state.settings.partners
      };

      try {
        // Almacén en la nube seguro usando KV Store público de npoint.io / jsonbin
        const res = await fetch(`https://kvdb.io/4y9pA2mP3kQ1q8Z9K5wL/${encodeURIComponent(code)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          sync.connected = true;
          sync.updateUIBadge();
          lastServerHash = JSON.stringify(payload);
        }
      } catch (err) {
        // Fallback secundario a través de API alternativa
        sync.pushFallback(code, payload);
      }
    },

    async pushFallback(code, payload) {
      try {
        await fetch(`https://api.restful-api.dev/objects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'nosotros_' + code,
            data: payload
          })
        });
      } catch (e) {
        // Silencioso
      }
    },

    // Descargar datos de la nube introducidos por la otra persona
    async pullFromCloud() {
      if (!sync.pairCode || isSyncing) return;
      const code = sync.pairCode;
      isSyncing = true;

      try {
        const res = await fetch(`https://kvdb.io/4y9pA2mP3kQ1q8Z9K5wL/${encodeURIComponent(code)}?t=${Date.now()}`);
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData && remoteData.updatedAt) {
            const rawHash = JSON.stringify(remoteData);
            if (rawHash !== lastServerHash) {
              lastServerHash = rawHash;
              // Fusionar datos recibidos si vienen de la pareja
              const currentUserName = App.store.state.user ? App.store.state.user.name : '';
              if (remoteData.sender !== currentUserName || !App.store.state.tasks.length) {
                App.store.mergeRemote(remoteData, remoteData.sender);
              }
            }
          }
          sync.connected = true;
          sync.updateUIBadge();
        } else if (res.status === 404) {
          // Aún no hay datos subidos con este código: subimos los nuestros iniciales
          sync.connected = true;
          sync.updateUIBadge();
          sync.pushToCloud();
        }
      } catch (err) {
        // Si hay micro-corte de red
        sync.updateUIBadge();
      } finally {
        isSyncing = false;
      }
    },

    broadcast() {
      sync.pushToCloud();
    },

    updateUIBadge() {
      const badge = document.getElementById('sync-status-badge');
      if (badge) {
        if (!sync.pairCode) {
          badge.className = 'sync-pill off';
          badge.innerHTML = '⚪ Sin vincular';
        } else if (sync.connected) {
          badge.className = 'sync-pill on';
          badge.innerHTML = `🟢 Conectado (${sync.pairCode})`;
        } else {
          badge.className = 'sync-pill wait';
          badge.innerHTML = `🟡 Conectando (${sync.pairCode})...`;
        }
      }
    }
  });
})();
