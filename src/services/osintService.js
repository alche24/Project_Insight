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

    // Indonesian + International RSS feeds
    this.rssFeeds = [
      { url: 'https://www.antaranews.com/rss/terkini',              source: 'ANTARA NEWS',     category: 'NATIONAL' },
      { url: 'https://rss.kompas.com/or/kompas',                    source: 'KOMPAS',          category: 'NATIONAL' },
      { url: 'https://rss.detik.com/index.php/detikcom',            source: 'DETIK',           category: 'NATIONAL' },
      { url: 'https://www.cnbcindonesia.com/rss',                   source: 'CNBC INDONESIA',  category: 'ECONOMY' },
      { url: 'https://rss.tempo.co/nasional',                       source: 'TEMPO',           category: 'NATIONAL' },
      { url: 'https://www.republika.co.id/rss',                     source: 'REPUBLIKA',       category: 'NATIONAL' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml',           source: 'AL JAZEERA',      category: 'GEOPOLITICAL' },
    ];
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

  async fetchSingleFeed(feed) {
    const rssUrl = encodeURIComponent(feed.url);
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok' && data.items) {
      return data.items.map(item => ({ ...item, _source: feed.source, _category: feed.category }));
    }
    return [];
  }

  async fetchLiveNews() {
    try {
      // Fetch all RSS feeds in parallel — failures are isolated per feed
      const results = await Promise.allSettled(
        this.rssFeeds.map(feed => this.fetchSingleFeed(feed))
      );

      // Merge all successful results
      const allItems = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // Deduplicate by title (lowercase comparison)
      const seen = new Set();
      const unique = allItems.filter(item => {
        const key = item.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Filter to last 24 hours only
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recent = unique.filter(item => new Date(item.pubDate).getTime() >= twentyFourHoursAgo);

      // Sort newest first, take top 200
      recent.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      const top = recent.slice(0, 200);

      this.events = top.map((item, index) => {
        // Generate random realistic coordinates in the Indonesian / APAC sector
        const lat = Math.random() * (this.geoBounds.maxLat - this.geoBounds.minLat) + this.geoBounds.minLat;
        const lng = Math.random() * (this.geoBounds.maxLng - this.geoBounds.minLng) + this.geoBounds.minLng;

        // Default category from feed source, then override by keywords
        const titleUpper = item.title.toUpperCase();
        let severity = 'MEDIUM';
        let category = item._category || 'NATIONAL';

        if (titleUpper.includes('ATTACK') || titleUpper.includes('WAR') || titleUpper.includes('MILITARY') || titleUpper.includes('SERANGAN') || titleUpper.includes('MILITER')) {
          severity = 'CRITICAL';
          category = 'MILITARY';
        } else if (titleUpper.includes('CYBER') || titleUpper.includes('HACK') || titleUpper.includes('SIBER')) {
          severity = 'HIGH';
          category = 'CYBER';
        } else if (titleUpper.includes('ECONOMY') || titleUpper.includes('TRADE') || titleUpper.includes('EKONOMI') || titleUpper.includes('SAHAM') || titleUpper.includes('IHSG') || titleUpper.includes('RUPIAH')) {
          severity = 'LOW';
          category = 'ECONOMY';
        } else if (titleUpper.includes('GEMPA') || titleUpper.includes('BANJIR') || titleUpper.includes('TSUNAMI') || titleUpper.includes('EARTHQUAKE') || titleUpper.includes('FLOOD')) {
          severity = 'CRITICAL';
          category = 'DISASTER';
        } else if (titleUpper.includes('POLISI') || titleUpper.includes('KORUPSI') || titleUpper.includes('CORRUPTION') || titleUpper.includes('HUKUM')) {
          severity = 'HIGH';
          category = 'LAW ENFORCEMENT';
        }

        return {
          id: Date.now() + index,
          title: item.title,
          url: item.link || null,
          location: `SECTOR: ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
          lat: lat,
          lng: lng,
          severity: severity,
          time: new Date(item.pubDate).getTime(),
          category: category,
          impact: `SOURCE: ${item._source} - ${item.author || 'LIVE UPLINK'}`
        };
      });

      if (this.events.length > 0) {
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
