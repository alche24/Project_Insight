class EconomicService {
  constructor() {
    this.subscribers = [];
    this.data = {
      rates: { USD: 0, EUR: 0, SGD: 0, JPY: 0, AUD: 0 },
      jkse: { value: 7350.25, change: 0, percent: 0 } // Base realistic value
    };
    this.pollingInterval = null;
  }

  startPolling(intervalMinutes = 5) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.pollingInterval = setInterval(() => {
      this.fetchMarketData();
    }, intervalMs);

    this.fetchMarketData(); // Immediate initial fetch
  }

  stopPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  async fetchMarketData() {
    try {
      // Fetch live cross-rates relative to USD using a free CORS-enabled API
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const apiData = await res.json();
      
      const idrRate = apiData.rates.IDR;
      
      this.data.rates = {
        USD: idrRate,
        EUR: idrRate / apiData.rates.EUR,
        SGD: idrRate / apiData.rates.SGD,
        JPY: idrRate / apiData.rates.JPY,
        AUD: idrRate / apiData.rates.AUD
      };

      // Fetch actual LIVE data for the Jakarta Stock Exchange (JKSE / IHSG) using Yahoo Finance
      // In development, we use the Vite proxy to bypass CORS.
      try {
        const jkseUrl = import.meta.env.DEV ? '/api/yahoo/v8/finance/chart/%5EJKSE' : 'https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE';
        const jkseRes = await fetch(jkseUrl);
        const jkseData = await jkseRes.json();
        
        if (jkseData.chart && jkseData.chart.result && jkseData.chart.result.length > 0) {
          const meta = jkseData.chart.result[0].meta;
          const currentPrice = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose;
          
          this.data.jkse.value = currentPrice;
          this.data.jkse.change = currentPrice - prevClose;
          this.data.jkse.percent = (this.data.jkse.change / prevClose) * 100;
        }
      } catch (jkseError) {
        console.error("JKSE LIVE UPLINK FAILED (Market Closed / Network Error):", jkseError);
      }

      this.notifySubscribers();
    } catch (error) {
      console.error("ECONOMIC UPLINK FAILED:", error);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.data);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb(JSON.parse(JSON.stringify(this.data)))); // avoid mutation issues
  }
}

export const economicService = new EconomicService();
