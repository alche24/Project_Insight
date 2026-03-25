export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const ticker = url.searchParams.get('ticker') || '%5EJKSE';
    const range = url.searchParams.get('range') || '1d';
    const interval = url.searchParams.get('interval') || '1m';

    const fetchRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!fetchRes.ok) throw new Error(`Yahoo Finance responded with status: ${fetchRes.status}`);

    const data = await fetchRes.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error("Vercel Proxy Error for Yahoo API:", error);
    res.status(500).json({ error: 'Failed to proxy Yahoo Finance data' });
  }
}
