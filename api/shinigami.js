import { SHINIGAMI } from './_utils.js';

export default async function handler(req, res) {
  const path = req.query.path || '/v1/manga/list?page=1&page_size=30&sort=latest';

  try {
    const response = await fetch(`${SHINIGAMI}${path}`, {
      headers: {
        'Origin':             'https://c.shinigami.asia',
        'Referer':            'https://c.shinigami.asia/',
        'Accept':             'application/json, text/plain, */*',
        'Accept-Language':    'en-US,en;q=0.9',
        'Accept-Encoding':    'gzip, deflate, br',
        'User-Agent':         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'sec-ch-ua':          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile':   '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest':     'empty',
        'sec-fetch-mode':     'cors',
        'sec-fetch-site':     'cross-site',
        'X-Requested-With':   'XMLHttpRequest',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}