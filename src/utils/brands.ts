/**
 * Curated list of registrable domain labels for well-known retailers.
 * Used for typosquat detection via Levenshtein distance.
 */
export const KNOWN_BRANDS: string[] = [
  // Mega-retailers
  'amazon', 'ebay', 'walmart', 'target', 'costco', 'bestbuy',
  'homedepot', 'lowes', 'kroger', 'walgreens', 'cvs',
  // Department / Luxury
  'macys', 'nordstrom', 'neiman', 'saks', 'bloomingdales', 'jcpenney',
  'kohls', 'marshalls', 'tjmaxx', 'ross',
  // Shoes / Apparel
  'zappos', 'nike', 'adidas', 'underarmour', 'gap', 'oldnavy',
  'hm', 'zara', 'uniqlo', 'asos', 'shein', 'fashionnova',
  'victoriassecret', 'forever21', 'lululemon', 'patagonia', 'northface',
  'columbia', 'timberland', 'vans', 'converse',
  // Electronics
  'apple', 'samsung', 'sony', 'dell', 'hp', 'lenovo', 'microsoft',
  'newegg', 'bhphotovideo', 'adorama', 'anker',
  // Audio
  'bose', 'beats', 'jbl', 'sennheiser', 'logitech', 'razer',
  // Home
  'ikea', 'wayfair', 'overstock', 'crateandbarrel', 'potterybarn',
  'williams', 'westelm', 'anthropologie', 'urbn',
  // Beauty
  'sephora', 'ulta', 'maccosmetics', 'urbandecay', 'glossier',
  // Outdoor / Sports
  'rei', 'dickssportinggoods', 'footlocker', 'finishline', 'champs',
  // General / Marketplace
  'etsy', 'wish', 'aliexpress', 'alibaba', 'rakuten', 'poshmark',
  'mercari', 'depop', 'threadup',
  // Food / Delivery
  'chewy', 'petco', 'petsmart',
  // Office
  'staples', 'officedepot',
  // Gaming
  'gamestop', 'steampowered', 'epicgames',
  // Subscriptions / Books
  'audible', 'kindle', 'barnesandnoble',
];

/**
 * Compute the Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Extract the registrable label from a hostname.
 * e.g. "www.amaz0n.com" → "amaz0n"
 */
export function extractLabel(hostname: string): string {
  const parts = hostname.replace(/^www\./, '').split('.');
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}
