

async function check() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=5d';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const json = await res.json();
  const meta = json.chart.result[0].meta;
  const quote = json.chart.result[0].indicators.quote[0];
  const closes = quote.close;
  console.log({
    regularMarketPrice: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    closes: closes
  });
}

check();

check();

check();
