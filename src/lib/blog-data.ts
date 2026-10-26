export interface BlogPost {
  slug: string;
  title: string;
  /** Shorter title for search results when the headline is long. */
  seoTitle?: string;
  category: string;
  excerpt: string;
  read: string;
  date: string;
  author: { name: string; role: string; initials: string };
  cover: { from: string; to: string; emoji: string };
  body: string;
  /** Optional free tool to try alongside the article. */
  tool?: { label: string; to: string; text: string };
  /** Sources the article is based on (automated articles always have at least one). */
  sources?: { title: string; url: string; publisher: string; published_at: string | null }[];
  /** Written by the automated, source-checked pipeline (blog_articles). */
  automated?: boolean;
  /** Exact publish time (automated articles). */
  publishedAt?: string;
}

const EMMA = { name: "Emmanuel Oluwaseun Akinloye", role: "Founder, EmmaForYou", initials: "EA" };
const TEMI = { name: "Temi Adebayo", role: "Head of Growth", initials: "TA" };
const MARK = { name: "Mark Schneider", role: "Automation Lead", initials: "MS" };

import { POSTS_A } from "./posts/posts-a";
import { POSTS_B } from "./posts/posts-b";
import { POSTS_C } from "./posts/posts-c";

const ORIGINAL_POSTS: BlogPost[] = [
  {
    slug: "first-1000-instagram-followers",
    title: "How to Get Your First 1,000 Instagram Followers in 30 Days",
    category: "Social Media",
    excerpt: "A repeatable framework we use for new client accounts — content cadence, hashtag strategy, engagement loops, and the one daily action that compounds.",
    read: "8 min", date: "Apr 18, 2026", author: TEMI,
    cover: { from: "#fde68a", to: "#f59e0b", emoji: "📸" },
    body: `## Why the first 1,000 followers are the hardest

Every Instagram account hits a cold-start problem. The algorithm only shows your content to a tiny seed audience until it has enough signal to push you further. Below 1,000 followers, that seed is brutally small. Above it, growth compounds.

We've launched 80+ business Instagram accounts from zero. The accounts that crossed 1,000 in 30 days all did the same five things.

## 1. Pick one visual format and repeat it for 30 days

Pick ONE of these and do nothing else for the first month:
- Carousel tips (educational)
- Reels with talking-head + on-screen text
- Before/after transformations
- Behind-the-scenes process videos

Switching formats resets the algorithm's understanding of who to show you to. Repetition trains it.

## 2. Post 1× per day, every day, for 30 days

Not "5 times a week when you feel like it". A flat daily cadence is the strongest signal you can send. We schedule 30 posts in advance using Buffer or Later before launch day.

## 3. Hashtag strategy that actually works in 2026

Forget the old advice of stuffing 30 random tags. Use this exact mix per post:
- 3 tags with 10k–100k posts (your real opportunity zone)
- 3 tags with 100k–500k posts
- 2 niche-specific community tags
- 1 branded tag (your own)

That's it. Nine tags, picked with intent.

## 4. The 10-comment-a-day rule

Every single day, before you post your own content, leave 10 thoughtful comments on accounts in your niche that have 5k–50k followers. Not "great post 🔥" — real, value-adding comments. This is the single highest-ROI activity for new accounts.

In 30 days you'll have left 300 visible comments where your target audience hangs out. A meaningful percentage will click your profile.

## 5. The compounding action: collaborations

Every 7 days, do one collab post or shoutout swap with an account in an adjacent niche of similar size. Two accounts of 400 followers helping each other will grow faster than two solo accounts of 800.

## What to expect

If you do all five consistently, here's the realistic curve we see:
- Days 1–10: 50–150 followers (it feels slow — keep going)
- Days 11–20: 250–500 followers (algorithm starts cooperating)
- Days 21–30: 600–1,200 followers (compound kicks in)

By day 30 you have proof of concept. The strategy you'll use to scale to 10k is different — but you'll have earned the right to think about it.`,
  },
  {
    slug: "nigerian-business-needs-website",
    title: "Why Every Nigerian Business Needs a Website in 2026",
    category: "Web Design",
    excerpt: "Customers Google you before they trust you. If you don't show up, you don't exist. Here's why a website is no longer optional — and what makes one effective.",
    read: "6 min", date: "Apr 15, 2026", author: EMMA,
    cover: { from: "#dbeafe", to: "#1e3a8a", emoji: "🌐" },
    body: `## The trust gap

In 2026, the average Nigerian customer Googles a business name before contacting it. If nothing comes up, or the only thing that comes up is a half-abandoned Facebook page from 2021, the conversation usually ends there. They click the next result.

Instagram alone is no longer enough. Instagram is great for discovery — websites are where trust gets built and money changes hands.

## What "having a website" actually means in 2026

A modern business website needs five things:

1. **Lightning load time** (under 2 seconds, even on 3G)
2. **WhatsApp-first contact** (one-tap to your business number)
3. **Mobile-first design** (because 92% of Nigerian traffic is mobile)
4. **Clear pricing or "request a quote" flow** (no mystery)
5. **Real photos of your work** (not stock images)

If your current website is missing any of these, it's actively losing you customers.

## What it costs vs what it returns

Most Nigerian businesses dramatically overestimate the cost of a good website. A professional, conversion-optimised site for a service business in 2026 typically costs ₦300k–₦700k one-time, plus ₦15k–₦30k/year for hosting and domain.

A single new client per month from your website pays it back many times over. We track the data: across 200+ clients, the average payback period for a website redesign is **47 days**.

## The five mistakes we still see in 2026

- **Splash pages with autoplay video** — people leave instantly
- **Contact forms that go nowhere** — use WhatsApp or email-on-submit
- **No visible pricing band** — even a "from ₦X" range converts better than nothing
- **Dated stock photos** — invest in one good photoshoot
- **No reviews or testimonials** — social proof closes the sale

## What to do this week

If you don't have a website: start with a one-page site. It will outperform "no site" by an order of magnitude.

If you have an old website: open it on your phone, time how long it takes to load, and ask one customer what they remember about it. The honest answer will tell you what to do next.`,
  },
  {
    slug: "whatsapp-automation-47-leads",
    title: "The WhatsApp Automation System That Generated 47 Leads in a Week",
    category: "Automation",
    excerpt: "Step-by-step breakdown of the actual flow we built for a Lagos clinic — from welcome message to qualifying questions to booking confirmation.",
    read: "10 min", date: "Apr 10, 2026", author: MARK,
    cover: { from: "#dcfce7", to: "#16a34a", emoji: "💬" },
    body: `## The setup

In March 2026, a Lagos cosmetic clinic came to us with a familiar problem: lots of Instagram inbox messages, almost no bookings. The receptionist was overwhelmed during the day and asleep when most patients messaged at night.

We built a WhatsApp Business automation in 9 days. In the first 7 days after launch it generated **47 qualified leads** and **23 confirmed bookings**.

Here's the exact flow.

## Stage 1: The welcome message (sent in under 3 seconds)

The moment anyone sends ANY message to the clinic's WhatsApp number, they get this auto-reply:

> "Hi 👋 thanks for reaching out to [Clinic]. To help you fastest, please pick one:
> 1️⃣ Book a consultation
> 2️⃣ Ask about a treatment
> 3️⃣ Speak to a human
> Just reply with the number."

The 3-second SLA matters. Patients who get a sub-5-second reply are 3.4× more likely to convert.

## Stage 2: The qualifying questions

If they pick **1 (book a consultation)**, the bot asks three questions in sequence:

1. What treatment are you interested in?
2. Are you available this week or next week?
3. What's the best phone number to confirm by?

Every answer is logged into the clinic's CRM automatically. By the time a human sees the chat, the lead is fully qualified.

## Stage 3: The booking handoff

After question 3, the bot sends:

> "Got it! ✅ One of our specialists will confirm your slot within 30 minutes. While you wait, here's our treatment menu: [link]"

Behind the scenes, the receptionist gets a notification with the lead summary and a one-tap "Confirm" button that triggers the next message.

## Stage 4: The confirmation

> "Confirmed! 🎉 Your consultation is booked for [date] at [time]. We'll send you a reminder 24h before. Save our address: [Google Maps link]."

## Stage 5: The reminder (this is where most clinics lose patients)

24 hours before the appointment:
> "Hi! Just a reminder of your consultation tomorrow at [time]. Reply YES to confirm or RESCHEDULE if you need a different time."

This single message cut no-shows from 28% to 9% in the first month.

## What you need to build this

- WhatsApp Business API account (via a BSP like 360dialog or Twilio)
- A flow builder (we use Make.com or n8n)
- A CRM that accepts API submissions (HubSpot, Notion, Airtable all work)
- About 12 hours of careful flow design

## The most common mistake

People build the flow and forget the **escape hatch**. Every step needs an obvious "speak to a human" option. The clinics where the bot replaces the human entirely have lower booking rates than the clinics where the bot prepares the human.

Automation isn't replacement — it's preparation.`,
  },
  {
    slug: "facebook-vs-instagram-ads-nigeria",
    title: "Facebook vs Instagram Ads: Which Works Better in Nigeria?",
    category: "Ads",
    excerpt: "We spent over $50k on both platforms across niches. Here's where Facebook still wins, where Instagram dominates, and how to test cheaply.",
    read: "9 min", date: "Apr 5, 2026", author: TEMI,
    cover: { from: "#e0e7ff", to: "#4338ca", emoji: "📊" },
    body: `## The headline answer

After spending $50k+ across both platforms in 2025–2026 for Nigerian businesses, here's the short version:

- **Facebook wins for**: high-ticket services, B2B, audiences over 35, real estate, financial services
- **Instagram wins for**: fashion, beauty, food, lifestyle, anyone selling visually
- **Tie**: education, fitness, coaching

Now the long version.

## Cost-per-click reality

In Nigeria in 2026, our average data:
- Facebook CPC: ₦95–₦180
- Instagram CPC: ₦140–₦260

Facebook is cheaper to click, but Instagram clicks convert higher for visual products. Net cost-per-lead is what matters.

## Audience age matters more than people admit

- **18–28**: Instagram dominates. Facebook is "the app my parents use."
- **28–40**: Roughly even. Run both.
- **40+**: Facebook decisively wins, especially for considered purchases.

## Creative format

What works on each platform is genuinely different:

**Facebook winners:**
- Long-form text posts with a story arc
- Carousel ads with detailed product info
- Lead form ads (don't even need a website)

**Instagram winners:**
- 9:16 vertical Reels with native-feeling content
- Story ads that look like organic stories
- Single-image ads with strong typography

If you're running the same ad on both platforms, you're leaving money on the table.

## The cheap test we run for every new client

Budget: ₦50,000. Duration: 7 days. Split: ₦25k per platform.
- Same offer, same headline
- Different creative formatted for each platform
- Same audience targeting
- Conversion goal: WhatsApp message

After 7 days, the winning platform usually outperforms by 2–3×. Double down on the winner; don't waste money trying to "fix" the loser.

## What changes in 2026

Two big shifts you should know:

1. **iOS attribution is dead** — both platforms now report worse than reality. Always cross-check with your actual booking data, not the ad dashboard.
2. **Threads/X are not yet ad platforms in Nigeria** — ignore the hype.

## Bottom line

Don't pick a platform based on what your friend uses. Pick based on where your customer's attention lives, then format your creative for that platform's native style. The ₦50k test will tell you within a week.`,
  },
  {
    slug: "google-business-profile-setup",
    title: "How to Set Up Google My Business (Step-by-Step Guide)",
    category: "SEO",
    excerpt: "Local businesses live and die by their Google Business Profile. This walkthrough covers verification, photos, posts, Q&A, and the review strategy that doubles ratings.",
    read: "7 min", date: "Mar 28, 2026", author: EMMA,
    cover: { from: "#fee2e2", to: "#dc2626", emoji: "📍" },
    body: `## Why GBP is non-negotiable for local businesses

Google Business Profile (formerly Google My Business) is the listing that shows up when someone searches your business name, OR searches "[your service] near me". For local businesses — clinics, salons, restaurants, dealerships — it is the single highest-ROI marketing asset you can own. And it's free.

## Step 1: Claim and verify

Go to google.com/business. Search for your business name. If it exists, click "Claim this business". If not, click "Add your business".

Verification options in 2026:
- Postcard (slowest, takes 5–14 days)
- Phone (fastest if available)
- Email (some categories)
- Video verification (newest, walks you through your physical location)

Use video verification if you can — it's the fastest in Nigeria.

## Step 2: Fill in everything

Skip nothing. Specifically:
- Exact address (use Google Maps to drop the pin precisely)
- Phone number that actually answers
- Website URL
- Opening hours (and special holiday hours)
- 5–10 service categories (primary + secondary)
- Short description (max 750 characters — use them all)

## Step 3: The photo strategy

Upload at minimum:
- 1 cover photo
- 3 photos of your physical space (exterior, interior, reception)
- 5 photos of your work / products / food
- 2 team photos (humans build trust)

Then add 1 photo per week for the first 3 months. Profiles with weekly photo updates rank significantly higher.

## Step 4: Posts (the underrated lever)

Most businesses ignore Google Posts. Don't. Post once a week — an offer, an update, a behind-the-scenes. Each post lives in your profile for 7 days and signals activity to Google's algorithm.

## Step 5: Q&A (own this section)

Add 10 of your own most-frequently-asked questions and answer them yourself. Otherwise random people will answer them with wrong information that you cannot edit.

## Step 6: The review machine

Reviews are the #1 ranking factor for local search. Build a system:
- Save a short link to your review form (g.page/r/...)
- Send it via WhatsApp to every happy customer
- Send within 24 hours of service (memory is strongest then)
- Reply to every review within 48 hours, good or bad

Target: 1 new review per week minimum.

## What "good" looks like in 90 days

A well-optimised GBP for a Nigerian local business should hit, in 90 days:
- 30+ reviews averaging 4.6+
- 2–3× the views of similar businesses nearby
- Phone calls and direction requests showing in your insights

If you're not there, something in this guide isn't being executed consistently.`,
  },
  {
    slug: "ai-automation-explained",
    title: "AI Automation Explained: What It Is and Why Your Business Needs It",
    category: "Automation",
    excerpt: "Stripped of the buzzwords. AI automation in 2026 means responding faster than humans, never forgetting a follow-up, and capturing every lead — 24/7.",
    read: "11 min", date: "Mar 22, 2026", author: MARK,
    cover: { from: "#fae8ff", to: "#a21caf", emoji: "🤖" },
    body: `## Cut through the buzzword

"AI automation" has become marketing-speak for almost anything. Here's the practical 2026 definition: software that handles repeatable customer-facing tasks (replying, qualifying, booking, reminding, following up) without a human pressing a button each time.

It is not "AI" in the sci-fi sense. It is a chain of small, reliable rules powered by language models that can understand messy human input.

## The four jobs AI automation does well

1. **Instant first reply** — every inbound message gets an answer in <5 seconds
2. **Lead qualification** — ask the same 3 questions every prospect needs to answer
3. **Booking and scheduling** — find a time, confirm it, send a calendar invite
4. **Follow-up that never forgets** — 1-day, 3-day, 7-day nudges that humans skip

If a task in your business is none of those, AI automation is probably the wrong tool.

## What it actually looks like under the hood

A typical small-business automation in 2026 has three pieces:

- **Trigger**: a WhatsApp message, a website form, a missed call
- **Logic**: a flow builder (Make.com, n8n, Zapier) that decides what to do
- **Action**: send a reply, write to a database, notify a human

The "AI" part is usually a small language model in the middle that classifies intent ("is this person ready to book or just curious?") and personalises the response.

## What it costs

For a single business, typical 2026 monthly costs:
- Flow builder subscription: $20–$50
- AI model usage: $5–$30 (varies with volume)
- WhatsApp Business API: $10–$80 depending on country
- Setup: one-time, $1k–$5k for a properly designed flow

Total ongoing: usually under $100/month for the kind of automation that replaces a part-time receptionist.

## Where AI automation goes wrong

The three failure modes we see most:

1. **Over-automation** — businesses try to remove humans entirely; conversion drops. The right model is human-prepared, AI-handled-around-the-edges.
2. **No escape hatch** — customers must always be able to type "human" and reach a person.
3. **No measurement** — install it, never check the logs, miss the failures.

## Your first automation: a 30-minute project

If you've never automated anything, build this:
1. A Google Form for new enquiries
2. A Zapier flow that sends each submission to your WhatsApp
3. A canned WhatsApp reply with your booking link

It's not glamorous. It captures every lead, even at 2am. You will be shocked how many leads you were missing.

## When to hire someone

Build your first automation yourself. By the third or fourth, the complexity outgrows DIY tools and a specialist pays for themselves. We typically take over for clients when their flows have 10+ branches and the cost of a misfire becomes meaningful.`,
  },
  {
    slug: "5-signs-ready-to-scale",
    title: "5 Signs Your Business Is Ready to Scale Digitally",
    category: "Strategy",
    excerpt: "Not every business is ready. Here are the five honest indicators that you'll get a strong return on digital investment — and the warning signs to fix first.",
    read: "5 min", date: "Mar 15, 2026", author: EMMA,
    cover: { from: "#fce7f3", to: "#db2777", emoji: "📈" },
    body: `## The honest version

We turn down roughly 1 in 5 businesses that ask us for help. Not because they can't pay — because they're not ready, and spending money on digital growth would burn cash without changing the trajectory.

Here are the five signs we look for that a business is ready.

## 1. You can deliver more without breaking

If you got 30% more customers tomorrow, could you actually serve them well? Scaling discovery before scaling delivery creates one-star reviews and refunds.

**Test:** if you 2× your inbound today, what breaks first? If you don't know, the answer is "everything".

## 2. You have a clear "best customer" profile

Businesses that scale know exactly who their best customers are: niche, age, problem, willingness to pay. Businesses that aren't ready try to serve "everyone".

If you can't describe your ideal customer in one sentence, your ad money will go to the wrong people.

## 3. Your unit economics work

You should know:
- Average order value or contract value
- Cost to deliver one unit
- Profit per customer
- Roughly how many touch points to close a sale

If those numbers don't exist, you can't tell if a marketing channel is profitable. You'll just be guessing.

## 4. You have at least 3 months of runway

Digital growth is a 60–90 day game. Ad accounts need to learn. SEO compounds. Content needs to build a library. If you need results in 14 days to make rent, scaling digitally is the wrong intervention — focus on direct sales for now.

## 5. You have proof of demand

Have you sold the thing manually, hand to hand, even just 20 times? If yes, scaling is amplifying something that works. If no, scaling is shouting into a void.

## The warning signs to fix first

If any of these are true, fix them BEFORE investing in digital growth:

- You don't reply to messages within 8 hours
- Your fulfillment is inconsistent
- You don't track where customers come from
- Your team can't articulate your offer
- You're under-pricing yourself

Scaling broken systems just breaks them faster. Fix the foundation, then accelerate.`,
  },
  {
    slug: "from-lagos-to-london",
    title: "From Lagos to London: How Small Businesses Can Win Globally",
    category: "Strategy",
    excerpt: "Cross-border ecommerce, multi-currency checkout, international shipping, and the marketing tactics that let a Lagos brand compete in London markets.",
    read: "8 min", date: "Mar 8, 2026", author: TEMI,
    cover: { from: "#cffafe", to: "#0891b2", emoji: "🌍" },
    body: `## The new global default

In 2026, a Lagos-based fashion brand can sell to a London buyer as easily as to one in Ikeja. The infrastructure exists. What's still missing for most brands is the playbook. Here's ours.

## Step 1: Pick one international market, not "the world"

Trying to sell to "everyone" globally usually means selling to no one. Pick one country, ideally one with:
- A meaningful diaspora from your country
- Strong digital infrastructure (Stripe, PayPal, decent shipping)
- Buying power for your price range

Common winners for Nigerian brands: UK, US, Canada, South Africa.

## Step 2: Multi-currency checkout

Buyers convert dramatically better when prices show in their local currency. Shopify Markets, Stripe, and Paystack International all support this in 2026. Set it up before you spend a naira on ads.

## Step 3: Solve shipping before you sell

Three options:
- **DHL/FedEx direct**: fast, expensive, hurts your margin
- **Aggregators (e.g., ShipBob, Sendcloud)**: better rates if you ship volume
- **Diaspora fulfilment partner**: someone in-country who receives and reships — best for early-stage brands

Decide which you'll use BEFORE your first international sale, not during.

## Step 4: Localise the storefront

A few small changes:
- Pricing in local currency (£/$/€)
- Mention shipping times explicitly
- Use spelling appropriate to the market (color/colour, etc.)
- Show a local phone number or WhatsApp for support
- One or two testimonials from customers in that market

These are tiny touches. They double trust.

## Step 5: Use diaspora marketing as your beachhead

Your fastest customers in any new country are often diaspora from your home country. They're emotionally aligned with your brand and easier to reach.

Specific tactics that work:
- Influencer partnerships with diaspora content creators
- Posts in diaspora Facebook groups (with permission)
- Pop-ups at cultural events (Notting Hill Carnival, etc.)
- Targeted Meta ads with culturally specific creative

Once you've established traction with diaspora, expand to local market.

## Step 6: Customer service across time zones

This kills most Lagos→London brands. The customer messages at 10am London time (11am Lagos), but your team only checks WhatsApp at 4pm. By then they bought from a competitor.

Solutions:
- Schedule one team member's hours to overlap with the target market
- Use WhatsApp auto-replies with realistic SLA expectations
- Hire one part-time VA in the target market

## What to expect

The first 90 days of a new international market are slow. Plan for:
- Months 1–2: testing, learning, likely losing money
- Month 3: first signs of repeatable demand
- Months 4–6: scaling what worked

If you can't commit 6 months to a new market, don't open it.`,
  },
];

/** Newest first. */
export const POSTS: BlogPost[] = [...POSTS_A, ...POSTS_B, ...POSTS_C, ...ORIGINAL_POSTS];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}
