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

// ─── SIMILARITY (token overlap / Jaccard) ────────────────────────────────────

function similarity(a, b) {
  const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
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
    updatedAt: item.latest_chapter_time || item.updated_at || '',
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

  const r = await fetch(`${KOMIKCAST}${path}`, { headers: KC_HEADERS, cache: 'no-store' });
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
      source:    'kiryuu',
      id:        item.slug || '',
      slug:      item.slug || '',
      title:     decodeHtml(item.title?.rendered || ''),
      cover:     item._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      status:    cls.includes('status-ongoing') ? 'ongoing' : cls.includes('status-completed') ? 'completed' : '',
      updatedAt: chapterMap[item.slug] || '',
      url:       `https://v2.kiryuu.to/manga/${item.slug || ''}`,
    };
  });
}

// ─── DEDUPLICATE (fuzzy matching) ─────────────────────────────────────────────
// Menggunakan Jaccard token overlap agar judul yang sedikit berbeda
// (mis. beda terjemahan antar sumber) tetap dianggap duplikat.
// THRESHOLD: 0.0–1.0, makin tinggi makin ketat (default 0.55)

const THRESHOLD = 0.7;

export function deduplicate(comics) {
  const groups = []; // tiap elemen: [normalized_key, comic]

  for (const c of comics) {
    const key = normalizeTitle(c.title);
    if (!key) continue;

    let matched = -1;
    let bestScore = 0;

    for (let i = 0; i < groups.length; i++) {
      const score = similarity(key, groups[i][0]);
      if (score > THRESHOLD && score > bestScore) {
        bestScore = score;
        matched = i;
      }
    }

    if (matched === -1) {
      // Komik baru, tambah ke list
      groups.push([key, c]);
    } else {
      // Duplikat — updatedAt terbaru menang
      const existing = groups[matched][1];
      const te = existing.updatedAt && !isNaN(new Date(existing.updatedAt))
        ? new Date(existing.updatedAt).getTime() : 0;
      const tc = c.updatedAt && !isNaN(new Date(c.updatedAt))
        ? new Date(c.updatedAt).getTime() : 0;
      if (tc > te) groups[matched][1] = c;
    }
  }

  return groups.map(g => g[1]);
}
