const Parser = require('rss-parser');
const parser = new Parser({ timeout: 10000 });

const SOURCES = [
  { name: 'Hypebeast', url: 'https://hypebeast.com/feed' },
  { name: 'Sneaker News', url: 'https://sneakernews.com/feed/' },
  { name: 'Highsnobiety', url: 'https://www.highsnobiety.com/feed/' },
  { name: 'Nice Kicks', url: 'https://www.nicekicks.com/feed/' }
];

async function scrapeRSS(source) {
  try {
    console.log('📡 ' + source.name + '...');
    const feed = await parser.parseURL(source.url);
    return feed.items.slice(0, 15).map(item => ({
      title: item.title || '',
      description: item.contentSnippet || '',
      url: item.link || '',
      source: source.name,
      pubDate: item.pubDate,
      imageUrl: null
    }));
  } catch (e) {
    console.error('❌ ' + source.name + ': ' + e.message);
    return [];
  }
}

async function scrapeAll() {
  console.log('🕷️ Scraping...');
  let all = [];
  for (const source of SOURCES) {
    const articles = await scrapeRSS(source);
    all = all.concat(articles);
  }
  const seen = new Set();
  return all.filter(a => {
    const key = a.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { scrapeAll, SOURCES };
