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
  res.json({ 
    name: 'LuxeStyleFinder API', 
    version: '2.0.0',
    status: 'running'
  });
});

// ============================================
// COLLABS
// ============================================
app.get('/api/collabs', (req, res) => {
  res.json({ success: true, data: db.getAllCollabs() });
});

app.get('/api/collabs/latest', (req, res) => {
  res.json({ success: true, data: db.getLatestCollabs(10) });
});

app.get('/api/collabs/hot', (req, res) => {
  res.json({ success: true, data: db.getHotCollabs() });
});

app.get('/api/collabs/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q requis' });
  res.json({ success: true, data: db.searchCollabs(q) });
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
  const item = req.body;
  if (!item.id || !item.name) return res.status(400).json({ error: 'id et name requis' });
  const added = db.addToWishlist(req.params.userId, item);
  res.json({ success: added });
});

app.delete('/api/wishlist/:userId/:itemId', (req, res) => {
  const removed = db.removeFromWishlist(req.params.userId, req.params.itemId);
  res.json({ success: removed });
});

// ============================================
// RELEASES
// ============================================
app.get('/api/releases', (req, res) => {
  res.json({ success: true, data: db.getAllReleases() });
});

app.get('/api/releases/upcoming', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  res.json({ success: true, data: db.getUpcomingReleases(days) });
});

app.get('/api/releases/today', (req, res) => {
  res.json({ success: true, data: db.getTodayReleases() });
});

app.post('/api/releases', (req, res) => {
  const release = req.body;
  if (!release.name || !release.date) return res.status(400).json({ error: 'name et date requis' });
  const id = db.addRelease(release);
  res.json({ success: true, id: id });
});

app.delete('/api/releases/:id', (req, res) => {
  const deleted = db.deleteRelease(req.params.id);
  res.json({ success: deleted });
});

// ============================================
// PRICES
// ============================================
app.get('/api/prices/:productId', (req, res) => {
  res.json({ success: true, data: db.getPriceHistory(req.params.productId) });
});

app.get('/api/prices/:productId/lowest', (req, res) => {
  res.json({ success: true, data: db.getLowestPrice(req.params.productId) });
});

app.post('/api/prices/:productId', (req, res) => {
  const { price, source } = req.body;
  if (!price) return res.status(400).json({ error: 'price requis' });
  db.addPricePoint(req.params.productId, price, source);
  res.json({ success: true });
});

// ============================================
// ALERTS
// ============================================
app.get('/api/alerts/:userId', (req, res) => {
  res.json({ success: true, data: db.getUserAlerts(req.params.userId) });
});

app.post('/api/alerts/:userId', (req, res) => {
  const alert = req.body;
  if (!alert.type) return res.status(400).json({ error: 'type requis' });
  const id = db.createAlert(req.params.userId, alert);
  res.json({ success: true, id: id });
});

app.delete('/api/alerts/:alertId', (req, res) => {
  const deleted = db.deleteAlert(req.params.alertId);
  res.json({ success: deleted });
});

// ============================================
// SCAN FUNCTION
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
  console.log('LuxeStyleFinder API running on port ' + PORT);
  setTimeout(runFullScan, 2000);
});
