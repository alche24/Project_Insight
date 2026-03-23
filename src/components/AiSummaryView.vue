<template>
  <div class="ai-summary-wrapper">
    <div class="terminal-header">
      <span class="blinking-cursor">_</span>
      <span> O.R.A.C.L.E. // ANALYSIS ENGINE v4.2</span>
    </div>
    <div class="terminal-body" ref="terminalBody">
      <div v-for="(line, index) in displayedLines" :key="index" class="terminal-line" :class="line.type">
        <span v-if="line.type === 'system'">> </span>
        <span v-else-if="line.type === 'bullet'">- </span>
        <span v-html="line.text"></span>
      </div>
      <div v-if="isTyping" class="terminal-line system">
        > <span class="blinking-cursor">█</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  events: { type: Array, required: true }
});

const displayedLines = ref([]);
const isTyping = ref(false);
const terminalBody = ref(null);

watch(() => props.events, (newEvents) => {
  if (newEvents && newEvents.length > 0) {
    generateAnalysis(newEvents);
  }
}, { deep: true });

onMounted(() => {
  if (props.events.length > 0) {
    generateAnalysis(props.events);
  }
});

function getImpactAnalysis(title) {
  const t = title.toUpperCase();
  if (t.includes('WAR') || t.includes('MILITARY') || t.includes('ARMY')) {
    return `Critical monitoring required. Potential diplomatic strain expected for Indonesian foreign policy. Advise Natuna maritime patrols to remain vigilant.`;
  } else if (t.includes('ECONOMY') || t.includes('MARKET') || t.includes('TRADE')) {
    return `Projected volatility for IDR currency pairs. Possible disruption to regional supply chains affecting Indonesian exports.`;
  } else if (t.includes('CYBER') || t.includes('HACK')) {
    return `Elevating firewall protocols across Nusantara government infrastructure. No immediate localized breach detected.`;
  } else if (t.includes('ELECTION') || t.includes('POLITIC')) {
    return `Analyzing shifting power dynamics. Awaiting confirmation on trade agreement impacts for ASEAN.`;
  }
  return `General intelligence logged. Negligible immediate threat to Indonesian sovereign interests. Continued monitoring assigned.`;
}

async function generateAnalysis(events) {
  displayedLines.value = [];
  isTyping.value = true;
  
  const fullAnalysis = [
    { type: 'system', text: 'INITIATING DEEP SCAN...' },
    { type: 'system', text: `INGESTING ${events.length} GLOBAL TELEMETRY STREAMS.` },
    { type: 'system', text: 'ISOLATING FACTORS IMPACTING THE REPUBLIC OF INDONESIA...' },
    { type: 'spacer', text: '<br/>' }
  ];

  // Pick top 3 events for detailed breakdown
  const topEvents = events.slice(0, 3);
  
  fullAnalysis.push({ type: 'header', text: '--- STRATEGIC REGIONAL IMPACT ASSESSMENT ---' });
  
  topEvents.forEach(ev => {
    fullAnalysis.push({ type: 'highlight', text: `[TARGET]: ${ev.title}` });
    fullAnalysis.push({ type: 'bullet', text: `<span style="color:var(--shield-blue)">ASSET IMPACT (ID):</span> ${getImpactAnalysis(ev.title)}` });
    fullAnalysis.push({ type: 'spacer', text: '<br/>' });
  });
  
  fullAnalysis.push({ type: 'system', text: 'ANALYSIS CONCLUDED. AWAITING NEW UPLINK.' });

  // Typewriter effect
  for (let i = 0; i < fullAnalysis.length; i++) {
    await typeLine(fullAnalysis[i]);
  }
  
  isTyping.value = false;
}

function typeLine(lineObj) {
  return new Promise(resolve => {
    let currentText = '';
    const isHtml = lineObj.text.includes('<'); // Quick check for HTML
    
    // If it has HTML tags, we just print the line abruptly for the "system" feel,
    // otherwise we type it out fast.
    if (isHtml || lineObj.type === 'spacer') {
      displayedLines.value.push(lineObj);
      scrollToBottom();
      setTimeout(resolve, 300);
      return;
    }

    const newLineIndex = displayedLines.value.length;
    displayedLines.value.push({ type: lineObj.type, text: '' });
    
    let charIndex = 0;
    const interval = setInterval(() => {
      currentText += lineObj.text.charAt(charIndex);
      displayedLines.value[newLineIndex].text = currentText;
      charIndex++;
      
      if (charIndex % 5 === 0) scrollToBottom();

      if (charIndex === lineObj.text.length) {
        clearInterval(interval);
        setTimeout(resolve, 200 + Math.random() * 300); // pause between lines
      }
    }, 15); // incredibly fast typing speed matching a supercomputer
  });
}

const scrollToBottom = async () => {
  await nextTick();
  if (terminalBody.value) {
    terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
  }
};
</script>

<style scoped>
.ai-summary-wrapper {
  width: 100%;
  height: 100%;
  background: rgba(4, 15, 23, 0.9);
  border: 1px solid var(--shield-blue);
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 30px rgba(0, 240, 255, 0.05);
  font-family: var(--font-mono);
}

.terminal-header {
  background: var(--shield-blue-dim);
  padding: 8px 15px;
  border-bottom: 1px solid var(--shield-blue);
  color: var(--shield-text);
  font-weight: bold;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.terminal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  color: #a0d8e0;
  font-size: 1.05rem;
  line-height: 1.6;
}

.terminal-line {
  margin-bottom: 4px;
}

.terminal-line.header {
  color: var(--shield-blue);
  font-weight: bold;
  text-shadow: 0 0 5px var(--shield-blue);
  margin-top: 15px;
  margin-bottom: 15px;
}

.terminal-line.highlight {
  color: #fff;
  font-weight: bold;
}

.terminal-line.system {
  color: var(--shield-text-dim);
}

.blinking-cursor {
  display: inline-block;
  color: var(--shield-blue);
  animation: bg-blink 1s step-end infinite;
}

@keyframes bg-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
