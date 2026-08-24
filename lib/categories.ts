export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'ai',
    name: 'AI Agents & Infra',
    icon: '🤖',
    keywords: ['ai', 'agent', 'gpt', 'llm', 'openai', 'anthropic', 'claude', 'neural', 'machine learning', 'deep learning', 'model', 'copilot', 'automation', 'prompt'],
  },
  {
    id: 'devtools',
    name: 'Dev Productivity',
    icon: '🛠️',
    keywords: ['dev', 'developer', 'code', 'coding', 'api', 'git', 'github', 'ide', 'sdk', 'database', 'postgres', 'backend', 'frontend', 'cli', 'debug', 'terminal', 'hosting', 'deploy'],
  },
  {
    id: 'saas',
    name: 'SaaS & Business',
    icon: '💼',
    keywords: ['saas', 'software', 'b2b', 'enterprise', 'subscription', 'platform', 'management', 'crm', 'erp', 'accounting', 'invoice', 'billing', 'analytics', 'dashboard'],
  },
  {
    id: 'marketing',
    name: 'Marketing & Ads',
    icon: '📢',
    keywords: ['marketing', 'seo', 'ads', 'advertising', 'traffic', 'campaign', 'conversion', 'social media marketing', 'growth', 'email marketing', 'copywriting', 'funnel', 'leads'],
  },
  {
    id: 'design',
    name: 'Design & Assets',
    icon: '🎨',
    keywords: ['design', 'ui', 'ux', 'figma', 'icon', 'illustration', 'vector', 'logo', 'typography', 'font', '3d', 'template', 'graphics', 'color', 'creative', 'framer'],
  },
  {
    id: 'hiring',
    name: 'Hiring & Careers',
    icon: '💼',
    keywords: ['jobs', 'hiring', 'career', 'resume', 'recruiting', 'talent', 'remote work', 'interview', 'salary', 'freelance', 'staffing', 'workplace'],
  },
  {
    id: 'people',
    name: 'People & Profiles',
    icon: '👤',
    keywords: ['profile', 'portfolio', 'bio', 'founder', 'creator', 'personal', 'link in bio', 'about me', 'resume', 'linkedin', 'twitter.com', 'x.com'],
  },
  {
    id: 'social',
    name: 'Social & Community',
    icon: '💬',
    keywords: ['social', 'community', 'forum', 'chat', 'messaging', 'discord', 'reddit', 'network', 'connect', 'feed', 'followers', 'threads'],
  },
  {
    id: 'writing',
    name: 'Writing & Content',
    icon: '✍️',
    keywords: ['writing', 'blog', 'newsletter', 'content', 'editor', 'notes', 'markdown', 'publishing', 'author', 'docs', 'documentation', 'essay'],
  },
  {
    id: 'sales',
    name: 'Sales & Outreach',
    icon: '💰',
    keywords: ['sales', 'outreach', 'cold email', 'prospecting', 'lead generation', 'pipeline', 'deal', 'closing', 'buyer', 'b2b sales'],
  },
  {
    id: 'games',
    name: 'Games & Fun',
    icon: '🎮',
    keywords: ['game', 'gaming', 'entertainment', 'play', 'arcade', 'vr', 'ar', 'steam', 'esports', 'fun', 'puzzle', 'multiplayer'],
  },
  {
    id: 'education',
    name: 'Education & Learn',
    icon: '🎓',
    keywords: ['education', 'course', 'learn', 'tutorial', 'school', 'academy', 'university', 'study', 'training', 'bootcamp', 'quiz', 'book'],
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: '🏥',
    keywords: ['health', 'fitness', 'workout', 'diet', 'wellness', 'medical', 'mental health', 'meditation', 'nutrition', 'gym', 'doctor'],
  },
  {
    id: 'ecommerce',
    name: 'Ecommerce & Retail',
    icon: '🛒',
    keywords: ['ecommerce', 'shop', 'store', 'cart', 'checkout', 'product', 'buy', 'retail', 'shopify', 'dropshipping', 'merch', 'goods'],
  },
  {
    id: 'directories',
    name: 'Directories & Lists',
    icon: '📁',
    keywords: ['directory', 'list', 'curated', 'catalog', 'resources', 'database', 'tools list', 'awesome list', 'aggregator', 'hub'],
  },
  {
    id: 'audio',
    name: 'Audio & Podcasts',
    icon: '🎧',
    keywords: ['audio', 'podcast', 'music', 'sound', 'voice', 'speech', 'recording', 'beats', 'radio', 'streaming', 'synth', 'track'],
  },
  {
    id: 'crypto',
    name: 'Crypto & Web3',
    icon: '🪙',
    keywords: ['crypto', 'web3', 'bitcoin', 'ethereum', 'solana', 'blockchain', 'wallet', 'token', 'nft', 'defi', 'dex', 'dao'],
  },
  {
    id: 'agencies',
    name: 'Agencies & Studio',
    icon: '🤝',
    keywords: ['agency', 'studio', 'consulting', 'services', 'contractor', 'development agency', 'design studio', 'marketing agency'],
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    icon: '🛡️',
    keywords: ['security', 'privacy', 'auth', 'authentication', 'vpn', 'encryption', 'firewall', 'cybersecurity', 'password', 'audit', 'compliance'],
  },
  {
    id: 'travel',
    name: 'Travel & Lifestyle',
    icon: '✈️',
    keywords: ['travel', 'hotel', 'flight', 'trip', 'vacation', 'destination', 'guide', 'nomad', 'booking', 'tourism', 'city'],
  },
  {
    id: 'media',
    name: 'Media & News',
    icon: '📰',
    keywords: ['news', 'media', 'journalism', 'press', 'magazine', 'daily', 'article', 'report', 'broadcast', 'tv'],
  },
  {
    id: 'domains',
    name: 'Domains & Web',
    icon: '🌐',
    keywords: ['domain', 'dns', 'whois', 'registrar', 'tld', 'domain name', 'nameserver', 'web address'],
  },
  {
    id: 'leaderboards',
    name: 'Leaderboards & Bids',
    icon: '📊',
    keywords: ['leaderboard', 'rank', 'ranking', 'billboard', 'bid', 'auction', 'contest', 'scoreboard', 'top 10'],
  },
  {
    id: 'realestate',
    name: 'Real Estate & Prop',
    icon: '🏠',
    keywords: ['real estate', 'property', 'housing', 'apartment', 'realtor', 'rent', 'home', 'mortgage', 'listing', 'architecture'],
  },
  {
    id: 'other',
    name: 'Other & Tools',
    icon: '🔮',
    keywords: ['utility', 'tool', 'calculator', 'converter', 'widget', 'extension', 'misc', 'other'],
  },
];

/**
 * Classifies a website based on its URL, title, description, and meta content
 */
export function autoCategorizeWebsite(textToAnalyze: string): string {
  const normalized = textToAnalyze.toLowerCase();

  let bestMatchCategory = 'other';
  let highestScore = 0;

  for (const cat of CATEGORIES) {
    if (cat.id === 'other') continue;
    let score = 0;

    for (const kw of cat.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        // Longer matching keywords carry higher confidence
        score += kw.length > 5 ? 3 : 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatchCategory = cat.id;
    }
  }

  // Fallback defaults
  if (highestScore === 0) {
    if (normalized.includes('twitter.com') || normalized.includes('x.com') || normalized.includes('linkedin.com')) {
      return 'people';
    }
    if (normalized.includes('ai') || normalized.includes('bot')) {
      return 'ai';
    }
    return 'devtools';
  }

  return bestMatchCategory;
}

export function getCategoryById(id?: string): CategoryDefinition {
  if (!id) return CATEGORIES.find((c) => c.id === 'devtools') || CATEGORIES[0];
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
