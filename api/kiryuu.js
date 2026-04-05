import { KIRYUU } from './_utils.js';

const AJAX = `${KIRYUU}/wp-admin/admin-ajax.php`;

export default async function handler(req, res) {
  const { path, action, manga_id } = req.query;

  const headers = {
    'Origin':     'https://v2.kiryuu.to',
    'Referer':    'https://v2.kiryuu.to/',
    'Accept':     'application/json, text/html',
    'User-Agent': 'Mozilla/5.0',
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    if (action === 'chapter_list' && manga_id) {
      let numericId = manga_id;

      if (isNaN(manga_id)) {
        const wpRes = await fetch(`${KIRYUU}/wp-json/wp/v2/manga?slug[]=${manga_id}&_fields=id`, { headers, cache: 'no-store' });
        const wpData = await wpRes.json();
        numericId = wpData?.[0]?.id;
        if (!numericId) return res.json({ data: [] });
      }

      const url = `${AJAX}?manga_id=${numericId}&page=999&action=chapter_list`;
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
          url:  link,
          name: names[i] || `Chapter ${i + 1}`,
          date: dates[i] || '',
        });
      });

      return res.json({ data: chapters });
    }

    const wpPath = path || '/wp-json/wp/v2/manga?per_page=24&page=1&orderby=modified&order=desc&_embed';
    const response = await fetch(`${KIRYUU}${wpPath}`, { headers, cache: 'no-store' });
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}