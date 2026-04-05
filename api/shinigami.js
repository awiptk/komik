import { SHINIGAMI } from './_utils.js';

export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '/v1/manga/list?page=1&page_size=30&sort=latest';

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
        'X-Forwarded-For':    '103.75.112.1',
        'X-Real-IP':          '103.75.112.1',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'no-store, no-cache, must-revalidate',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}