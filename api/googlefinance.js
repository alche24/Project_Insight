export default async function handler(req, res) {
  try {
    // Vercel Serverless Function to privately proxy Google Finance
    // Bypasses CORS and prevents Google from blocking the frontend user's IP.
    const fetchRes = await fetch('https://www.google.com/finance/quote/COMPOSITE:IDX', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });

    if (!fetchRes.ok) {
      throw new Error(`Google Finance responded with status: ${fetchRes.status}`);
    }

    const html = await fetchRes.text();
    
    // Set caching headers so Vercel caches it for 60 seconds (prevents rate limiting)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error("Vercel Proxy Error:", error);
    res.status(500).json({ error: 'Failed to proxy Google Finance data' });
  }
}
