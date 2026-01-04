const BRANDS = [
  'Nike', 'Jordan', 'Adidas', 'Yeezy', 'New Balance', 'Asics', 'Puma', 'Reebok', 'Converse', 'Vans',
  'Hoka', 'On Running', 'On', 'Salomon', 'Saucony',
  'Supreme', 'Palace', 'BAPE', 'Stussy', 'Kith', 'Off-White', 'Fear of God', 'Essentials',
  'Louis Vuitton', 'Gucci', 'Dior', 'Balenciaga', 'Prada', 'Loewe', 'Fendi', 'Burberry',
  'Comme des Garcons', 'CDG', 'Sacai', 'Undercover', 'Fragment', 'WTAPS', 'Neighborhood',
  'The North Face', 'Stone Island', 'Moncler', 'Arc teryx',
  'Travis Scott', 'Cactus Jack', 'Bad Bunny', 'Pharrell', 'Drake', 'NOCTA', 'Kanye',
  'Billie Eilish', 'Tyler the Creator', 'ASAP Rocky', 'J Balvin'
];

const COLLAB_KEYWORDS = ['collaboration', 'collab', ' x ', 'partnership', 'capsule', 'collection', 'limited edition', 'exclusive', 'drop', 'release'];

const HOT_KEYWORDS = ['travis scott', 'off-white', 'dior', 'louis vuitton', 'supreme', 'fragment', 'sacai', 'fear of god', 'bad bunny', 'drake', 'yeezy', 'balenciaga'];

function detectCollabs(articles) {
  const collabs = [];
  for (const article of articles) {
    const collab = analyzeArticle(article);
    if (collab) collabs.push(collab);
  }
  return collabs;
}

function analyzeArticle(article) {
  const text = (article.title + ' ' + (article.description || '')).toLowerCase();
  const hasKeyword = COLLAB_KEYWORDS.some(k => text.includes(k.toLowerCase()));
  const detected = [];
  for (const brand of BRANDS) {
    if (text.includes(brand.toLowerCase())) detected.push(brand);
  }
  if (detected.length < 2 && !(detected.length >= 1 && hasKeyword)) return null;
  const isHot = HOT_KEYWORDS.some(k => text.includes(k));
  return {
    title: article.title,
    brands: detected.filter((v, i, a) => a.indexOf(v) === i),
    source: article.source,
    sourceUrl: article.url,
    imageUrl: article.imageUrl,
    category: 'Sneakers',
    hot: isHot || detected.length >= 3
  };
}

module.exports = { detectCollabs, BRANDS, COLLAB_KEYWORDS };
