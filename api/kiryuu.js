const BASE = 'https://v2.kiryuu.to';
const AJAX = `${BASE}/wp-admin/admin-ajax.php`;

export default async function handler(req, res) {
  const { path, action, manga_id } = req.query;

  const headers = {
    'Origin': 'https://v2.kiryuu.to',
    'Referer': 'https://v2.kiryuu.to/',
    'Accept': 'application/json, text/html',
    'User-Agent': 'Mozilla/5.0',
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    // Chapter list — return HTML, parse di sini
    if (action === 'chapter_list' && manga_id) {
      const url = `${AJAX}?manga_id=${manga_id}&page=999&action=chapter_list`;
      const html = await fetch(url, { headers, cache: 'no-store' }).then(r => r.text());

      const chapters = [];
      const linkRe = /href="(https:\/\/v2\.kiryuu\.to\/manga\/[^"]+)"/g;
      const nameRe = /<span>([^<]+)<\/span>/g;
      const dateRe = /datetime="([^"]+)"/g;

      const links = [...html.matchAll(linkRe)].map(m => m[1]);
      const names = [...html.matchAll(nameRe)].map(m => m[1].trim());
      const dates = [...html.matchAll(dateRe)].map(m => m[1]);

      links.forEach((link, i) => {
        chapters.push({
          url: link,
          name: names[i] || `Chapter ${i + 1}`,
          date: dates[i] || '',
        });
      });

      return res.json({ data: chapters });
    }

    // WP JSON API — default ke terbaru (orderby=modified)
    const wpPath = path || '/wp-json/wp/v2/manga?per_page=24&page=1&orderby=modified&order=desc&_embed';
    const response = await fetch(`${BASE}${wpPath}`, { headers, cache: 'no-store' });
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
