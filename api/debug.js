import { fetchShinigami, fetchKomikcast, fetchKiryuu, deduplicate } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const [shn, kc, kry] = await Promise.allSettled([
    fetchShinigami({ page: 1, pageSize: 3, sort: 'latest' }),
    fetchKomikcast({ page: 1, pageSize: 3, sort: 'latest' }),
    fetchKiryuu({ page: 1, pageSize: 3, orderby: 'modified' }),
  ]);

  const all = [
    ...(shn.status === 'fulfilled' ? shn.value : []),
    ...(kc.status  === 'fulfilled' ? kc.value  : []),
    ...(kry.status === 'fulfilled' ? kry.value  : []),
  ];

  const sorted = deduplicate(all).sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  }).map(item => ({
    source:       item.source,
    title:        item.title,
    updatedAt:    item.updatedAt,
    updatedAtUTC: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
  }));

  res.json({
    shinigami: { status: shn.status, count: shn.value?.length, error: shn.reason?.message },
    komikcast:  { status: kc.status,  count: kc.value?.length,  error: kc.reason?.message  },
    kiryuu:     { status: kry.status, count: kry.value?.length, error: kry.reason?.message  },
    sorted,
  });
}