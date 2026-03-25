class EconomicService {
  constructor() {
    this.subscribers = [];
    this.data = {
      rates: { 
        USD: { value: 0, source: 'PENDING', lastUpdated: null },
        EUR: { value: 0, source: 'PENDING', lastUpdated: null },
        SGD: { value: 0, source: 'PENDING', lastUpdated: null },
        JPY: { value: 0, source: 'PENDING', lastUpdated: null },
        AUD: { value: 0, source: 'PENDING', lastUpdated: null }
      },
      jkse: { value: 7350.25, change: 0, percent: 0, source: 'INITIAL', lastUpdated: null },
      lastSync: null
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

  async fetchCurrency(cur) {
    try {
      // 1. Try Google Finance (Real-time approx)
      const ticker = `${cur}-IDR`;
      const gfUrl = import.meta.env.DEV ? `/api/googlefinance/${ticker}` : `/api/googlefinance?ticker=${ticker}`;
      const gfRes = await fetch(gfUrl);
      const html = await gfRes.text();
      const priceMatch = html.match(/data-last-price="([\d.]+)"/);
      
      if (priceMatch) {
         return {
           value: parseFloat(priceMatch[1]),
           source: 'GOOGLE',
           lastUpdated: new Date().toISOString()
         };
      }
    } catch (e) {
      console.warn(`Google Finance Fetch failed for ${cur}, falling back to Frankfurter.`);
    }

    try {
      // 2. Fallback to Frankfurter (Daily ECB)
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${cur}&symbols=IDR`);
      const data = await res.json();
      if (data && data.rates && data.rates.IDR) {
        return {
          value: data.rates.IDR,
          source: 'ECB/DAILY',
          lastUpdated: new Date(data.date).toISOString()
        };
      }
    } catch (e) {
      console.error(`Frankfurter Fallback failed for ${cur}`);
    }
    return null;
  }

  async fetchMarketData() {
    try {
      // 1. Fetch JKSE (Jakarta Stock Exchange)
      try {
        const queryParams = '?range=5d&interval=1d';
        const jkseUrl = import.meta.env.DEV 
          ? `/api/yahoo/v8/finance/chart/%5EJKSE${queryParams}` 
          : `/api/yahoo?ticker=%5EJKSE&range=5d&interval=1d`;
        const jkseRes = await fetch(jkseUrl);
        const json = await jkseRes.json();
        
        if (json.chart && json.chart.result && json.chart.result.length > 0) {
          const result = json.chart.result[0];
          let currentPrice = result.meta?.regularMarketPrice || 0;
          let previousClose = result.meta?.previousClose || 0;
          
          if (result.indicators && result.indicators.quote && result.indicators.quote.length > 0) {
            const closes = result.indicators.quote[0].close;
            if (closes && closes.length > 1) {
              const validCloses = closes.filter(c => c !== null);
              if (validCloses.length >= 2) {
                // Using the historical daily candle guarantees the values do not bounce
                // due to post-market meta field delays on Yahoo's API
                previousClose = validCloses[validCloses.length - 2];
                currentPrice = validCloses[validCloses.length - 1];
              }
            }
          }
          
          this.data.jkse.value = currentPrice;
          this.data.jkse.change = currentPrice - previousClose;
          this.data.jkse.percent = (this.data.jkse.change / previousClose) * 100;
          this.data.jkse.lastUpdated = new Date().toISOString();
        }
      } catch (jkseError) {
        console.error("JKSE LIVE UPLINK FAILED:", jkseError);
      }

      // 2. Fetch Currencies in Parallel
      const currencies = ['USD', 'EUR', 'SGD', 'JPY', 'AUD'];
      const results = await Promise.all(currencies.map(cur => this.fetchCurrency(cur)));
      
      currencies.forEach((cur, i) => {
        if (results[i]) {
          this.data.rates[cur] = results[i];
        }
      });

      this.data.lastSync = new Date().toISOString();
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
