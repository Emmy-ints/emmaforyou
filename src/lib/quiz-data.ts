export const QUIZ_QUESTIONS = [
  { q: "Do you get at least 5 new leads per week from online channels?", why: "Digital reach assessment", noFix: "No professional website — you're losing customers searching online" },
  { q: "Do you have a professional website that loads in under 3 seconds?", why: "Website presence and quality", noFix: "Website is too slow or non-existent — visitors leave before viewing" },
  { q: "Do you post content on social media at least 4 times per week?", why: "Content consistency check", noFix: "Inconsistent social media — your brand is forgettable" },
  { q: "Do you respond to every customer enquiry within 1 hour?", why: "Response speed and automation need", noFix: "Slow response time — leads go cold while you're busy" },
  { q: "Do you run paid ads (Facebook, Google, or TikTok) for your business?", why: "Paid acquisition assessment", noFix: "No paid acquisition — leaving organic-only growth on the table" },
  { q: "Do you have an email list with at least 200 subscribers?", why: "Owned audience assessment", noFix: "No email list — you don't own your audience" },
  { q: "Do you know exactly which marketing channel generates your most revenue?", why: "Analytics and attribution clarity", noFix: "No attribution — guessing where to invest your budget" },
  { q: "Do you have a system that automatically follows up with leads who didn't buy?", why: "Automation and conversion need", noFix: "No follow-up automation — most leads vanish without a single nudge" },
  { q: "Has your revenue grown by at least 20% in the last 12 months?", why: "Overall growth trajectory", noFix: "Stagnant growth — your business is at risk of being passed by competitors" },
  { q: "Do you have a clear digital strategy planned for the next 3 months?", why: "Strategic planning assessment", noFix: "No strategy — reacting instead of leading" },
];

export interface QuizResult {
  bucket: string;
  title: string;
  headline: string;
  color: string;
  emoji: string;
}

export function bucketFor(score: number): QuizResult {
  if (score <= 3) return { bucket: "0-3", title: "The Invisible Business", headline: "Your business is almost completely invisible online — and it's costing you customers every single day.", color: "#d4186b", emoji: "😬" };
  if (score <= 5) return { bucket: "4-5", title: "The Struggling Hustler", headline: "You're working hard, but not working smart. Some digital presence, but it's scattered and inconsistent.", color: "#f97316", emoji: "💪" };
  if (score <= 7) return { bucket: "6-7", title: "The Growing Brand", headline: "You've got solid foundations — now it's time to accelerate. A few strategic upgrades could 2–3x your growth.", color: "#7c3aed", emoji: "🚀" };
  if (score <= 9) return { bucket: "8-9", title: "The Digital Contender", headline: "You're ahead of 80% of businesses in your space. The top 1% are doing something you're not yet — let's show you.", color: "#1a3fd4", emoji: "🏆" };
  return { bucket: "10", title: "The Digital Leader", headline: "Congratulations — you're in the top 1% of digitally mature businesses. Time to dominate your market completely.", color: "#10b981", emoji: "👑" };
}