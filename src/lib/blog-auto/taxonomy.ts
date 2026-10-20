/**
 * Industries the automated blog writes for. E-commerce carries the most weight (it is the largest
 * share of EmmaForYou's work); every industry maps to a blog category and to the solution
 * categories whose pages are offered as internal links. Keywords drive relevance scoring.
 */
export interface Industry {
  id: string;
  label: string;
  /** Blog category shown on the article. */
  category: string;
  /** Relative share of articles (higher = more often). */
  weight: number;
  keywords: string[];
  /** Solution category slugs for internal links. */
  solutions: string[];
  /** Service slugs (/services/$slug) for internal links. */
  services: string[];
}

export const INDUSTRIES: Industry[] = [
  { id: "ecommerce", label: "E-commerce", category: "E-commerce", weight: 5, solutions: ["websites", "automation", "ai-solutions"], services: ["ecommerce", "website-design", "ad-marketing"],
    keywords: ["ecommerce", "e-commerce", "online store", "shopify", "woocommerce", "checkout", "cart", "marketplace", "dtc", "d2c", "conversion", "product page", "merchant", "retail", "shipping", "fulfillment", "payments", "black friday", "holiday sales", "amazon"] },
  { id: "payments", label: "Payments & fintech", category: "Payments & Fintech", weight: 2, solutions: ["business-apps", "websites"], services: ["ecommerce", "app-development"],
    keywords: ["payment", "payments", "fintech", "stripe", "paystack", "flutterwave", "checkout", "invoice", "subscription", "billing", "wallet", "bank", "fraud"] },
  { id: "search", label: "SEO & search", category: "SEO", weight: 3, solutions: ["websites"], services: ["website-design"],
    keywords: ["seo", "search", "google search", "ranking", "core update", "search console", "structured data", "core web vitals", "indexing", "serp", "ai overviews", "search ads"] },
  { id: "marketing", label: "Marketing & social", category: "Marketing & Promotion", weight: 3, solutions: ["automation", "ai-solutions"], services: ["social-media", "ad-marketing", "email-marketing"],
    keywords: ["marketing", "instagram", "facebook", "tiktok", "whatsapp", "meta", "ads", "advertising", "email marketing", "newsletter", "creator", "social media", "campaign", "brand", "influencer", "linkedin", "youtube"] },
  { id: "ai", label: "AI for business", category: "AI Automation", weight: 3, solutions: ["ai-solutions", "automation"], services: ["ai-automation"],
    keywords: ["ai", "artificial intelligence", "chatgpt", "openai", "gemini", "llm", "agent", "agents", "assistant", "machine learning", "generative", "copilot", "automation"] },
  { id: "webdev", label: "Websites & web development", category: "Web Design", weight: 2, solutions: ["websites", "mobile-desktop"], services: ["website-design", "app-development"],
    keywords: ["website", "web", "browser", "chrome", "javascript", "css", "performance", "accessibility", "security", "hosting", "cloudflare", "react", "pwa", "domain"] },
  { id: "automation", label: "Automation & integrations", category: "Automation", weight: 2, solutions: ["automation", "business-apps"], services: ["ai-automation"],
    keywords: ["automation", "workflow", "zapier", "integration", "api", "no-code", "crm", "spreadsheet", "productivity", "notifications"] },
  { id: "smallbiz", label: "Small business", category: "Business Growth", weight: 2, solutions: ["business-apps", "websites"], services: ["website-design", "social-media"],
    keywords: ["small business", "smb", "entrepreneur", "startup", "founder", "customers", "sales", "growth", "pricing", "hiring", "cash flow"] },
  { id: "africa-tech", label: "African tech & business", category: "Business Growth", weight: 2, solutions: ["websites", "business-apps"], services: ["ecommerce", "website-design"],
    keywords: ["nigeria", "lagos", "kenya", "ghana", "south africa", "africa", "african", "naira", "mobile money", "m-pesa"] },
  { id: "healthcare", label: "Healthcare & wellness", category: "Industry Insights", weight: 1, solutions: ["industries", "business-apps"], services: ["website-design", "ai-automation"],
    keywords: ["health", "healthcare", "clinic", "patient", "hospital", "telehealth", "pharmacy", "wellness", "dental"] },
  { id: "realestate", label: "Real estate", category: "Industry Insights", weight: 1, solutions: ["industries", "websites"], services: ["website-design", "ad-marketing"],
    keywords: ["real estate", "property", "realtor", "mortgage", "housing", "rental", "listing", "brokerage"] },
  { id: "restaurants", label: "Restaurants & food", category: "Industry Insights", weight: 1, solutions: ["industries", "business-apps"], services: ["social-media", "ai-automation"],
    keywords: ["restaurant", "food", "delivery", "menu", "hospitality", "cafe", "grocery", "doordash", "uber eats"] },
  { id: "travel", label: "Travel & hospitality", category: "Industry Insights", weight: 1, solutions: ["industries", "websites"], services: ["website-design", "ad-marketing"],
    keywords: ["travel", "hotel", "booking", "airline", "tourism", "hospitality", "airbnb", "vacation"] },
  { id: "education", label: "Education", category: "Industry Insights", weight: 1, solutions: ["industries", "business-apps"], services: ["website-design", "app-development"],
    keywords: ["education", "edtech", "school", "learning", "course", "students", "teachers", "university", "training"] },
  { id: "logistics", label: "Logistics & supply chain", category: "Industry Insights", weight: 1, solutions: ["industries", "business-apps"], services: ["app-development", "ai-automation"],
    keywords: ["logistics", "supply chain", "warehouse", "freight", "shipping", "delivery", "inventory", "fleet"] },
  { id: "web3", label: "Web3 & blockchain", category: "Web3 & Blockchain", weight: 1, solutions: ["websites", "business-apps"], services: ["app-development"],
    keywords: ["ethereum", "blockchain", "web3", "smart contract", "crypto", "defi", "nft", "solidity", "wallet", "stablecoin"] },
];

export const industryById = (id: string) => INDUSTRIES.find((i) => i.id === id);

/** Public RSS/Atom feeds from official company blogs and established trade publications. */
export const SEED_SOURCES: { name: string; feed_url: string; site_url: string; industry: string; trust: 1 | 2 | 3 }[] = [
  { name: "Practical Ecommerce", feed_url: "https://www.practicalecommerce.com/feed", site_url: "https://www.practicalecommerce.com", industry: "ecommerce", trust: 3 },
  { name: "WooCommerce Blog", feed_url: "https://woocommerce.com/feed/", site_url: "https://woocommerce.com", industry: "ecommerce", trust: 3 },
  { name: "Digital Commerce 360", feed_url: "https://www.digitalcommerce360.com/feed/", site_url: "https://www.digitalcommerce360.com", industry: "ecommerce", trust: 3 },
  { name: "Retail Dive", feed_url: "https://www.retaildive.com/feeds/news/", site_url: "https://www.retaildive.com", industry: "ecommerce", trust: 3 },
  { name: "Modern Retail", feed_url: "https://www.modernretail.co/feed/", site_url: "https://www.modernretail.co", industry: "ecommerce", trust: 2 },
  { name: "Stripe Blog", feed_url: "https://stripe.com/blog/feed.rss", site_url: "https://stripe.com/blog", industry: "payments", trust: 3 },
  { name: "Google Search Central Blog", feed_url: "https://developers.google.com/search/blog/feed.xml", site_url: "https://developers.google.com/search/blog", industry: "search", trust: 3 },
  { name: "Search Engine Land", feed_url: "https://searchengineland.com/feed", site_url: "https://searchengineland.com", industry: "search", trust: 3 },
  { name: "Search Engine Journal", feed_url: "https://www.searchenginejournal.com/feed/", site_url: "https://www.searchenginejournal.com", industry: "search", trust: 2 },
  { name: "Meta Newsroom", feed_url: "https://about.fb.com/feed/", site_url: "https://about.fb.com/news", industry: "marketing", trust: 3 },
  { name: "Social Media Today", feed_url: "https://www.socialmediatoday.com/feeds/news/", site_url: "https://www.socialmediatoday.com", industry: "marketing", trust: 2 },
  { name: "OpenAI News", feed_url: "https://openai.com/news/rss.xml", site_url: "https://openai.com/news", industry: "ai", trust: 3 },
  { name: "Google AI Blog", feed_url: "https://blog.google/technology/ai/rss/", site_url: "https://blog.google/technology/ai", industry: "ai", trust: 3 },
  { name: "Hugging Face Blog", feed_url: "https://huggingface.co/blog/feed.xml", site_url: "https://huggingface.co/blog", industry: "ai", trust: 2 },
  { name: "Chrome for Developers", feed_url: "https://developer.chrome.com/static/blog/feed.xml", site_url: "https://developer.chrome.com/blog", industry: "webdev", trust: 3 },
  { name: "Cloudflare Blog", feed_url: "https://blog.cloudflare.com/rss/", site_url: "https://blog.cloudflare.com", industry: "webdev", trust: 3 },
  { name: "Smashing Magazine", feed_url: "https://www.smashingmagazine.com/feed/", site_url: "https://www.smashingmagazine.com", industry: "webdev", trust: 2 },
  { name: "GitHub Blog", feed_url: "https://github.blog/feed/", site_url: "https://github.blog", industry: "automation", trust: 3 },
  { name: "Zapier Blog", feed_url: "https://zapier.com/blog/feeds/latest/", site_url: "https://zapier.com/blog", industry: "automation", trust: 2 },
  { name: "Small Business Trends", feed_url: "https://smallbiztrends.com/feed", site_url: "https://smallbiztrends.com", industry: "smallbiz", trust: 2 },
  { name: "TechCabal", feed_url: "https://techcabal.com/feed/", site_url: "https://techcabal.com", industry: "africa-tech", trust: 2 },
  { name: "Techpoint Africa", feed_url: "https://techpoint.africa/feed/", site_url: "https://techpoint.africa", industry: "africa-tech", trust: 2 },
  { name: "Healthcare Dive", feed_url: "https://www.healthcaredive.com/feeds/news/", site_url: "https://www.healthcaredive.com", industry: "healthcare", trust: 3 },
  { name: "Restaurant Dive", feed_url: "https://www.restaurantdive.com/feeds/news/", site_url: "https://www.restaurantdive.com", industry: "restaurants", trust: 3 },
  { name: "Skift", feed_url: "https://skift.com/feed/", site_url: "https://skift.com", industry: "travel", trust: 2 },
  { name: "EdSurge", feed_url: "https://www.edsurge.com/articles_rss", site_url: "https://www.edsurge.com", industry: "education", trust: 2 },
  { name: "Supply Chain Dive", feed_url: "https://www.supplychaindive.com/feeds/news/", site_url: "https://www.supplychaindive.com", industry: "logistics", trust: 3 },
  { name: "Inman", feed_url: "https://www.inman.com/feed/", site_url: "https://www.inman.com", industry: "realestate", trust: 2 },
  { name: "Ethereum Foundation Blog", feed_url: "https://blog.ethereum.org/feed.xml", site_url: "https://blog.ethereum.org", industry: "web3", trust: 3 },
];
