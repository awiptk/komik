export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '/v1/manga/list?page=1&page_size=30&sort=latest';

  try {
    const response = await fetch(`https://api.shngm.io${path}`, {
      headers: {
        'Origin': 'https://c.shinigami.asia',
        'Referer': 'https://c.shinigami.asia/',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const data = await response.text();

    return new Response(data, {
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