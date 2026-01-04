require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const db = require('./database');
const scraper = require('./scraper');
const detector = require('./detector');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================
// HOME
// ============================================
app.get('/', (req, res) => {
  res.json({ name: 'LuxeStyleFinder API', version: '3.0.0', status: 'running' });
});

// ============================================
// COLLABS
// ============================================
app.get('/api/collabs', (req, res) => {
  res.json({ success: true, data: db.getAllCollabs() });
});
app.get('/api/collabs/latest', (req, res) => {
  res.json({ success: true, data: db.getLatestCollabs(parseInt(req.query.limit) || 10) });
});
app.get('/api/collabs/hot', (req, res) => {
  res.json({ success: true, data: db.getHotCollabs() });
});
app.get('/api/collabs/search', (req, res) => {
  if (!req.query.q) return res.status(400).json({ error: 'q requis' });
  res.json({ success: true, data: db.searchCollabs(req.query.q) });
});
app.get('/api/stats', (req, res) => {
  res.json({ success: true, data: db.getCollabStats() });
});
app.get('/api/brands', (req, res) => {
  res.json({ success: true, data: detector.BRANDS });
});
app.post('/api/scan', async (req, res) => {
  const results = await runFullScan();
  res.json({ success: true, newCollabs: results.length });
});

// ============================================
// USERS
// ============================================
app.post('/api/users/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et password requis' });
  const user = db.createUser(email, password, name);
  if (!user) return res.status(400).json({ error: 'Email deja utilise' });
  res.json({ success: true, data: user });
});
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et password requis' });
  const user = db.loginUser(email, password);
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
  res.json({ success: true, data: user });
});

// ============================================
// WISHLIST
// ============================================
app.get('/api/wishlist/:userId', (req, res) => {
  res.json({ success: true, data: db.getWishlist(req.params.userId) });
});
app.post('/api/wishlist/:userId', (req, res) => {
  if (!req.body.id || !req.body.name) return res.status(400).json({ error: 'id et name requis' });
  res.json({ success: db.addToWishlist(req.params.userId, req.body) });
});
app.delete('/api/wishlist/:userId/:itemId', (req, res) => {
  res.json({ success: db.removeFromWishlist(req.params.userId, req.params.itemId) });
});

// ============================================
// RELEASES
// ============================================
app.get('/api/releases', (req, res) => {
  res.json({ success: true, data: db.getAllReleases() });
});
app.get('/api/releases/upcoming', (req, res) => {
  res.json({ success: true, data: db.getUpcomingReleases(parseInt(req.query.days) || 7) });
});
app.get('/api/releases/today', (req, res) => {
  res.json({ success: true, data: db.getTodayReleases() });
});
app.post('/api/releases', (req, res) => {
  if (!req.body.name || !req.body.date) return res.status(400).json({ error: 'name et date requis' });
  res.json({ success: true, id: db.addRelease(req.body) });
});
app.delete('/api/releases/:id', (req, res) => {
  res.json({ success: db.deleteRelease(req.params.id) });
});

// ============================================
// PRICES
// ============================================
app.get('/api/prices/:productId', (req, res) => {
  res.json({ success: true, data: db.getPriceHistory(req.params.productId) });
});
app.get('/api/prices/:productId/stats', (req, res) => {
  res.json({ success: true, data: db.getPriceStats(req.params.productId) });
});
app.post('/api/prices/:productId', (req, res) => {
  if (!req.body.price) return res.status(400).json({ error: 'price requis' });
  db.addPricePoint(req.params.productId, req.body.price, req.body.source);
  res.json({ success: true });
});

// ============================================
// ALERTS
// ============================================
app.get('/api/alerts/:userId', (req, res) => {
  res.json({ success: true, data: db.getUserAlerts(req.params.userId) });
});
app.post('/api/alerts/:userId', (req, res) => {
  if (!req.body.type) return res.status(400).json({ error: 'type requis' });
  res.json({ success: true, id: db.createAlert(req.params.userId, req.body) });
});
app.delete('/api/alerts/:alertId', (req, res) => {
  res.json({ success: db.deleteAlert(req.params.alertId) });
});

// ============================================
// PORTFOLIO
// ============================================
app.get('/api/portfolio/:userId', (req, res) => {
  res.json({ success: true, data: db.getPortfolio(req.params.userId) });
});
app.get('/api/portfolio/:userId/stats', (req, res) => {
  res.json({ success: true, data: db.getPortfolioStats(req.params.userId) });
});
app.post('/api/portfolio/:userId', (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'name requis' });
  res.json({ success: true, id: db.addToPortfolio(req.params.userId, req.body) });
});
app.put('/api/portfolio/:userId/:itemId', (req, res) => {
  res.json({ success: db.updatePortfolioItem(req.params.userId, req.params.itemId, req.body) });
});
app.delete('/api/portfolio/:userId/:itemId', (req, res) => {
  res.json({ success: db.removeFromPortfolio(req.params.userId, req.params.itemId) });
});

// ============================================
// SEARCH HISTORY
// ============================================
app.get('/api/history/search/:userId', (req, res) => {
  res.json({ success: true, data: db.getSearchHistory(req.params.userId) });
});
app.post('/api/history/search/:userId', (req, res) => {
  db.addSearchHistory(req.params.userId, req.body.query, req.body.results || 0);
  res.json({ success: true });
});
app.delete('/api/history/search/:userId', (req, res) => {
  res.json({ success: db.clearSearchHistory(req.params.userId) });
});

// ============================================
// SCAN HISTORY
// ============================================
app.get('/api/history/scan/:userId', (req, res) => {
  res.json({ success: true, data: db.getScanHistory(req.params.userId) });
});
app.post('/api/history/scan/:userId', (req, res) => {
  db.addScanHistory(req.params.userId, req.body);
  res.json({ success: true });
});

// ============================================
// TRENDING
// ============================================
app.get('/api/trending', (req, res) => {
  res.json({ success: true, data: db.getTrending(parseInt(req.query.limit) || 10) });
});

// ============================================
// NOTES
// ============================================
app.get('/api/notes/:userId', (req, res) => {
  res.json({ success: true, data: db.getAllNotes(req.params.userId) });
});
app.get('/api/notes/:userId/:productId', (req, res) => {
  res.json({ success: true, data: db.getNote(req.params.userId, req.params.productId) });
});
app.post('/api/notes/:userId/:productId', (req, res) => {
  if (!req.body.note) return res.status(400).json({ error: 'note requis' });
  res.json({ success: db.addNote(req.params.userId, req.params.productId, req.body.note) });
});

// ============================================
// RECOMMENDATIONS
// ============================================
app.get('/api/recommendations/:userId', (req, res) => {
  res.json({ success: true, data: db.getRecommendations(req.params.userId) });
});

// ============================================
// EXPORT
// ============================================
app.get('/api/export/:userId', (req, res) => {
  const data = {
    user: db.getUser(req.params.userId),
    portfolio: db.getPortfolio(req.params.userId),
    portfolioStats: db.getPortfolioStats(req.params.userId),
    wishlist: db.getWishlist(req.params.userId),
    alerts: db.getUserAlerts(req.params.userId),
    searchHistory: db.getSearchHistory(req.params.userId),
    exportedAt: new Date().toISOString()
  };
  res.json({ success: true, data });
});

// ============================================
// SCAN
// ============================================
async function runFullScan() {
  console.log('Scan en cours...');
  const articles = await scraper.scrapeAll();
  const collabs = detector.detectCollabs(articles);
  const newCollabs = [];
  for (const collab of collabs) {
    if (db.saveCollab(collab)) newCollabs.push(collab);
  }
  db.updateLastScan();
  console.log(newCollabs.length + ' nouvelles collabs');
  return newCollabs;
}

cron.schedule('*/5 * * * *', () => runFullScan());

app.listen(PORT, () => {
  console.log('LuxeStyleFinder API V3 running on port ' + PORT);
  setTimeout(runFullScan, 2000);
});
