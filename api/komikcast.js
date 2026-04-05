const BASE = 'https://be.komikcast.fit';

export default async function handler(req, res) {
  const path = req.query.path || '/series?take=24&page=1';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: {
        'Origin': 'https://v1.komikcast.fit',
        'Referer': 'https://v1.komikcast.fit/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    });

    const text = await response.text();

    // Debug: kalau bukan JSON, return raw text biar ketahuan isinya
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch {
      res.status(200).send(`[DEBUG] Status: ${response.status}\n\n${text.slice(0, 500)}`);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
