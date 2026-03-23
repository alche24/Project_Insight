<template>
  <div class="market-indicators shield-panel">
    <div class="panel-header">
      <h3>FINANCIAL TELEMETRY</h3>
      <div class="scan-line"></div>
    </div>
    
    <div class="market-content" v-if="marketData">
      <div class="index-box">
        <div class="label">JKSE / IHSG (JAKARTA)</div>
        <div class="value-row" :class="marketData.jkse.change >= 0 ? 'text-glow-green' : 'text-alert'">
          <span class="value">{{ marketData.jkse.value.toFixed(2) }}</span>
          <span class="change">
            {{ marketData.jkse.change >= 0 ? '+' : '' }}{{ marketData.jkse.change.toFixed(2) }} 
            ({{ marketData.jkse.percent.toFixed(2) }}%)
          </span>
        </div>
      </div>

      <div class="currency-grid">
        <div class="forex-header">IDR FOREX EXCHANGE</div>
        <div class="currency-item" v-for="(rate, currency) in marketData.rates" :key="currency">
          <span class="pair">1 {{ currency }}</span>
          <span class="rate">{{ formatCurrency(rate) }} IDR</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { economicService } from '../services/economicService';

const marketData = ref(null);
let unsubscribe = null;

onMounted(() => {
  economicService.startPolling(5); // poll every 5 minutes
  unsubscribe = economicService.subscribe(data => {
    marketData.value = data;
  });
});

onUnmounted(() => {
  economicService.stopPolling();
  if (unsubscribe) unsubscribe();
});

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};
</script>

<style scoped>
.market-indicators {
  display: flex;
  flex-direction: column;
  padding: 15px;
  position: relative;
}

.panel-header {
  border-bottom: 1px solid var(--shield-blue-dim);
  padding-bottom: 5px;
  margin-bottom: 10px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
}

.index-box {
  background: rgba(0, 240, 255, 0.03);
  border: 1px solid var(--shield-blue-dim);
  padding: 10px;
  margin-bottom: 15px;
  text-align: right;
}

.index-box .label {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--shield-text-dim);
  text-align: left;
}

.value-row {
  display: flex;
  justify-content: space-between;
  align-items: bottom;
  margin-top: 5px;
}

.value-row .value {
  font-size: 2rem;
  font-weight: bold;
}

.value-row .change {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  align-self: flex-end;
  padding-bottom: 4px;
}

.text-glow-green {
  color: #00ff00;
  text-shadow: 0 0 8px #00ff00;
}

.text-alert {
  color: var(--shield-alert);
  text-shadow: 0 0 8px var(--shield-alert);
}

.currency-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forex-header {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--shield-blue);
  border-bottom: 1px dashed var(--shield-blue-dim);
  padding-bottom: 3px;
  margin-bottom: 5px;
}

.currency-item {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 8px;
  border-left: 2px solid var(--shield-blue-dim);
}

.currency-item:hover {
  border-left-color: var(--shield-blue);
  background: rgba(0, 240, 255, 0.1);
}

.currency-item .pair {
  color: var(--shield-text-dim);
  font-weight: bold;
}

.currency-item .rate {
  color: var(--shield-text);
  letter-spacing: 1px;
}
</style>
