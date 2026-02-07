/**
 * Spending Analytics Utilities
 * Processes transaction data and generates chart-ready analytics
 */

export interface Transaction {
  date: string;
  amount: number;
  category: string;
  name?: string;
  merchant?: string;
  group?: string; // 'Needs' or 'Wants'
  description?: string;
  payment_channel?: string;
}

export interface CategorySpend {
  category: string;
  amount: number;
  pctOfTotal: number;
}

export interface SpendingAnalytics {
  totalSpend: number;
  spendByCategory: CategorySpend[];
  discretionaryVsEssential: {
    essential: number;
    discretionary: number;
    essentialPct: number;
    discretionaryPct: number;
  };
  top3Categories: CategorySpend[];
  subscriptionSpend: {
    total: number;
    pctOfTotal: number;
  };
  insights: string[];
  period: {
    startDate: string;
    endDate: string;
  };
}

// Normalized category mapping
const CATEGORY_MAP: Record<string, string> = {
  // Dining
  dining: 'Dining',
  restaurants: 'Dining',
  food: 'Dining',
  chipotle: 'Dining',
  'panera bread': 'Dining',
  starbucks: 'Dining',
  coffee: 'Dining',
  'uber eats': 'Dining',
  doordash: 'Dining',
  'door dash': 'Dining',
  grubhub: 'Dining',
  subway: 'Dining',
  pizzeria: 'Dining',
  cafe: 'Dining',
  restaurant: 'Dining',

  // Groceries
  groceries: 'Groceries',
  grocery: 'Groceries',
  'whole foods': 'Groceries',
  safeway: 'Groceries',
  kroger: 'Groceries',
  'trader joes': 'Groceries',
  'trader joe': 'Groceries',
  costco: 'Groceries',
  walmart: 'Groceries',
  target: 'Groceries',
  market: 'Groceries',

  // Transport
  transport: 'Transport',
  transportation: 'Transport',
  uber: 'Transport',
  lyft: 'Transport',
  taxi: 'Transport',
  gas: 'Transport',
  shell: 'Transport',
  chevron: 'Transport',
  parking: 'Transport',
  transit: 'Transport',
  'uber trip': 'Transport',
  'public transit': 'Transport',

  // Shopping
  shopping: 'Shopping',
  amazon: 'Shopping',
  amzn: 'Shopping',
  'amazon marketplace': 'Shopping',
  'amzn mktplace': 'Shopping',
  ebay: 'Shopping',
  mall: 'Shopping',
  retail: 'Shopping',
  store: 'Shopping',
  apparel: 'Shopping',
  clothing: 'Shopping',

  // Subscriptions
  subscriptions: 'Subscriptions',
  subscription: 'Subscriptions',
  spotify: 'Subscriptions',
  netflix: 'Subscriptions',
  hulu: 'Subscriptions',
  apple: 'Subscriptions',
  adobe: 'Subscriptions',
  microsoft: 'Subscriptions',
  prime: 'Subscriptions',

  // Bills
  bills: 'Bills',
  bill: 'Bills',
  utilities: 'Bills',
  utility: 'Bills',
  electricity: 'Bills',
  water: 'Bills',
  internet: 'Bills',
  phone: 'Bills',
  'at&t': 'Bills',
  verizon: 'Bills',
  rent: 'Bills',
  mortgage: 'Bills',

  // Entertainment
  entertainment: 'Entertainment',
  movies: 'Entertainment',
  cinema: 'Entertainment',
  theater: 'Entertainment',
  concert: 'Entertainment',
  bar: 'Entertainment',
  club: 'Entertainment',
  nightclub: 'Entertainment',
  game: 'Entertainment',
  gaming: 'Entertainment',
  sports: 'Entertainment',
  alcohol: 'Entertainment',
  liquor: 'Entertainment',
  beer: 'Entertainment',
  wine: 'Entertainment',
  'local liquor': 'Entertainment',
};

export function normalizeCategoryName(
  rawCategory: string,
  merchantName?: string
): string {
  const input = (rawCategory + ' ' + (merchantName || '')).toLowerCase();

  // Check exact matches first
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (input.includes(key)) {
      return value;
    }
  }

  // Default to original if no match
  return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
}

export function classifyAsEssentialOrDiscretionary(
  category: string,
  group?: string
): 'essential' | 'discretionary' {
  // Use the 'group' field from JSON if available
  if (group) {
    const normalized = group.toLowerCase();
    if (normalized === 'needs') return 'essential';
    if (normalized === 'wants') return 'discretionary';
  }

  // Fallback classification by category
  const essentialCategories = [
    'Groceries',
    'Transport',
    'Bills',
    'Pharmacy',
    'Health',
  ];

  return essentialCategories.includes(category)
    ? 'essential'
    : 'discretionary';
}

export function analyzeSpending(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): SpendingAnalytics {
  // Initialize accumulators
  const categoryTotals: Record<string, number> = {};
  let totalSpend = 0;
  let essentialSpend = 0;
  let discretionarySpend = 0;
  let subscriptionSpend = 0;

  // Process each transaction
  transactions.forEach((tx) => {
    // Skip negative amounts (income)
    if (tx.amount <= 0) return;

    // Filter by date range if needed
    const txDate = new Date(tx.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (txDate < start || txDate > end) return;

    const normalizedCategory = normalizeCategoryName(tx.category, tx.merchant);
    const classification = classifyAsEssentialOrDiscretionary(
      normalizedCategory,
      tx.group
    );

    // Add to totals
    categoryTotals[normalizedCategory] =
      (categoryTotals[normalizedCategory] || 0) + tx.amount;
    totalSpend += tx.amount;

    if (classification === 'essential') {
      essentialSpend += tx.amount;
    } else {
      discretionarySpend += tx.amount;
    }

    // Track subscriptions
    if (normalizedCategory === 'Subscriptions') {
      subscriptionSpend += tx.amount;
    }
  });

  // Build category breakdown
  const spendByCategory: CategorySpend[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      pctOfTotal: parseFloat(
        ((amount / totalSpend) * 100).toFixed(2)
      ),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Get top 3 categories
  const top3Categories = spendByCategory.slice(0, 3);

  // Calculate percentages
  const essentialPct = parseFloat(((essentialSpend / totalSpend) * 100).toFixed(2));
  const discretionaryPct = parseFloat(((discretionarySpend / totalSpend) * 100).toFixed(2));

  // Generate insights
  const insights = generateInsights(
    spendByCategory,
    subscriptionSpend,
    totalSpend,
    essentialPct,
    discretionaryPct
  );

  return {
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    spendByCategory,
    discretionaryVsEssential: {
      essential: parseFloat(essentialSpend.toFixed(2)),
      discretionary: parseFloat(discretionarySpend.toFixed(2)),
      essentialPct,
      discretionaryPct,
    },
    top3Categories,
    subscriptionSpend: {
      total: parseFloat(subscriptionSpend.toFixed(2)),
      pctOfTotal: parseFloat(((subscriptionSpend / totalSpend) * 100).toFixed(2)),
    },
    insights,
    period: {
      startDate,
      endDate,
    },
  };
}

function generateInsights(
  spendByCategory: CategorySpend[],
  subscriptionSpend: number,
  totalSpend: number,
  essentialPct: number,
  discretionaryPct: number
): string[] {
  const insights: string[] = [];

  // Insight 1: Top category
  if (spendByCategory.length > 0) {
    const topCategory = spendByCategory[0];
    insights.push(
      `${topCategory.category} accounts for ${topCategory.pctOfTotal}% of total spend.`
    );
  }

  // Insight 2: Subscriptions
  const subscriptionPct = (subscriptionSpend / totalSpend) * 100;
  if (subscriptionPct > 5) {
    insights.push(
      `Subscriptions make up ${subscriptionPct.toFixed(1)}% of your expenses.`
    );
  }

  // Insight 3: Essential vs Discretionary
  if (discretionaryPct > essentialPct) {
    insights.push(
      `Discretionary spending (${discretionaryPct}%) exceeds essential spending (${essentialPct}%).`
    );
  } else {
    insights.push(
      `Essential spending (${essentialPct}%) dominates your budget compared to discretionary (${discretionaryPct}%).`
    );
  }

  return insights;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get contrasting color for a category (for charts)
 */
export const CHART_COLORS = [
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
];

export function getCategoryColor(
  category: string,
  index: number
): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
