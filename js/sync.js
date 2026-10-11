/* ==========================================================
   sync.js · Sincronización en tiempo real con Código de Pareja
   ========================================================== */
(function () {
  const App = (window.App = window.App || {});

  // Servidor público MQTT sobre WebSocket seguro (WSS) sin configuración requerida
  const MQTT_BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt'
  ];

  let client = null;
  let isConnecting = false;
  let syncTimer = null;
  let lastReceivedPayload = '';

  const sync = (App.sync = {
    connected: false,
    partnerConnected: false,
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

      if (typeof mqtt === 'undefined') {
        // Cargar biblioteca MQTT dinámicamente si no está presente
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/mqtt@5.3.5/dist/mqtt.min.js';
        script.onload = () => sync.setupClient(code);
        document.head.appendChild(script);
        return;
      }

      sync.setupClient(code);
    },

    setupClient(code) {
      if (client) {
        try { client.end(true); } catch (e) {}
      }

      const clientId = 'nosotros_' + Math.random().toString(16).substring(2, 10);
      const topic = 'nosotros_app_parejas/' + code;

      try {
        client = mqtt.connect(MQTT_BROKERS[0], {
          clientId,
          clean: true,
          connectTimeout: 8000,
          reconnectPeriod: 4000
        });

        client.on('connect', () => {
          sync.connected = true;
          sync.updateUIBadge();
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (!err) {
              // Avisar que estamos conectados y solicitar estado
              client.publish(topic, JSON.stringify({
                type: 'HELLO',
                sender: App.store.state.user ? App.store.state.user.name : 'Usuario',
                time: Date.now()
              }));
              // Enviar nuestro estado actual tras conectar
              sync.broadcast();
            }
          });
        });

        client.on('message', (t, message) => {
          try {
            const raw = message.toString();
            if (raw === lastReceivedPayload) return;
            const data = JSON.parse(raw);

            if (data.type === 'HELLO') {
              sync.partnerConnected = true;
              sync.updateUIBadge();
              App.ui && App.ui.toast(`💞 ¡Pareja conectada con el código ${code}!`);
              // Devolver nuestro estado para que el otro dispositivo lo tenga
              sync.broadcast();
              return;
            }

            if (data.type === 'SYNC_DATA' && data.payload) {
              lastReceivedPayload = raw;
              App.store.mergeRemote(data.payload, data.sender);
              sync.partnerConnected = true;
              sync.updateUIBadge();
            }
          } catch (e) {
            console.warn('Error al procesar mensaje de sync:', e);
          }
        });

        client.on('close', () => {
          sync.connected = false;
          sync.updateUIBadge();
        });

        client.on('error', (err) => {
          console.warn('MQTT sync warning:', err);
        });
      } catch (err) {
        console.warn('No se pudo inicializar sync MQTT:', err);
      }
    },

    disconnect() {
      if (client) {
        try { client.end(true); } catch (e) {}
      }
      sync.connected = false;
      sync.partnerConnected = false;
      sync.pairCode = '';
      App.store.setPairCode('');
      sync.updateUIBadge();
    },

    broadcast() {
      if (!client || !sync.connected || !sync.pairCode) return;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        try {
          const payload = {
            tasks: App.store.state.tasks,
            plans: App.store.state.plans,
            meals: App.store.state.meals,
            coupleName: App.store.state.settings.coupleName,
            partnerA: App.store.state.settings.partners[0],
            partnerB: App.store.state.settings.partners[1]
          };
          const msg = JSON.stringify({
            type: 'SYNC_DATA',
            sender: App.store.state.user ? App.store.state.user.name : 'Yo',
            time: Date.now(),
            payload
          });
          lastReceivedPayload = msg;
          client.publish('nosotros_app_parejas/' + sync.pairCode, msg, { qos: 1 });
        } catch (e) {
          console.warn('Error al emitir datos sync:', e);
        }
      }, 300);
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
