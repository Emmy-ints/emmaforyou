# Emma's Growth Engine

Build a **world-class, 3D interactive waiting list website** for **EmmaForYou**, a Nigerian-based digital growth agency with global connections. The site must feel like a fusion of **Framer + Webflow** — cinematic animations, scroll-triggered effects, 3D depth, micro-interactions on every element, and blazing fast performance.

**Brand Name:** EmmaForYou

**WhatsApp CTA (ALL buttons):** https://wa.me/message/HHGMMWMRJFYUC1

**Owner:** Emmanuel Akinloye Oluwaseun

**Primary Location:** Nigeria | Global reach: Hanover Maryland USA · Toulon France · Halle Germany · Cookhouse South Africa

---

### TECH STACK

- **HTML5 + CSS3 + Vanilla JS** (single file, no build tools)

- **Three.js** (r128 via CDN) for 3D hero background

- **GSAP** via CDN for scroll animations and timelines

- **ScrollTrigger** plugin (GSAP) for section reveal animations

- **Lenis** or CSS `scroll-behavior: smooth` for buttery scroll

- All assets inline or via `cdnjs.cloudflare.com` / `cdn.jsdelivr.net`

- Google Fonts: **Syne** (headings) + **DM Sans** (body)

---

### DESIGN DIRECTION

**Aesthetic:** Dark luxury tech — WHITE  base, gold accent SOMEBLUE , with glowing particle fields and floating 3D geometry in the hero. Think Apple meets African excellence meets Silicon Valley agency.

**Color palette:**

• Background: White (#FFFFFF)

• Primary gradient: Blue (#1E3FD8 → #0EA5E9) to Deep Pink (#C2185B → #E91E8C)

• Accent: Rich purple where blue meets pink (#7C3AED)

• Text: Dark charcoal (#0F0F1A)

• Cards: White surfaces with soft gradient borders

**Typography:**

- Display headings: Syne 800, tight letter-spacing (-0.02em)

- Body: DM Sans 300/400/500

- No Inter, no Roboto, no Arial

**Animations to implement:**

- Hero: floating 3D torus/sphere mesh with Three.js, gold particle field

- Scroll reveal: staggered fade-up + slide on every section (GSAP ScrollTrigger)

- Navbar: glass morphism, hides on scroll down, reappears on scroll up

- Numbers/stats: count-up animation when scrolled into view

- Cards: 3D tilt on hover (CSS `perspective` + JS mouse tracking)

- CTA buttons: magnetic hover effect (mouse-following)

- Section transitions: horizontal wipe or diagonal clip-path reveals

- Testimonial carousel: smooth infinite auto-scroll with pause on hover

- Before/after: draggable slider reveal

- Page loader: animated logo reveal (2 seconds max)

---

### PAGES & SECTIONS

---

#### PAGE 1 — HOME (`index.html`)

**1. Page Loader**

Animated EmmaForYou logo builds letter by letter. Gold shimmer sweep. Max 2s. Fades out smoothly into hero.

**2. Navbar**

- Logo: "EmmaForYou" in Syne bold, gold dot after

- Links: Home · About · Services · Testimonials · Case Studies · Business Analyser · Join Waitlist

- Sticky, glass blur background on scroll

- "Join Waitlist →" button in gold

- Mobile hamburger with slide-in menu

**3. Hero Section**

- Three.js canvas background: slowly rotating 3D wireframe globe or torus, gold particle constellation

- Badge: `🌍 Trusted by businesses across 3 continents`

- H1 (huge, stacked):

  > **"Your Business Deserves**

  > **To Be Found, Followed**

  > **& Fully Automated."**

  > Gold underline on "Fully Automated"

- Subheading: *We help fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types across Nigeria, USA, Europe and Africa grow faster with AI automation, stunning websites, and digital marketing that actually works.*

- Two CTAs: `[Start Growing My Business →]` (gold, WhatsApp) + `[Watch How It Works]` (ghost)

- Floating badges orbiting below hero: "AI Automation" · "Web Design" · "Email Marketing" · "Social Media" · "Ecommerce" · "App Dev" · "Ad Marketing" — each as a pill that floats with CSS keyframe animation

- Scroll indicator: animated chevron bounce

**4. Social Proof Bar**

- Marquee/ticker scrolling left: logos or text badges of niche markets served

- Text: *"Serving 50+ business types · Nigeria · USA · France · Germany · South Africa"*

**5. The Problem Section**

Sales copy. Dark card with red-tinted glow:

> *"Every day you don't have a system — you're losing customers to businesses that do."*

- 3 pain points as animated cards:

  - 🔴 Slow replies = lost sales

  - 🔴 No website = no credibility

  - 🔴 Inconsistent social media = forgotten brand

**6. Services Section**

7 service cards in a 3D perspective grid. On hover: card lifts with box-shadow, icon rotates 360°.

Each card: icon + name + 2-line description + "Learn More →" link

Services: AI Automation · Website Design & Dev · Email Marketing · Social Media Management · Ad Marketing · Ecommerce Growth · App Development

**7. Who We Serve — Niche Showcase**

Interactive tabbed section. 8 category tabs:

- Product Sellers · Service Businesses · Local Walk-In · B2B/Corporate · Creators · Real Estate · Auto Industry · Health & Beauty

Each tab reveals an animated grid of niche pills. Hot niches marked with ✦.

Subtext: *"If you own a business — we have a solution built specifically for you."*

**8. Interactive Business Analyser (Preview Widget)**

A teaser of the full analyser page. Steps:

1. "What type of business do you have?" — dropdown

2. "What's your biggest challenge?" — multi-select pills

3. "What's your monthly revenue range?" — slider

→ Show a mini result card: top 3 recommended services + "Get Full Analysis →" (links to `/analyser.html`)

Build with pure JS state management. Animate each step with slide-in transition.

**9. Stats / Numbers Section**

Animated count-up on scroll:

- 500+ Testimonials · 100+ Case Studies · 50+ Niches Served · 3 Continents · 1 Mission

**10. Testimonials Preview**

Infinite auto-scrolling carousel (two rows, opposite directions). 12 testimonial cards visible as preview. Each card: avatar initial circle, name, business type, location, star rating (5 stars), testimonial text (2–3 lines). Gold border on featured ones.

CTA: `[See All 500+ Testimonials →]` → links to `/testimonials.html`

**11. Case Studies Preview**

3 featured before/after case study cards:

- Each has: business name, niche, location, problem, solution, result (metric), and a draggable before/after image slider

- CTA: `[See All 100 Case Studies →]` → links to `/cases.html`

**12. About Teaser**

Split layout: left = Emmanuel's photo (use uploaded image), right = short story copy:

> *"EmmaForYou started as one person's dream in Nigeria — Emmanuel Akinloye Oluwaseun — with a laptop, a vision, and an unshakeable belief that African businesses deserve world-class digital tools. Today, we serve clients across Lagos, Hanover, Toulon, Halle, and Cookhouse. From freelancer to agency — this is just the beginning."*

CTA: `[Our Full Story →]` → `/about.html`

**13. Mission & Vision**

Full-width dark section, gold quote marks, large serif text:

> *Mission: "To help business owners save time, capture more leads, and close more customers through simple, affordable AI automation."*

> *Vision: "A future where no business loses a customer because of a slow reply or missed follow-up."*

**14. Waitlist CTA Section**

Full-width gold gradient section:

- H2: *"Be First. Get Early Access. Grow Faster."*

- Body: *"Join the EmmaForYou waitlist and be among the first businesses to access our full suite of AI-powered growth services. Limited spots. Serious results."*

- Email input + "Join the Waitlist" button (stores to localStorage, shows confirmation)

- WhatsApp button: `[Chat With Us Now →]`

**15. Footer**

- Logo + tagline: *"Helping businesses grow — from Lagos to the world."*

- Links: Home · About · Services · Testimonials · Case Studies · Analyser · Join Waitlist

- Locations: Nigeria · Hanover MD USA · Toulon France · Halle Germany · Cookhouse South Africa

- WhatsApp CTA button

- Copyright: © 2025 EmmaForYou. All rights reserved.

---

#### PAGE 2 — TESTIMONIALS (`testimonials.html`)

**Structure:**

- Hero: *"500+ Businesses. Real Results. Real Stories."*

- Filter bar: filter by niche category (all 8 tabs) + search input

- Masonry grid of testimonial cards (CSS columns or JS masonry)

- **Minimum 500 testimonials, minimum 20 per niche**, covering all niches listed

- Each testimonial card contains:

  - Avatar (colored initial circle, unique color per niche)

  - Full name (generated realistic Nigerian + international names)

  - Business name & type

  - Location (mix of Nigerian cities + USA/Europe/Africa)

  - Star rating (mostly 4.8–5.0)

  - Testimonial text (2–4 sentences, specific, results-focused — e.g., *"EmmaForYou built our clinic's website and set up our Google My Business. Within 3 weeks we had 40 new patient bookings from online search alone."*)

  - Date (within last 18 months)

  - "Verified Client" badge on 80% of cards

- Infinite scroll or "Load More" button (JS pagination, 30 cards per page)

- Sticky filter bar on scroll

**Niche distribution (20+ each):**

Fashion · Shoes · Beauty · Gadgets · Furniture · Food · Phone Accessories · Perfume · Shopify · Ecommerce · Real Estate · Clinics · Salons · Spas · Lawyers · Coaches · Restaurants · Hotels · Gyms · Barbershops · Car Rentals · Car Dealers · Mechanics · Fitness Trainers · Schools · Pharmacies · Bakeries · Nail Studios · Laundry · Logistics · SaaS · Influencers · Course Creators · Pastors/Churches

---

#### PAGE 3 — CASE STUDIES (`cases.html`)

**Structure:**

- Hero: *"100 Businesses Transformed. Before & After Proof."*

- Filter: by niche, result type (leads · revenue · traffic · bookings · followers)

- Grid of 100 case study cards. Each card:

  - Business name + niche + location

  - Challenge (1 sentence)

  - Solution (what EmmaForYou did — specific)

  - Result metric (e.g., *"312% increase in website traffic in 60 days"*)

  - Before/After draggable image slider (use placeholder gradient images, left=dark/messy, right=clean/branded)

  - Services used (pill tags)

  - "Read Full Case Study" expands inline accordion with full detail

- Featured case studies (top 6) shown as large hero cards at the top

**Sample results to include across the 100 cases:**

- "From 0 to 1,200 Instagram followers in 30 days" (fashion store, Lagos)

- "Clinic went from 5 to 47 Google reviews, 3x new patients" (clinic, Abuja)

- "Ecommerce store scaled from ₦200k to ₦1.8M monthly revenue" (Shopify, Lagos)

- "Restaurant fully booked every weekend after Google Ads setup" (restaurant, Port Harcourt)

- "Real estate agent closed 4 properties in 2 months from Facebook leads" (realtor, Lekki)

- Include mix of Nigerian cities + USA/Europe locations

---

#### PAGE 4 — ABOUT (`about.html`)

**Structure:**

- Hero: Full-width cinematic section with Emmanuel's photo, parallax scroll effect

  - H1: *"One Vision. Three Continents. Unlimited Growth."*

- Origin Story (long-form sales copy):

  > Emmanuel Akinloye Oluwaseun didn't start with a team or an office. He started with a burning question: *"Why are Nigerian businesses being left behind in the digital age?"*

  > From a small room in Nigeria, armed with nothing but a laptop and relentless drive, Emmanuel began helping local businesses get online. A fashion store here. A clinic there. Word spread fast.

  > As clients in Lagos saw real results, referrals came from Hanover, Maryland. Then Toulon, France. Then Halle, Germany. Then Cookhouse, South Africa.

  > What began as freelance work became something bigger — EmmaForYou, a full-service digital agency built to give every business owner, regardless of location or budget, access to world-class digital tools.

  > *"I've seen what happens when a small business gets the right digital system. They don't just survive — they dominate."* — Emmanuel Akinloye Oluwaseun

- Mission & Vision (styled blocks)

- Team/Founder card: Emmanuel's photo + bio + credentials

- Global presence map or location cards: Nigeria · USA · France · Germany · South Africa

- Values section: 4 core values as animated cards

- CTA: `[Work With Us →]` WhatsApp

---

#### PAGE 5 — BUSINESS ANALYSER (`analyser.html`)

**Full interactive multi-step tool. Pure JS, no backend.**

**Steps:**

1. **Business Type** — Select from dropdown (all 50+ niches)

2. **Current Presence** — Checkboxes: Website · Instagram · Facebook · TikTok · Google My Business · Email List · None

3. **Biggest Challenges** — Multi-select pills: *Getting leads · Converting leads · Building trust · Retaining customers · Online visibility · Managing social media · Automating follow-ups · Scaling revenue*

4. **Monthly Revenue** — Slider: ₦0 – ₦10M+ (or $0–$50k)

5. **Budget for Growth** — Multiple choice: Under ₦50k · ₦50k–₦200k · ₦200k–₦500k · ₦500k+ / $100–$500 · $500–$2000 · $2000+

6. **Goal Timeline** — 30 days · 60 days · 90 days · 6 months

**Output (animated results card):**

- Business Health Score (0–100, animated circular progress bar)

- Top 3 Recommended Services (with explanation why)

- Estimated ROI projection (based on niche + budget inputs, simple formula)

- Priority actions (numbered list, 5 items)

- "Your Growth Roadmap" — 3-phase timeline visual

- Large CTA: `[Let's Build This Together — Chat on WhatsApp →]`

---

### SEO REQUIREMENTS

Every page must include in `<head>`:

```html

<title>EmmaForYou | AI Automation & Digital Growth Agency — Nigeria, USA, Europe, Africa</title>

<meta name="description" content="EmmaForYou helps fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types grow with AI automation, website design, social media management, email marketing and ecommerce solutions. Based in Nigeria. Serving USA, Europe & Africa.">

<meta name="keywords" content="AI automation Nigeria, digital marketing agency Lagos, website design Nigeria, social media management Nigeria, ecommerce growth Nigeria, email marketing Africa, business automation, EmmaForYou">

<meta property="og:title" content="EmmaForYou — Grow Your Business With AI">

<meta property="og:description" content="500+ businesses transformed. Join the waitlist.">

<meta property="og:image" content="emmanuel-photo.jpg">

<link rel="canonical" href="https://emmaforyou.com">

```

Use semantic HTML: `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`, proper H1→H6 hierarchy, `alt` text on all images, `aria-label` on all interactive elements.

---

### PERFORMANCE REQUIREMENTS

- Lazy load all images and heavy sections

- Debounce all scroll listeners

- Use `will-change: transform` on animated elements

- Three.js canvas must not block main thread (use `requestAnimationFrame` properly)

- Target: Lighthouse Performance score 85+

---

### WAITLIST FUNCTIONALITY

- Email capture form on homepage and dedicated section

- Store entries in `localStorage` as JSON array

- Show live count: *"247 businesses already on the waitlist"* (starts at 247, increments per signup)

- Confirmation message: *"You're in! We'll reach out on WhatsApp soon. While you wait — [Chat With Us Now →]"*

- All form CTAs also show WhatsApp button

---

### FINAL CHECKLIST FOR BUILDER

- [ ] Emmanuel's photo used in hero, about page, and founder card (file: `emmanuel.jpg`)

- [ ] ALL CTA buttons link to `https://wa.me/message/HHGMMWMRJFYUC1`

- [ ] 500+ testimonials generated across all niches (min 20 each)

- [ ] 100 case studies with before/after metrics

- [ ] 3D Three.js hero on homepage

- [ ] GSAP ScrollTrigger animations on all sections

- [ ] Business Analyser fully functional (pure JS)

- [ ] SEO meta tags on every page

- [ ] Mobile responsive (works perfectly on all screen sizes)

- [ ] Glass morphism navbar with scroll hide/show

- [ ] Page loader animation

- [ ] Waitlist email capture with localStorage

- [ ] Locations: Nigeria · Hanover MD USA · Toulon France · Halle Germany · Cookhouse South Africa

---

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://emmaforyou.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b4e9ba91-1679-48df-bde5-b0eb46ce99f8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
