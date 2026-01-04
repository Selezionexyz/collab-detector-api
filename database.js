// ============================================
// DATABASE - LuxeStyleFinder Backend V3
// ============================================

// === COLLABS ===
let collabs = [];
let collabStats = { totalScans: 0, lastScan: null };

// === USERS ===
let users = [];

// === WISHLISTS ===
let wishlists = {};

// === RELEASES ===
let releases = [];

// === PRICE HISTORY ===
let priceHistory = {};

// === ALERTS ===
let alerts = [];

// === PORTFOLIO ===
let portfolios = {};

// === SEARCH HISTORY ===
let searchHistory = {};

// === SCAN HISTORY ===
let scanHistory = {};

// === TRENDING ===
let trendingSearches = [];

// === NOTES ===
let productNotes = {};

// ============================================
// COLLABS
// ============================================
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
  if (collabs.length > 500) collabs = collabs.slice(0, 500);
  return true;
}

function getAllCollabs() { return collabs; }
function getLatestCollabs(n) { return collabs.slice(0, n); }
function getHotCollabs() { return collabs.filter(c => c.hot).slice(0, 20); }
function searchCollabs(q) {
  const query = q.toLowerCase();
  addTrendingSearch(q);
  return collabs.filter(c => c.title.toLowerCase().includes(query) || c.brands.some(b => b.toLowerCase().includes(query))).slice(0, 30);
}
function getCollabStats() {
  return { totalScans: collabStats.totalScans, totalCollabs: collabs.length, hotCollabs: collabs.filter(c => c.hot).length, lastScan: collabStats.lastScan };
}
function updateLastScan() {
  collabStats.totalScans++;
  collabStats.lastScan = new Date().toISOString();
}

// ============================================
// USERS
// ============================================
function createUser(email, password, name) {
  if (users.find(u => u.email === email)) return null;
  const user = {
    id: 'user_' + Date.now(),
    email: email,
    password: password,
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString()
  };
  users.push(user);
  wishlists[user.id] = [];
  portfolios[user.id] = [];
  searchHistory[user.id] = [];
  scanHistory[user.id] = [];
  productNotes[user.id] = {};
  return { id: user.id, email: user.email, name: user.name };
}

function loginUser(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

function getUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

// ============================================
// WISHLIST
// ============================================
function getWishlist(userId) { return wishlists[userId] || []; }

function addToWishlist(userId, item) {
  if (!wishlists[userId]) wishlists[userId] = [];
  const exists = wishlists[userId].find(w => w.id === item.id);
  if (exists) return false;
  wishlists[userId].unshift({ ...item, addedAt: new Date().toISOString() });
  if (wishlists[userId].length > 100) wishlists[userId] = wishlists[userId].slice(0, 100);
  return true;
}

function removeFromWishlist(userId, itemId) {
  if (!wishlists[userId]) return false;
  const index = wishlists[userId].findIndex(w => w.id === itemId);
  if (index === -1) return false;
  wishlists[userId].splice(index, 1);
  return true;
}

// ============================================
// RELEASES
// ============================================
function addRelease(release) {
  const id = 'rel_' + Date.now() + Math.random().toString(36).substr(2, 5);
  releases.push({
    id, name: release.name, brand: release.brand, date: release.date,
    time: release.time || '10:00', price: release.price, image: release.image,
    url: release.url, category: release.category || 'Sneakers',
    hot: release.hot || false, createdAt: new Date().toISOString()
  });
  return id;
}

function getAllReleases() {
  const now = new Date();
  return releases.filter(r => new Date(r.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getUpcomingReleases(days) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return releases.filter(r => {
    const d = new Date(r.date);
    return d >= now && d <= future;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getTodayReleases() {
  const today = new Date().toISOString().split('T')[0];
  return releases.filter(r => r.date === today);
}

function deleteRelease(id) {
  const index = releases.findIndex(r => r.id === id);
  if (index === -1) return false;
  releases.splice(index, 1);
  return true;
}

// ============================================
// PRICE HISTORY
// ============================================
function addPricePoint(productId, price, source) {
  if (!priceHistory[productId]) priceHistory[productId] = [];
  priceHistory[productId].push({ price, source, date: new Date().toISOString() });
  if (priceHistory[productId].length > 100) priceHistory[productId] = priceHistory[productId].slice(-100);
  return true;
}

function getPriceHistory(productId) { return priceHistory[productId] || []; }

function getLowestPrice(productId) {
  const history = priceHistory[productId] || [];
  if (history.length === 0) return null;
  return history.reduce((min, p) => p.price < min.price ? p : min, history[0]);
}

function getHighestPrice(productId) {
  const history = priceHistory[productId] || [];
  if (history.length === 0) return null;
  return history.reduce((max, p) => p.price > max.price ? p : max, history[0]);
}

function getPriceStats(productId) {
  const history = priceHistory[productId] || [];
  if (history.length === 0) return null;
  const prices = history.map(h => h.price);
  return {
    current: prices[prices.length - 1],
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    change: prices.length > 1 ? Math.round((prices[prices.length - 1] - prices[0]) / prices[0] * 100) : 0,
    dataPoints: prices.length
  };
}

// ============================================
// ALERTS
// ============================================
function createAlert(userId, alert) {
  const id = 'alert_' + Date.now();
  alerts.push({
    id, userId, type: alert.type, productId: alert.productId,
    productName: alert.productName, targetPrice: alert.targetPrice,
    releaseId: alert.releaseId, active: true, createdAt: new Date().toISOString()
  });
  return id;
}

function getUserAlerts(userId) { return alerts.filter(a => a.userId === userId && a.active); }

function deleteAlert(alertId) {
  const index = alerts.findIndex(a => a.id === alertId);
  if (index === -1) return false;
  alerts.splice(index, 1);
  return true;
}

// ============================================
// PORTFOLIO
// ============================================
function addToPortfolio(userId, item) {
  if (!portfolios[userId]) portfolios[userId] = [];
  const id = 'port_' + Date.now();
  portfolios[userId].push({
    id, name: item.name, brand: item.brand, size: item.size,
    buyPrice: item.buyPrice, buyDate: item.buyDate || new Date().toISOString().split('T')[0],
    currentPrice: item.currentPrice || item.buyPrice,
    image: item.image, condition: item.condition || 'DS',
    addedAt: new Date().toISOString()
  });
  return id;
}

function getPortfolio(userId) { return portfolios[userId] || []; }

function updatePortfolioItem(userId, itemId, updates) {
  if (!portfolios[userId]) return false;
  const item = portfolios[userId].find(p => p.id === itemId);
  if (!item) return false;
  Object.assign(item, updates);
  return true;
}

function removeFromPortfolio(userId, itemId) {
  if (!portfolios[userId]) return false;
  const index = portfolios[userId].findIndex(p => p.id === itemId);
  if (index === -1) return false;
  portfolios[userId].splice(index, 1);
  return true;
}

function getPortfolioStats(userId) {
  const items = portfolios[userId] || [];
  if (items.length === 0) return { totalItems: 0, totalInvested: 0, currentValue: 0, profit: 0, profitPercent: 0 };
  const totalInvested = items.reduce((sum, i) => sum + (i.buyPrice || 0), 0);
  const currentValue = items.reduce((sum, i) => sum + (i.currentPrice || i.buyPrice || 0), 0);
  const profit = currentValue - totalInvested;
  return {
    totalItems: items.length,
    totalInvested: Math.round(totalInvested),
    currentValue: Math.round(currentValue),
    profit: Math.round(profit),
    profitPercent: totalInvested > 0 ? Math.round(profit / totalInvested * 100) : 0,
    brands: [...new Set(items.map(i => i.brand).filter(Boolean))]
  };
}

// ============================================
// SEARCH HISTORY
// ============================================
function addSearchHistory(userId, query, results) {
  if (!searchHistory[userId]) searchHistory[userId] = [];
  searchHistory[userId].unshift({ query, resultsCount: results, date: new Date().toISOString() });
  if (searchHistory[userId].length > 50) searchHistory[userId] = searchHistory[userId].slice(0, 50);
}

function getSearchHistory(userId) { return searchHistory[userId] || []; }

function clearSearchHistory(userId) { searchHistory[userId] = []; return true; }

// ============================================
// SCAN HISTORY
// ============================================
function addScanHistory(userId, scan) {
  if (!scanHistory[userId]) scanHistory[userId] = [];
  scanHistory[userId].unshift({
    id: 'scan_' + Date.now(),
    image: scan.image, results: scan.results,
    date: new Date().toISOString()
  });
  if (scanHistory[userId].length > 30) scanHistory[userId] = scanHistory[userId].slice(0, 30);
}

function getScanHistory(userId) { return scanHistory[userId] || []; }

// ============================================
// TRENDING
// ============================================
function addTrendingSearch(query) {
  const existing = trendingSearches.find(t => t.query.toLowerCase() === query.toLowerCase());
  if (existing) {
    existing.count++;
    existing.lastSearched = new Date().toISOString();
  } else {
    trendingSearches.push({ query, count: 1, lastSearched: new Date().toISOString() });
  }
  trendingSearches.sort((a, b) => b.count - a.count);
  if (trendingSearches.length > 100) trendingSearches = trendingSearches.slice(0, 100);
}

function getTrending(limit) {
  return trendingSearches.slice(0, limit || 10);
}

// ============================================
// NOTES
// ============================================
function addNote(userId, productId, note) {
  if (!productNotes[userId]) productNotes[userId] = {};
  productNotes[userId][productId] = { note, updatedAt: new Date().toISOString() };
  return true;
}

function getNote(userId, productId) {
  return productNotes[userId]?.[productId] || null;
}

function getAllNotes(userId) { return productNotes[userId] || {}; }

// ============================================
// RECOMMENDATIONS
// ============================================
function getRecommendations(userId) {
  const wishlist = wishlists[userId] || [];
  const portfolio = portfolios[userId] || [];
  const allItems = [...wishlist, ...portfolio];
  
  if (allItems.length === 0) {
    return collabs.filter(c => c.hot).slice(0, 5).map(c => ({
      type: 'collab', name: c.title, brands: c.brands, reason: 'Trending'
    }));
  }
  
  const brands = allItems.map(i => i.brand).filter(Boolean);
  const topBrands = [...new Set(brands)].slice(0, 3);
  
  const recs = [];
  
  // Recommend collabs from favorite brands
  collabs.filter(c => c.brands.some(b => topBrands.some(tb => b.toLowerCase().includes(tb.toLowerCase()))))
    .slice(0, 3).forEach(c => {
      recs.push({ type: 'collab', name: c.title, brands: c.brands, reason: 'Based on your favorites' });
    });
  
  // Recommend upcoming releases
  const upcoming = getAllReleases().filter(r => topBrands.some(b => r.brand?.toLowerCase().includes(b.toLowerCase()))).slice(0, 2);
  upcoming.forEach(r => {
    recs.push({ type: 'release', name: r.name, brand: r.brand, date: r.date, reason: 'Upcoming from ' + r.brand });
  });
  
  return recs.slice(0, 6);
}

// ============================================
// INIT SAMPLE DATA
// ============================================
function initSampleReleases() {
  const samples = [
    { name: 'Air Jordan 1 High OG "Black/White"', brand: 'Jordan', date: '2026-01-10', price: 180, hot: true },
    { name: 'Adidas Yeezy Boost 350 V2 "Granite"', brand: 'Adidas', date: '2026-01-12', price: 230, hot: true },
    { name: 'Nike Dunk Low "Valentine\'s Day"', brand: 'Nike', date: '2026-01-15', price: 120, hot: false },
    { name: 'New Balance 550 x Aime Leon Dore', brand: 'New Balance', date: '2026-01-18', price: 150, hot: true },
    { name: 'Supreme Box Logo Hoodie SS26', brand: 'Supreme', date: '2026-01-20', price: 168, hot: true },
    { name: 'Nike x Travis Scott Air Max 1', brand: 'Nike', date: '2026-01-25', price: 160, hot: true },
    { name: 'Adidas Samba OG "White/Gum"', brand: 'Adidas', date: '2026-01-08', price: 100, hot: false },
    { name: 'Palace x Gucci Collection', brand: 'Palace', date: '2026-02-01', price: 450, hot: true },
    { name: 'Nike Air Force 1 Low "Color of the Month"', brand: 'Nike', date: '2026-01-22', price: 130, hot: false },
    { name: 'Asics Gel-Lyte III x Kith', brand: 'Asics', date: '2026-02-05', price: 180, hot: true }
  ];
  samples.forEach(r => addRelease(r));
}

initSampleReleases();

// ============================================
// EXPORTS
// ============================================
module.exports = {
  saveCollab, getAllCollabs, getLatestCollabs, getHotCollabs, searchCollabs, getCollabStats, updateLastScan,
  createUser, loginUser, getUser,
  getWishlist, addToWishlist, removeFromWishlist,
  addRelease, getAllReleases, getUpcomingReleases, getTodayReleases, deleteRelease,
  addPricePoint, getPriceHistory, getLowestPrice, getHighestPrice, getPriceStats,
  createAlert, getUserAlerts, deleteAlert,
  addToPortfolio, getPortfolio, updatePortfolioItem, removeFromPortfolio, getPortfolioStats,
  addSearchHistory, getSearchHistory, clearSearchHistory,
  addScanHistory, getScanHistory,
  getTrending, addTrendingSearch,
  addNote, getNote, getAllNotes,
  getRecommendations
};
