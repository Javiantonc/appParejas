/* ==========================================================
   sync.js · Sincronización en Pareja en tiempo real (Cloud Relay)
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});

  let eventSource = null;
  let pollInterval = null;
  let isSending = false;
  let lastReceivedPayload = '';

  const sync = (App.sync = {
    connected: false,
    pairCode: '',

    init() {
      const code = App.store.getPairCode();
      if (code) {
        sync.connect(code);
      }
    },

    getTopic(code) {
      // Canal único seguro normalizado
      const clean = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      return `parejas_${clean}`;
    },

    connect(code) {
      if (!code) return;
      code = code.trim().toUpperCase();
      sync.pairCode = code;
      App.store.setPairCode(code);
      sync.updateUIBadge();

      // Cerrar conexiones anteriores si las hubiera
      sync.stopListening();

      // Iniciar escucha en tiempo real (SSE + Polling backup)
      sync.startListening();

      // Descargar último estado inmediatamente
      sync.pullLatest();

      // Enviar nuestros datos para que la otra persona los reciba
      setTimeout(() => {
        sync.pushToCloud();
      }, 500);
    },

    disconnect() {
      sync.stopListening();
      sync.connected = false;
      sync.pairCode = '';
      App.store.setPairCode('');
      sync.updateUIBadge();
    },

    startListening() {
      const topic = sync.getTopic(sync.pairCode);
      if (!topic) return;

      // 1. Escucha en tiempo real instantánea con Server-Sent Events (SSE)
      try {
        if (window.EventSource) {
          eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);
          eventSource.onopen = () => {
            sync.connected = true;
            sync.updateUIBadge();
          };
          eventSource.onmessage = (event) => {
            try {
              const parsed = JSON.parse(event.data);
              if (parsed && parsed.message) {
                sync.handleIncoming(parsed.message);
              }
            } catch (err) {
              // Mensaje no JSON o keep-alive
            }
          };
          eventSource.onerror = () => {
            // Reintento automático del navegador
          };
        }
      } catch (e) {
        // Fallback a polling
      }

      // 2. Polling de respaldo cada 3 segundos
      pollInterval = setInterval(() => {
        sync.pullLatest();
      }, 3000);
    },

    stopListening() {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },

    // Subir datos actuales a la nube cuando tú o tu pareja hagáis un cambio
    async pushToCloud() {
      if (!sync.pairCode || isSending) return;
      isSending = true;

      const topic = sync.getTopic(sync.pairCode);
      const currentUserName = App.store.state.user ? App.store.state.user.name : 'Pareja';

      const payload = {
        updatedAt: Date.now(),
        sender: currentUserName,
        tasks: App.store.state.tasks,
        plans: App.store.state.plans,
        meals: App.store.state.meals,
        reminders: App.store.state.reminders || [],
        groups: App.store.state.groups || [],
        expenses: App.store.state.expenses || [],
        coupleName: App.store.state.settings.coupleName,
        partners: App.store.state.settings.partners
      };

      const payloadStr = JSON.stringify(payload);
      lastReceivedPayload = payloadStr;

      try {
        const res = await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': 'Sync',
            'Priority': 'default'
          },
          body: payloadStr
        });

        if (res.ok) {
          sync.connected = true;
          sync.updateUIBadge();
        }
      } catch (err) {
        // Red no disponible temporalmente
      } finally {
        isSending = false;
      }
    },

    // Consultar el último mensaje emitido en el canal
    async pullLatest() {
      if (!sync.pairCode) return;
      const topic = sync.getTopic(sync.pairCode);

      try {
        const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
        if (res.ok) {
          sync.connected = true;
          sync.updateUIBadge();
          const text = await res.text();
          const lines = text.trim().split('\n');
          // Tomar el mensaje más reciente
          for (let i = lines.length - 1; i >= 0; i--) {
            if (!lines[i]) continue;
            try {
              const entry = JSON.parse(lines[i]);
              if (entry.message) {
                const handled = sync.handleIncoming(entry.message);
                if (handled) break;
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        // Sin conexión
      }
    },

    handleIncoming(messageStr) {
      if (!messageStr || messageStr === lastReceivedPayload) return false;

      try {
        const data = JSON.parse(messageStr);
        if (!data || !data.updatedAt) return false;

        const currentUserName = App.store.state.user ? App.store.state.user.name : '';
        // Si el mensaje es de la otra persona, o si nosotros no tenemos datos aún
        if (data.sender !== currentUserName || !App.store.state.tasks.length) {
          lastReceivedPayload = messageStr;
          App.store.mergeRemote(data, data.sender || 'tu pareja');
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
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
