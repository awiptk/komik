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

    const shnList = shn.status === 'fulfilled' ? shn.value : [];
    const kcList  = kc.status  === 'fulfilled' ? kc.value  : [];
    const kryList = kry.status === 'fulfilled' ? kry.value : [];

    // interleave round-robin
    const interleaved = [];
    const maxLen = Math.max(shnList.length, kcList.length, kryList.length);
    for (let i = 0; i < maxLen; i++) {
      if (shnList[i]) interleaved.push(shnList[i]);
      if (kcList[i])  interleaved.push(kcList[i]);
      if (kryList[i]) interleaved.push(kryList[i]);
    }

    const data = deduplicate(interleaved);
    res.json({ data, hasNextPage: data.length >= pageSize });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}