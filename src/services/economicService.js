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
      // Fetch actual LIVE data for the Jakarta Stock Exchange (JKSE / IHSG)
      // Yahoo's free tier for ^JKSE is often delayed or stuck. We use the Vite proxy to scrape Google Finance for an exact live match.
      try {
        const jkseUrl = import.meta.env.DEV ? '/api/googlefinance/COMPOSITE:IDX' : '/api/googlefinance?ticker=COMPOSITE:IDX';
        const jkseRes = await fetch(jkseUrl);
        const html = await jkseRes.text();
        
        const priceMatch = html.match(/data-last-price="([\d.]+)"/);
        
        if (priceMatch) {
          const currentPrice = parseFloat(priceMatch[1]);
          this.data.jkse.value = currentPrice;
          
          // Google Finance embeds the percentage change close to the price
          const changePctMatch = html.match(/class="[^"]*JwB6zf[^"]*"[^>]*>([-+]*[\d.]+)%<\/div>/);
          if (changePctMatch) {
             this.data.jkse.percent = parseFloat(changePctMatch[1]);
             this.data.jkse.change = currentPrice - (currentPrice / (1 + (this.data.jkse.percent / 100)));
          }
        }
      } catch (jkseError) {
        console.error("JKSE LIVE UPLINK FAILED (Market Closed / Network Error):", jkseError);
      }

      // Fetch Live Forex Rates using Google Finance proxy in parallel for instant synchronous updates
      const currencies = ['USD', 'EUR', 'SGD', 'JPY', 'AUD'];
      await Promise.all(currencies.map(async (cur) => {
          try {
              const forexUrl = import.meta.env.DEV ? `/api/googlefinance/${cur}-IDR` : `/api/googlefinance?ticker=${cur}-IDR`;
              const fxRes = await fetch(forexUrl);
              const fxHtml = await fxRes.text();
              const fxPriceMatch = fxHtml.match(/data-last-price="([\d.]+)"/);
              if (fxPriceMatch) {
                  this.data.rates[cur] = parseFloat(fxPriceMatch[1]);
              }
          } catch (e) {
              console.warn(`Failed to fetch ${cur}-IDR live rate`, e);
          }
      }));

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
