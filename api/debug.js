import { fetchShinigami, fetchKomikcast, fetchKiryuu } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const [shn, kc, kry] = await Promise.allSettled([
    fetchShinigami({ page: 1, pageSize: 3, sort: 'latest' }),
    fetchKomikcast({ page: 1, pageSize: 3, sort: 'latest' }),
    fetchKiryuu({ page: 1, pageSize: 3, orderby: 'modified' }),
  ]);

  res.json({
    shinigami: { status: shn.status, count: shn.value?.length, error: shn.reason?.message, sample: shn.value?.[0] },
    komikcast: { status: kc.status,  count: kc.value?.length,  error: kc.reason?.message,  sample: kc.value?.[0] },
    kiryuu:    { status: kry.status, count: kry.value?.length, error: kry.reason?.message,  sample: kry.value?.[0] },
  });
}