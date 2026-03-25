const https = require('https');
https.get({
  hostname: 'www.google.com',
  path: '/finance/quote/COMPOSITE:IDX',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const p1 = data.match(/data-last-price="([\d.]+)"/);
    console.log('Price:', p1 ? p1[1] : null);
    const r = /class="[^"]*JwB6zf[^"]*"[^>]*>([-+]*[\d.]+)%<\/div>/g;
    let m, c=0;
    while((m=r.exec(data)) && c<10) console.log(`Match ${++c}: ${m[1]}`);
  });
}).on('error', e => console.error(e));
