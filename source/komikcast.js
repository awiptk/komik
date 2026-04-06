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

    const rawText = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(rawText);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return res.status(500).json({ error: 'Invalid JSON from upstream' });
    }

    // === TRANSFORMASI WAJIB ===
    function transformIndexToString(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(transformIndexToString);
      }
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'index' && (typeof value === 'number' || typeof value === 'string')) {
          // UBAH INDEX MENJADI STRING
          newObj[key] = String(value);
        } 
        else if (key === 'title' && value === 'null') {
          // UBAH STRING LITERAL "null" MENJADI null ASLI
          newObj[key] = null;
        }
        else {
          newObj[key] = transformIndexToString(value);
        }
      }
      return newObj;
    }

    const transformed = transformIndexToString(jsonData);

    // Log untuk memastikan transformasi berhasil
    if (transformed.data && transformed.data.length > 0) {
      console.log('Sample transformed chapter:', {
        index: transformed.data[0].data?.index,
        indexType: typeof transformed.data[0].data?.index,
        title: transformed.data[0].data?.title,
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).json(transformed);
  } catch (e) {
    console.error('Handler error:', e);
    res.status(500).json({ error: e.message });
  }
}
