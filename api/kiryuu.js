import { KIRYUU } from './_utils.js';

export const config = { runtime: 'edge' };

const AJAX = `${KIRYUU}/wp-admin/admin-ajax.php`;

const headers = {
  'Origin':     'https://v2.kiryuu.to',
  'Referer':    'https://v2.kiryuu.to/',
  'Accept':     'application/json, text/html',
  'User-Agent': 'Mozilla/5.0',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const path     = searchParams.get('path');
  const action   = searchParams.get('action');
  const manga_id = searchParams.get('manga_id');

  try {
    // Chapter list
    if (action === 'chapter_list' && manga_id) {
      let numericId = manga_id;

      if (isNaN(manga_id)) {
        const wpRes  = await fetch(`${KIRYUU}/wp-json/wp/v2/manga?slug[]=${manga_id}&_fields=id`, { headers });
        const wpData = await wpRes.json();
        numericId    = wpData?.[0]?.id;
        if (!numericId) return new Response(JSON.stringify({ data: [] }), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      const url  = `${AJAX}?manga_id=${numericId}&page=999&action=chapter_list`;
      const html = await fetch(url, { headers }).then(r => r.text());

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

      return new Response(JSON.stringify({ data: chapters }), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // WP JSON API
    const wpPath   = path || '/wp-json/wp/v2/manga?per_page=24&page=1&orderby=modified&order=desc&_embed';
    const response = await fetch(`${KIRYUU}${wpPath}`, { headers });
    const data     = await response.json();

    // Fix class_list — konversi object {} jadi array []
    const fixed = Array.isArray(data) ? data.map(item => ({
      ...item,
      class_list: Array.isArray(item.class_list)
        ? item.class_list
        : item.class_list && typeof item.class_list === 'object'
          ? Object.values(item.class_list)
          : [],
    })) : data;

    return new Response(JSON.stringify(fixed), {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
}