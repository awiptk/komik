const SHINIGAMI = 'https://api.shngm.io';
const KIRYUU    = 'https://v2.kiryuu.to';
const BASE_URL  = 'https://komik-mauve.vercel.app';

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

  const url = `${BASE_URL}/api/komikcast?path=${encodeURIComponent(path)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Komikcast ${r.status}`);
  const j = await r.json();

  return (j.data || []).map(item => ({
    source:    'komikcast',
    id:        item.data?.slug || '',
    slug:      item.data?.slug || '',
    title:     item.data?.title || '',
    cover:     item.data?.coverImage || '',
    status:    item.data?.status || '',
    updatedAt: item.updatedAt || '',
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
    const cls = item.class_list || [];
    return {
      source:    'kiryuu',
      id:        item.slug || '',
      slug:      item.slug || '',
      title:     item.title?.rendered || '',
      cover:     item._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      status:    cls.includes('status-ongoing') ? 'ongoing' : cls.includes('status-completed') ? 'completed' : '',
      updatedAt: item.modified || '',
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
      const te = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const tc = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
      if (tc > te) map.set(key, c);
    }
  }
  return [...map.values()];
}