<template>
  <div class="news-feed shield-panel">
    <div class="feed-header">
      <h3>LIVE INTEL UPLINK</h3>
      <div class="pulse-indicator"></div>
    </div>
    <div class="feed-content">
      <transition-group name="list" tag="div">
        <a 
          v-for="event in events" 
          :key="event.id"
          :href="event.url"
          target="_blank"
          rel="noopener noreferrer"
          class="intel-item intel-link"
          :class="{ 'alert-critical': event.severity === 'CRITICAL', 'alert-high': event.severity === 'HIGH' }"
        >
          <div class="item-meta">
            <span class="category">[{{ event.category }}]</span>
            <span class="time">{{ formatWIB(event.time) }}</span>
          </div>
          <div class="item-title">{{ event.title }}</div>
          <div class="item-location">LOC: {{ event.location }}</div>
          <div class="item-impact">> {{ event.impact }}</div>
        </a>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
defineProps({
  events: {
    type: Array,
    required: true
  }
});

const formatWIB = (timestamp) => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }) + ' WIB';
};
</script>

<style scoped>
.news-feed {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  max-height: 80vh; /* Prevents infinite growth on zoom */
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--shield-blue-dim);
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.pulse-indicator {
  width: 10px;
  height: 10px;
  background-color: var(--shield-blue);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 240, 255, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 240, 255, 0); }
}

.feed-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-right: 5px;
  padding-bottom: 20px;
}

.intel-item {
  border-left: 2px solid var(--shield-blue-dim);
  padding: 10px 15px;
  background: rgba(0, 240, 255, 0.02);
  transition: all 0.3s ease;
  position: relative;
}

.intel-link {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.intel-item::before {
  content: '>';
  position: absolute;
  left: -2px;
  top: 10px;
  background: var(--shield-bg);
  color: var(--shield-blue);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1;
  transform: translateX(-50%);
}

.intel-item:hover {
  background: rgba(0, 240, 255, 0.05);
  border-left-color: var(--shield-blue);
}

.alert-critical {
  border-left-color: var(--shield-alert);
  background: var(--shield-alert-dim);
}

.alert-critical::before {
  color: var(--shield-alert);
}

.alert-critical .item-title {
  color: var(--shield-alert);
  text-shadow: 0 0 5px var(--shield-alert);
}

.alert-high {
  border-left-color: #ff9900;
  background: rgba(255, 153, 0, 0.1);
}

.alert-high::before {
  color: #ff9900;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--shield-text-dim);
  margin-bottom: 5px;
}

.item-title {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 5px;
  line-height: 1.2;
}

.item-location {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--shield-blue);
  margin-bottom: 5px;
}

.item-impact {
  font-size: 0.85rem;
  opacity: 0.8;
  font-style: italic;
}

/* Vue Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
