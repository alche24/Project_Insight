// Live OSINT Intelligence Feed
// Fetches real world news and dynamically maps it to coordinates for the S.H.I.E.L.D Globe

class OSINTService {
  constructor() {
    this.subscribers = [];
    this.events = [];
    this.pollingInterval = null;
    
    // Fallback coordinates for Indonesia region (Sumatra to Papua)
    this.geoBounds = {
      minLat: -10.0, maxLat: 5.0,
      minLng: 95.0, maxLng: 140.0
    };
  }

  startPolling(intervalMinutes = 10) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.pollingInterval = setInterval(() => {
      this.fetchLiveNews();
    }, intervalMs);

    this.fetchLiveNews(); // Initial load
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  async fetchLiveNews() {
    try {
      // OPTION 2: LIVE NEWS FETCH
      // Using a free RSS-to-JSON proxy to pull live Asia-Pacific/World News without needing an API Key.
      // If you get an API key from GNews.io, you can replace this URL with:
      // const url = 'https://gnews.io/api/v4/search?q=indonesia&lang=en&apikey=YOUR_API_KEY';
      
      const rssUrl = encodeURIComponent('https://www.aljazeera.com/xml/rss/all.xml');
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        this.events = data.items.slice(0, 15).map((item, index) => {
          
          // Generate random realistic coordinates in the Indonesian / APAC sector
          const lat = Math.random() * (this.geoBounds.maxLat - this.geoBounds.minLat) + this.geoBounds.minLat;
          const lng = Math.random() * (this.geoBounds.maxLng - this.geoBounds.minLng) + this.geoBounds.minLng;
          
          // Assign severity based on keywords in title
          const titleUpper = item.title.toUpperCase();
          let severity = 'MEDIUM';
          let category = 'GEOPOLITICAL';
          
          if (titleUpper.includes('ATTACK') || titleUpper.includes('WAR') || titleUpper.includes('MILITARY')) {
            severity = 'CRITICAL';
            category = 'MILITARY';
          } else if (titleUpper.includes('CYBER') || titleUpper.includes('HACK')) {
            severity = 'HIGH';
            category = 'CYBER';
          } else if (titleUpper.includes('ECONOMY') || titleUpper.includes('TRADE')) {
            severity = 'LOW';
            category = 'ECONOMY';
          }

          return {
            id: Date.now() + index,
            title: item.title,
            location: `SECTOR: ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
            lat: lat,
            lng: lng,
            severity: severity,
            time: new Date(item.pubDate).getTime(),
            category: category,
            impact: 'SOURCE: LIVE UPLINK - ' + (item.author || 'GLOBAL FEED')
          };
        });

        this.notifySubscribers();
      }
    } catch (error) {
      console.error("OSINT Uplink Failed:", error);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.events);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb([...this.events]));
  }
}

export const osintService = new OSINTService();
