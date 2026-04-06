export const SHINIGAMI = 'https://api.shngm.io';
export const KIRYUU    = 'https://v2.kiryuu.to';
export const KOMIKCAST = 'https://be.komikcast.fit';

const SHN_HEADERS = {
  'Origin':  'https://c.shinigami.asia',
  'Referer': 'https://c.shinigami.asia/',
  'Accept':  'application/json',
  'User-Agent': 'Mozilla/5.0',
};
const KRY_HEADERS = {
  'Origin':  'https://v2.kiryuu.to',
  'Referer': 'https://v2.kiryuu.to/',
  'Accept':  'application/json',
  'User-Agent': 'Mozilla/5.0',
};
const KC_HEADERS = {
  'Origin':  'https://v1.komikcast.fit',
  'Referer': 'https://v1.komikcast.fit/',
  'Accept':  'application/json',
};

// ─── HTML DECODER ────────────────────────────────────────────────────────────

export function decodeHtml(str) {
  return (str || '').replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// ─── NORMALIZER ──────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return decodeHtml(t).toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── PARSE ALT TITLES ────────────────────────────────────────────────────────
// Split string judul alternatif berdasarkan pemisah umum (/ atau ,)
// lalu normalize tiap judul, buang yang kosong atau non-latin pendek

function parseAltTitles(str) {
  if (!str) return [];
  return str.split(/[\/,]/)
    .map(t => normalizeTitle(t.trim()))
    .filter(t => t.length > 3);
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
    source:     'shinigami',
    id:         item.manga_id || item.mangaId || '',
    slug:       item.manga_id || item.mangaId || '',
    title:      item.title || '',
    altTitles:  parseAltTitles(item.alternative_title || ''),
    cover:      item.cover_portrait_url || item.cover_image_url || '',
    status:     item.status === 1 ? 'ongoing' : item.status === 2 ? 'completed' : '',
    updatedAt:  item.latest_chapter_time || item.updated_at || '',
    url:        `https://c.shinigami.asia/series/${item.manga_id || item.mangaId || ''}`,
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

  const r = await fetch(`${KOMIKCAST}${path}`, { headers: KC_HEADERS, cache: 'no-store' });
  if (!r.ok) throw new Error(`Komikcast ${r.status}`);
  const j = await r.json();

  return (j.data || []).map(item => ({
    source:     'komikcast',
    id:         String(item.id || ''),
    slug:       item.data?.slug || '',
    title:      item.data?.title || '',
    altTitles:  parseAltTitles(item.data?.nativeTitle || ''),
    cover:      item.data?.coverImage || '',
    status:     item.data?.status || '',
    updatedAt:  item.updatedAt || '',
    url:        `https://v1.komikcast.fit/series/${item.data?.slug || ''}`,
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

  const [mangaRes, chapterRes] = await Promise.all([
    fetch(url, { headers: KRY_HEADERS, cache: 'no-store' }),
    fetch(`${KIRYUU}/wp-json/wp/v2/chapter?per_page=50&orderby=date&order=desc`, { headers: KRY_HEADERS, cache: 'no-store' }),
  ]);

  if (!mangaRes.ok) throw new Error(`Kiryuu ${mangaRes.status}`);

  const j = await mangaRes.json();

  const chapterMap = {};
  if (chapterRes.ok) {
    const chapters = await chapterRes.json();
    for (const ch of chapters) {
      const slug = ch.slug || '';
      const date = ch.date_gmt || '';
      const mangaSlug = slug.replace(/-chapter-[\d-]+$/, '');
      if (!chapterMap[mangaSlug]) {
        chapterMap[mangaSlug] = date + 'Z';
      }
    }
  }

  return (Array.isArray(j) ? j : []).map(item => {
    const cls = Array.isArray(item.class_list)
      ? item.class_list
      : item.class_list && typeof item.class_list === 'object'
        ? Object.values(item.class_list)
        : [];
    return {
      source:     'kiryuu',
      id:         item.slug || '',
      slug:       item.slug || '',
      title:      decodeHtml(item.title?.rendered || ''),
      altTitles:  parseAltTitles(item.metadata?.meta?.alternative_title || ''),
      cover:      item._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      status:     cls.includes('status-ongoing') ? 'ongoing' : cls.includes('status-completed') ? 'completed' : '',
      updatedAt:  chapterMap[item.slug] || '',
      url:        `https://v2.kiryuu.to/manga/${item.slug || ''}`,
    };
  });
}

// ─── DEDUPLICATE (alt title matching) ────────────────────────────────────────
// Match berdasarkan title atau altTitles — tanpa fuzzy.
// Kalau ada satu judul yang sama persis antar komik → duplikat.

export function deduplicate(comics) {
  const groups = []; // tiap elemen: { keys: Set<string>, comic }

  for (const c of comics) {
    const mainKey = normalizeTitle(c.title);
    if (!mainKey) continue;

    // Kumpulkan semua judul komik ini
    const keys = new Set([mainKey, ...c.altTitles]);

    // Cari group yang punya irisan judul
    let matched = -1;
    for (let i = 0; i < groups.length; i++) {
      for (const k of keys) {
        if (k && groups[i].keys.has(k)) {
          matched = i;
          break;
        }
      }
      if (matched !== -1) break;
    }

    if (matched === -1) {
      // Komik baru
      groups.push({ keys, comic: c });
    } else {
      // Duplikat — merge keys, updatedAt terbaru menang
      for (const k of keys) groups[matched].keys.add(k);
      const existing = groups[matched].comic;
      const te = existing.updatedAt && !isNaN(new Date(existing.updatedAt))
        ? new Date(existing.updatedAt).getTime() : 0;
      const tc = c.updatedAt && !isNaN(new Date(c.updatedAt))
        ? new Date(c.updatedAt).getTime() : 0;
      if (tc > te) groups[matched].comic = c;
    }
  }

  return groups.map(g => g.comic);
}
