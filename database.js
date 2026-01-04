// ============================================
// 🗄️ DATABASE - LuxeStyleFinder Backend
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

// ============================================
// COLLABS FUNCTIONS
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
// USER FUNCTIONS
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
// WISHLIST FUNCTIONS
// ============================================
function getWishlist(userId) {
  return wishlists[userId] || [];
}

function addToWishlist(userId, item) {
  if (!wishlists[userId]) wishlists[userId] = [];
  const exists = wishlists[userId].find(w => w.id === item.id);
  if (exists) return false;
  wishlists[userId].unshift({
    ...item,
    addedAt: new Date().toISOString()
  });
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

function clearWishlist(userId) {
  wishlists[userId] = [];
  return true;
}

// ============================================
// RELEASE CALENDAR FUNCTIONS
// ============================================
function addRelease(release) {
  const id = 'rel_' + Date.now();
  releases.push({
    id: id,
    name: release.name,
    brand: release.brand,
    date: release.date,
    time: release.time || '10:00',
    price: release.price,
    image: release.image,
    url: release.url,
    category: release.category || 'Sneakers',
    hot: release.hot || false,
    createdAt: new Date().toISOString()
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
// PRICE TRACKER FUNCTIONS
// ============================================
function addPricePoint(productId, price, source) {
  if (!priceHistory[productId]) priceHistory[productId] = [];
  priceHistory[productId].push({
    price: price,
    source: source,
    date: new Date().toISOString()
  });
  if (priceHistory[productId].length > 100) {
    priceHistory[productId] = priceHistory[productId].slice(-100);
  }
  return true;
}

function getPriceHistory(productId) {
  return priceHistory[productId] || [];
}

function getLowestPrice(productId) {
  const history = priceHistory[productId] || [];
  if (history.length === 0) return null;
  return history.reduce((min, p) => p.price < min.price ? p : min, history[0]);
}

function getAllPriceTracked() {
  return Object.keys(priceHistory).map(id => ({
    productId: id,
    currentPrice: priceHistory[id][priceHistory[id].length - 1],
    lowestPrice: getLowestPrice(id),
    history: priceHistory[id]
  }));
}

// ============================================
// ALERTS FUNCTIONS
// ============================================
function createAlert(userId, alert) {
  const id = 'alert_' + Date.now();
  alerts.push({
    id: id,
    userId: userId,
    type: alert.type,
    productId: alert.productId,
    productName: alert.productName,
    targetPrice: alert.targetPrice,
    releaseId: alert.releaseId,
    active: true,
    createdAt: new Date().toISOString()
  });
  return id;
}

function getUserAlerts(userId) {
  return alerts.filter(a => a.userId === userId && a.active);
}

function deleteAlert(alertId) {
  const index = alerts.findIndex(a => a.id === alertId);
  if (index === -1) return false;
  alerts.splice(index, 1);
  return true;
}

function checkPriceAlerts(productId, currentPrice) {
  const triggered = alerts.filter(a => 
    a.type === 'price' && 
    a.productId === productId && 
    a.active && 
    currentPrice <= a.targetPrice
  );
  triggered.forEach(a => a.active = false);
  return triggered;
}

// ============================================
// INIT SAMPLE DATA
// ============================================
function initSampleReleases() {
  const sampleReleases = [
    { name: 'Air Jordan 1 High OG "Black/White"', brand: 'Jordan', date: '2026-01-10', price: 180, category: 'Sneakers', hot: true },
    { name: 'Adidas Yeezy Boost 350 V2 "Granite"', brand: 'Adidas', date: '2026-01-12', price: 230, category: 'Sneakers', hot: true },
    { name: 'Nike Dunk Low "Valentine\'s Day"', brand: 'Nike', date: '2026-01-15', price: 120, category: 'Sneakers', hot: false },
    { name: 'New Balance 550 x Aimé Leon Dore', brand: 'New Balance', date: '2026-01-18', price: 150, category: 'Sneakers', hot: true },
    { name: 'Supreme Box Logo Hoodie SS26', brand: 'Supreme', date: '2026-01-20', price: 168, category: 'Streetwear', hot: true },
    { name: 'Nike x Travis Scott Air Max 1', brand: 'Nike', date: '2026-01-25', price: 160, category: 'Sneakers', hot: true },
    { name: 'Adidas Samba OG "White/Gum"', brand: 'Adidas', date: '2026-01-08', price: 100, category: 'Sneakers', hot: false },
    { name: 'Palace x Gucci Collection', brand: 'Palace', date: '2026-02-01', price: 450, category: 'Streetwear', hot: true }
  ];
  sampleReleases.forEach(r => addRelease(r));
}

initSampleReleases();

// ============================================
// EXPORTS
// ============================================
module.exports = {
  // Collabs
  saveCollab, getAllCollabs, getLatestCollabs, getHotCollabs, searchCollabs, getCollabStats, updateLastScan,
  // Users
  createUser, loginUser, getUser,
  // Wishlist
  getWishlist, addToWishlist, removeFromWishlist, clearWishlist,
  // Releases
  addRelease, getAllReleases, getUpcomingReleases, getTodayReleases, deleteRelease,
  // Prices
  addPricePoint, getPriceHistory, getLowestPrice, getAllPriceTracked,
  // Alerts
  createAlert, getUserAlerts, deleteAlert, checkPriceAlerts
};
