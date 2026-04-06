import { KOMIKCAST } from '../api/_utils.js';

export default async function handler(req, res) {
  const path = req.query.path || '/series?includeMeta=true&sort=latest&sortOrder=desc&take=24&page=1';

  try {
    const response = await fetch(`${KOMIKCAST}${path}`, {
      headers: {
        'Origin':     'https://v1.komikcast.fit',
        'Referer':    'https://v1.komikcast.fit/',
        'Accept':     'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    // Ambil response sebagai JSON
    let jsonData;
    const text = await response.text();
    try {
      jsonData = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON from upstream' });
    }

    // Fungsi transformasi rekursif
    function transform(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(transform);
      }
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'index' && (typeof value === 'number' || typeof value === 'string')) {
          // Ubah index menjadi string
          newObj[key] = String(value);
        } 
        else if (key === 'title' && value === 'null') {
          // Ubah string literal "null" menjadi null sebenarnya
          newObj[key] = null;
        }
        else {
          newObj[key] = transform(value);
        }
      }
      return newObj;
    }

    const transformed = transform(jsonData);

    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).json(transformed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}