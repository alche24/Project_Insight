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
        const jkseUrl = import.meta.env.DEV ? '/api/googlefinance/COMPOSITE:IDX' : '/api/googlefinance?ticker=COMPOSITE:IDX';
        const jkseRes = await fetch(jkseUrl);
        const html = await jkseRes.text();
        const priceMatch = html.match(/data-last-price="([\d.]+)"/);
        
        if (priceMatch) {
          const currentPrice = parseFloat(priceMatch[1]);
          this.data.jkse.value = currentPrice;
          this.data.jkse.lastUpdated = new Date().toISOString();
          
          const changePctMatch = html.match(/class="[^"]*JwB6zf[^"]*"[^>]*>([-+]*[\d.]+)%<\/div>/);
          if (changePctMatch) {
             this.data.jkse.percent = parseFloat(changePctMatch[1]);
             this.data.jkse.change = currentPrice - (currentPrice / (1 + (this.data.jkse.percent / 100)));
          }
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
