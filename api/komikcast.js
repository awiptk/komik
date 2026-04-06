import { KOMIKCAST } from './_utils.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '/series?includeMeta=true&sort=latest&sortOrder=desc&take=24&page=1';

  const response = await fetch(`${KOMIKCAST}${path}`, {
    headers: {
      'Origin':     'https://v1.komikcast.fit',
      'Referer':    'https://v1.komikcast.fit/',
      'Accept':     'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const data = await response.text();

  return new Response(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type':                'application/json',
    },
  });
}