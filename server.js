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
// 🏠 HOME
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    name: '🤖 LuxeStyleFinder API', 
    version: '2.0.0',
    status: 'running',
    endpoints: {
      collabs: '/api/collabs',
      users: '/api/users',
      wishlist: '/api/wishlist',
      releases: '/api/releases',
      prices: '/api/prices',
      alerts: '/api/alerts'
    }
  });
});

// ============================================
// 🔥 COLLABS ENDPOINTS
// ============================================
app.get('/api/collabs', (req, res) => {
  res.json({ success: true, count: db.getAllCollabs().length, data: db.getAllCollabs() });
});

app.get('/api/collabs/latest', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ success: true, data: db.getLatestCollabs(limit) });
});

app.get('/api/collabs/hot', (req, res) => {
  res.json({ success: true, data: db.getHotCollabs() });
});

app.get('/api/collabs/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Paramètre q requis' });
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
  res.json({ success: true, newCollabs: results.length, data: results });
});

// ============================================
// 👤 USERS ENDPOINTS
// ============================================
app.post('/api/users/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et password requis' });
  }
  const user = db.createUser(email, password, name);
  if (!user) {
    return res.status(400).json({ success: false, error: 'Email déjà utilisé' });
  }
  res.json({ success: true, data: user });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et password requis' });
  }
  const user = db.loginUser(email, password);
  if
