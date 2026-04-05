import { fetchShinigami, fetchKomikcast, fetchKiryuu, deduplicate } from './_utils.js';

export default async function handler(req, res) {
  const page     = parseInt(req.query.page || '1');
  const pageSize = parseInt(req.query.page_size || '24');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const [shn, kc, kry] = await Promise.allSettled([
      fetchShinigami({ page, pageSize, sort: 'latest' }),
      fetchKomikcast({ page, pageSize, sort: 'latest' }),
      fetchKiryuu({ page, pageSize, orderby: 'modified' }),
    ]);

    const all = [
      ...(shn.status === 'fulfilled' ? shn.value : []),
      ...(kc.status  === 'fulfilled' ? kc.value  : []),
      ...(kry.status === 'fulfilled' ? kry.value : []),
    ];

    const data = deduplicate(all);
    res.json({ data, hasNextPage: data.length >= pageSize });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
