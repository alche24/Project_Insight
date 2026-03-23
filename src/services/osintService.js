// Simulated OSINT Intelligence Feed prioritizing insights within 5 seconds.
// This service provides both mock data and a polling mechanism.

const MOCK_EVENTS = [
  { id: 1, title: 'Unusual Naval Movement Detected', location: 'South China Sea', lat: 10.5, lng: 114.5, severity: 'HIGH', time: Date.now() - 300000, category: 'MILITARY', impact: 'Potential disruption to shipping routes affecting Indonesian trade.' },
  { id: 2, title: 'Cyber Intrusion Attempt on National Grid', location: 'Jakarta, ID', lat: -6.2088, lng: 106.8456, severity: 'CRITICAL', time: Date.now() - 1200000, category: 'CYBER', impact: 'Mitigated. No current impact on capital infrastructure.' },
  { id: 3, title: 'Seismic Anomaly / Unregistered Activity', location: 'Krakatoa Sector', lat: -6.1021, lng: 105.423, severity: 'MEDIUM', time: Date.now() - 3600000, category: 'GEOPOLITICAL', impact: 'Monitoring. Low immediate threat level.' },
  { id: 4, title: 'Economic Sanctions Shift in Region', location: 'Singapore', lat: 1.3521, lng: 103.8198, severity: 'LOW', time: Date.now() - 7200000, category: 'ECONOMY', impact: 'Positive potential for IDR foreign exchange markets.' },
  { id: 5, title: 'Unauthorized Drone Surveillance', location: 'Natuna Regency', lat: 3.9491, lng: 108.1429, severity: 'HIGH', time: Date.now() - 60000, category: 'DEFENSE', impact: 'Awaiting visual confirmation from interceptors.' }
];

class OSINTService {
  constructor() {
    this.subscribers = [];
    this.events = [...MOCK_EVENTS];
    this.pollingInterval = null;
  }

  startPolling(intervalMinutes = 10) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    
    // Convert minutes to milliseconds. 
    // Wait, for demo purposes we can refresh every 10 seconds, but specs said 10 minutes.
    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.pollingInterval = setInterval(() => {
      this.refreshData();
    }, intervalMs);

    // Initial load
    this.refreshData();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  async refreshData() {
    // In a real scenario, this would be: await fetch('https://api.example.com/osint')
    // We simulate a network request generating a new event dynamically to simulate live intel.
    
    const newEvent = this.generateRandomEvent();
    this.events.unshift(newEvent);
    if (this.events.length > 50) this.events.pop(); // Keep array size manageable
    
    this.notifySubscribers();
  }

  generateRandomEvent() {
    const lat = (Math.random() * 20 - 15); // near Indonesia roughly -15 to 5
    const lng = (Math.random() * 40 + 95);  // near Indonesia 95 to 135
    const categories = ['CYBER', 'MILITARY', 'GEOPOLITICAL', 'ECONOMY', 'DEFENSE'];
    
    return {
      id: Date.now(),
      title: `Automated Signal Intel: Anomalous ${categories[Math.floor(Math.random() * categories.length)]} Activity`,
      location: `Coord: ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      lat,
      lng,
      severity: Math.random() > 0.8 ? 'CRITICAL' : Math.random() > 0.4 ? 'HIGH' : 'MEDIUM',
      time: Date.now(),
      category: categories[Math.floor(Math.random() * categories.length)],
      impact: 'Analysis pending. High probability of relevance to ID infrastructure.'
    };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.events); // immediate call with current data
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb([...this.events]));
  }
}

export const osintService = new OSINTService();
