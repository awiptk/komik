export const SHINIGAMI = 'https://api.shngm.io';
export const KIRYUU    = 'https://v2.kiryuu.to';
export const KOMIKCAST = 'https://be.komikcast.fit';

const SHN_HEADERS = {
  'Origin':     'https://c.shinigami.asia',
  'Referer':    'https://c.shinigami.asia/',
  'Accept':     'application/json',
  'User-Agent': 'Mozilla/5.0',
};
const KRY_HEADERS = {
  'Origin':     'https://v2.kiryuu.to',
  'Referer':    'https://v2.kiryuu.to/',
  'Accept':     'application/json',
  'User-Agent': 'Mozilla/5.0',
};

// ─── NORMALIZER ──────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return t.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(str) {
  return (str || '').replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// ─── FETCHERS ────────────────────────────────────────────────────────────────

export async function fetchShinigami({ page, pageSize, sort, query }) {
  let url;
  if (query) {
    url = `${SHINIGAMI}/v1/manga/list?page=${page}&page_size=${pageSize}&q=${encodeURIComponent(query)}`;
  } else {
    url = `${SHINIGAMI}/v1/manga/list?page=${page}&page_size=${pageSize}&sort=${sort || 'latest'}`;
  }

  const r = await fetch(url, { headers: SHN_HEADERS, cache: 'no-store' });
  if (!r.ok) throw new Error(`Shinigami ${r.status}`);
  const j = await r.json();

  return (j.data || []).map(item => ({
    source:    'shinigami',
    id:        item.manga_id || item.mangaId || '',
    slug:      item.manga_id || item.mangaId || '',
    title:     item.title || '',
    cover:     item.cover_portrait_url || item.cover_image_url || '',
    status:    item.status === 1 ? 'ongoing' : item.status === 2 ? 'completed' : '',
    updatedAt: item.updated_at || item.updatedAt || '',
    url:       `https://c.shinigami.asia/series/${item.manga_id || item.mangaId || ''}`,
  }));
}

export async function fetchKomikcast({ page, pageSize, sort, query }) {
  let path;
  if (query) {
    const filter = `title=like="${encodeURIComponent(query)}",nativeTitle=like="${encodeURIComponent(query)}"`;
    path = `/series?take=${pageSize}&page=${page}&includeMeta=true&filter=${filter}`;
  } else {
    path = `/series?take=${pageSize}&page=${page}&sort=${sort || 'latest'}&sortOrder=desc&includeMeta=true`;
  }

  const url = `https://komik-mauve.vercel.app/api/komikcast?path=${encodeURIComponent(path)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Komikcast ${r.status}`);
  const j = await r.json();

  return (j.data || []).map(item => ({
    source:    'komikcast',
    id:        String(item.id || ''),
    slug:      item.data?.slug || '',
    title:     item.data?.title || '',
    cover:     item.data?.coverImage || '',
    status:    item.data?.status || '',
    updatedAt: item.updatedAt || '',
    url:       `https://v1.komikcast.fit/series/${item.data?.slug || ''}`,
  }));
}

export async function fetchKiryuu({ page, pageSize, orderby, meta_key, search }) {
  let url;
  if (search) {
    url = `${KIRYUU}/wp-json/wp/v2/manga?search=${encodeURIComponent(search)}&per_page=${pageSize}&page=${page}&_embed`;
  } else {
    url = `${KIRYUU}/wp-json/wp/v2/manga?per_page=${pageSize}&page=${page}&orderby=${orderby || 'modified'}&order=desc&_embed`;
    if (meta_key) url += `&meta_key=${meta_key}`;
  }

  const r = await fetch(url, { headers: KRY_HEADERS, cache: 'no-store' });
  if (!r.ok) throw new Error(`Kiryuu ${r.status}`);
  const j = await r.json();

  return (Array.isArray(j) ? j : []).map(item => {
    const cls = Array.isArray(item.class_list)
      ? item.class_list
      : item.class_list && typeof item.class_list === 'object'
        ? Object.values(item.class_list)
        : [];
    return {
      source:    'kiryuu',
      id:        item.slug || '',
      slug:      item.slug || '',
      title:      decodeHtml(item.title?.rendered || ''),
      cover:     item._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      status:    cls.includes('status-ongoing') ? 'ongoing' : cls.includes('status-completed') ? 'completed' : '',
      updatedAt: item.modified ? item.modified + '+07:00' : '',
      url:       `https://v2.kiryuu.to/manga/${item.slug || ''}`,
    };
  });
}

// ─── DEDUPLICATE ─────────────────────────────────────────────────────────────

export function deduplicate(comics) {
  const map = new Map();
  for (const c of comics) {
    const key = normalizeTitle(c.title);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, c);
    } else {
      const te = existing.updatedAt ? new Date(existing.updatedAt).getTime() : Infinity;
      const tc = c.updatedAt ? new Date(c.updatedAt).getTime() : Infinity;
      // Pilih yang updatedAt paling kecil (paling duluan sampai)
      if (tc < te) map.set(key, c);
    }
  }
  return [...map.values()];
}
