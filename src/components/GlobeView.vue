<template>
  <div class="globe-wrapper" ref="globeContainer"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import Globe from 'globe.gl';

const props = defineProps({
  events: {
    type: Array,
    required: true
  }
});

const globeContainer = ref(null);
let globeInstance = null;

onMounted(() => {
  if (!globeContainer.value) return;

  const width = globeContainer.value.clientWidth;
  const height = globeContainer.value.clientHeight;

  globeInstance = Globe()(globeContainer.value)
    .width(width)
    .height(height)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundColor('rgba(0,0,0,0)')
    .pointOfView({ lat: -2.5, lng: 118, altitude: 1.5 }) // Focus on Indonesia
    
    // Configure Rings for events
    .ringLat('lat')
    .ringLng('lng')
    .ringColor(d => d.severity === 'CRITICAL' ? '#ff2a2a' : d.severity === 'HIGH' ? '#ff9900' : '#00f0ff')
    .ringMaxRadius(d => d.severity === 'CRITICAL' ? 5 : 3)
    .ringPropagationSpeed(d => d.severity === 'CRITICAL' ? 2 : 1)
    .ringRepeatPeriod(d => d.severity === 'CRITICAL' ? 500 : 1000)
    
    // Configure Labels
    .labelLat('lat')
    .labelLng('lng')
    .labelText('title')
    .labelSize(1.5)
    .labelDotRadius(0.5)
    .labelColor(() => '#00f0ff')
    .labelResolution(2);

  // Initialize with current data
  updateGlobeData(props.events);

  // Handle window resize
  const resizeObserver = new ResizeObserver(() => {
    if (globeContainer.value && globeInstance) {
      globeInstance.width(globeContainer.value.clientWidth);
      globeInstance.height(globeContainer.value.clientHeight);
    }
  });
  resizeObserver.observe(globeContainer.value);

  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});

watch(() => props.events, (newEvents) => {
  if (globeInstance) {
    updateGlobeData(newEvents);
  }
}, { deep: true });

function updateGlobeData(events) {
  // Only show top 15 most recent on globe to avoid clutter
  const recentEvents = events.slice(0, 15);
  globeInstance.ringsData(recentEvents);
  globeInstance.labelsData(recentEvents);
}
</script>

<style scoped>
.globe-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at center, rgba(0, 240, 255, 0.05) 0%, transparent 70%);
}

/* Add an overlay grid to enhance the S.H.I.E.L.D tech feel */
.globe-wrapper::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  background-image: 
    linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 1;
}
</style>
