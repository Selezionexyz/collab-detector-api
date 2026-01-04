let collabs = [];
let stats = { totalScans: 0, lastScan: null };

function generateHash(title, brands) {
  const str = (title + brands.sort().join('-')).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
}

function saveCollab(collab) {
  const hash = generateHash(collab.title, collab.brands);
  if (collabs.find(c => c.hash === hash)) return false;
  collabs.unshift({
    id: collabs.length + 1,
    title: collab.title,
    brands: collab.brands,
    source: collab.source,
    sourceUrl: collab.sourceUrl,
    imageUrl: collab.imageUrl,
    category: collab.category,
    hot: collab.hot,
    detectedAt: new Date().toISOString(),
    hash: hash
  });
  if (collabs.length > 200) collabs = collabs.slice(0, 200);
  return true;
}

function getAllCollabs() { return collabs; }
function getLatestCollabs(n) { return collabs.slice(0, n); }
function getHotCollabs() { return collabs.filter(c => c.hot).slice(0, 20); }
function searchCollabs(q) {
  const query = q.toLowerCase();
  return collabs.filter(c => c.title.toLowerCase().includes(query) || c.brands.some(b => b.toLowerCase().includes(query))).slice(0, 30);
}
function getStats() {
  return { totalScans: stats.totalScans, totalCollabs: collabs.length, hotCollabs: collabs.filter(c => c.hot).length, lastScan: stats.lastScan };
}
function updateLastScan() {
  stats.totalScans++;
  stats.lastScan = new Date().toISOString();
}

module.exports = { saveCollab, getAllCollabs, getLatestCollabs, getHotCollabs, searchCollabs, getStats, updateLastScan };
