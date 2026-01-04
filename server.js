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

app.get('/', (req, res) => {
  res.json({ name: '🤖 Collab Detector API', status: 'running' });
});

app.get('/api/collabs', (req, res) => {
  res.json({ success: true, count: db.getAllCollabs().length, data: db.getAllCollabs() });
});

app.get('/api/collabs/latest', (req, res) => {
  res.json({ success: true, data: db.getLatestCollabs(10) });
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
  res.json({ success: true, data: db.getStats() });
});

app.get('/api/brands', (req, res) => {
  res.json({ success: true, data: detector.BRANDS });
});

app.post('/api/scan', async (req, res) => {
  const results = await runFullScan();
  res.json({ success: true, newCollabs: results.length, data: results });
});

async function runFullScan() {
  console.log('🤖 Scan en cours...');
  const articles = await scraper.scrapeAll();
  const collabs = detector.detectCollabs(articles);
  const newCollabs = [];
  for (const collab of collabs) {
    if (db.saveCollab(collab)) newCollabs.push(collab);
  }
  db.updateLastScan();
  console.log('✅ ' + newCollabs.length + ' nouvelles collabs');
  return newCollabs;
}

cron.schedule('*/5 * * * *', () => runFullScan());

app.listen(PORT, () => {
  console.log('🤖 Collab Detector API running on port ' + PORT);
  setTimeout(runFullScan, 2000);
});
