const BASE = 'https://api.shngm.io';

export default async function handler(req, res) {
  const path = req.query.path || '/v1/manga/list?page=1&page_size=30&sort=latest';

  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: {
        'Origin': 'https://c.shinigami.asia',
        'Referer': 'https://c.shinigami.asia/',
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
