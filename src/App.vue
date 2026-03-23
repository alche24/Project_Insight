<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <div class="brand">
        <h1>S.H.I.E.L.D. // OSINT.DIRECTIVE</h1>
        <div class="subtitle">REGIONAL MONITOR: INDONESIA - SECURE CONNECTION <span class="blinking-dot">●</span></div>
      </div>
      <div class="system-status text-glow">
        NETWORK: <span class="status-ok">NOMINAL</span> | 
        THREAT LEVEL: <span class="status-warn">ELEVATED</span> |
        LAST SYNC: {{ lastSyncTime }}
      </div>
    </header>

    <main class="dashboard-content">
      <aside class="left-panel">
        <NewsFeed :events="events" />
      </aside>
      <section class="center-panel">
        <AiSummaryView :events="events" />
      </section>
      <aside class="right-panel">
        <div class="shield-panel metrics-panel">
          <h3>INTELLIGENCE SUMMARY</h3>
          <div class="metric">
            <span class="label">ACTIVE ALERTS</span>
            <span class="value text-alert">{{ events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length }}</span>
          </div>
          <div class="metric">
            <span class="label">ANALYZED EVENTS</span>
            <span class="value text-glow">{{ events.length }}</span>
          </div>
          <div class="metric">
            <span class="label">REFRESH CYCLE</span>
            <span class="value">10:00 MIN</span>
          </div>
          <div class="system-logs">
            <div v-for="log in sysLogs" :key="log.id" class="log-entry">
              > {{ log.time }} - {{ log.msg }}
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import NewsFeed from './components/NewsFeed.vue';
import AiSummaryView from './components/AiSummaryView.vue';
import { osintService } from './services/osintService';

const events = ref([]);
const lastSyncTime = ref('');
const sysLogs = ref([]);
let unsubscribe = null;

const updateTime = () => {
  const now = new Date();
  lastSyncTime.value = now.toLocaleTimeString('en-US', { hour12: false });
};

onMounted(() => {
  // Start the 10 minute polling
  osintService.startPolling(10);
  
  unsubscribe = osintService.subscribe((newData) => {
    events.value = newData;
    updateTime();
    
    // Add to sys logs
    sysLogs.value.unshift({
      id: Date.now(),
      time: lastSyncTime.value,
      msg: 'UPLINK SYNC SUCCESS - DATA REFRESHED'
    });
    if (sysLogs.value.length > 5) sysLogs.value.pop();
  });

  // initial time
  setInterval(updateTime, 1000);
});

onUnmounted(() => {
  osintService.stopPolling();
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px 20px;
  border-bottom: 2px solid var(--shield-blue);
  margin-bottom: 15px;
  background: linear-gradient(90deg, var(--shield-blue-dim), transparent);
}

.brand h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--shield-blue);
}

.brand .subtitle {
  font-size: 0.9rem;
  font-family: var(--font-mono);
  color: var(--shield-text-dim);
  letter-spacing: 1px;
}

.blinking-dot {
  color: var(--shield-alert);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; text-shadow: 0 0 8px var(--shield-alert); }
  50% { opacity: 0.3; text-shadow: none; }
}

.system-status {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.status-ok { color: #00ff00; text-shadow: 0 0 5px #00ff00; }
.status-warn { color: var(--shield-alert); text-shadow: 0 0 5px var(--shield-alert); }

.dashboard-content {
  display: flex;
  gap: 15px;
  flex: 1;
  overflow: hidden;
}

.left-panel, .right-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.globe-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0; /* remove default padding for full globe */
}

.panel-header {
  padding: 10px 20px;
  border-bottom: 1px solid var(--shield-blue-dim);
  z-index: 10;
  position: absolute;
  top: 0; left: 0; right: 0;
  background: rgba(10, 14, 23, 0.7);
}

.metrics-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metric {
  display: flex;
  flex-direction: column;
  border-left: 2px solid var(--shield-blue);
  padding-left: 10px;
}

.metric .label {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--shield-text-dim);
}

.metric .value {
  font-size: 2rem;
  font-weight: bold;
}

.system-logs {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--shield-text-dim);
  border-top: 1px solid var(--shield-blue-dim);
  padding-top: 10px;
}

.log-entry {
  margin-bottom: 5px;
}
</style>
