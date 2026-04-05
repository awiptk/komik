const BASE = 'https://be.komikcast.fit';

export default async function handler(req, res) {
  const path = req.query.path || '/series?take=24&page=1';

  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: {
        'Origin': 'https://v1.komikcast.fit',
        'Referer': 'https://v1.komikcast.fit/',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
