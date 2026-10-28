/**
 * eBook Publishing & Book Marketing: the service line, its service pages and the free tools.
 * Kept in one place so the homepage, service pages, /publishing hub, tools directory, sitemap
 * and author workspace all describe the offer the same way.
 *
 * Honesty rules for this copy: EmmaForYou provides publishing support (preparation, design,
 * metadata, launch and marketing). It isn't a publishing house or distributor, doesn't
 * guarantee sales, rankings or acceptance by any platform, and shows no client results here
 * because none are recorded yet.
 */
import type { ServiceItem } from "./services-data";
import type { ServiceExtra, ServiceQA } from "./service-extras";

export const PUBLISHING_HUB_SLUG = "ebook-publishing";

export interface PublishingTool {
  slug: string; // route under /publishing/
  name: string;
  icon: string;
  does: string;
  get: string;
  free: string; // what works before signing in
  account: string; // what signing in adds
  service: string; // related expertise slug
  cta: string;
}

export const PUBLISHING_TOOLS: PublishingTool[] = [
  { slug: "ebook-creator", name: "eBook Creator & Converter", icon: "📘", does: "Turn your manuscript, notes or Word file into a formatted book with chapters and a contents page.", get: "PDF, EPUB and Word files you can preview first", free: "Paste or upload, organise chapters and preview pages", account: "Download the files and save the project", service: "ebook-formatting-conversion", cta: "Create your eBook" },
  { slug: "cover-designer", name: "Book Cover Designer", icon: "🎨", does: "Design eBook and paperback covers from your title, genre and style, with editable layouts.", get: "Several cover concepts, eBook and print-wrap sizes", free: "Generate and customise concepts", account: "Download covers and save designs", service: "book-cover-design", cta: "Design a book cover" },
  { slug: "mockups", name: "3D Mockups & Promo Graphics", icon: "🖼️", does: "Place your cover on 3D books, a tablet or phone, and build launch graphics for social media.", get: "3D book, device, social, banner and quote-card images", free: "Preview every format with your own cover", account: "Download images and the full pack", service: "book-mockups-graphics", cta: "Generate book mockups" },
  { slug: "book-marketing", name: "Book Description & Marketing Assistant", icon: "✍️", does: "Draft a book description, tagline, author bio, keywords, categories, captions and emails from your summary.", get: "Editable drafts with KDP's listing rules checked", free: "Generate and edit drafts", account: "Save drafts to your project", service: "book-metadata-positioning", cta: "Improve my book description" },
  { slug: "manuscript-analyzer", name: "Manuscript & Chapter Analyzer", icon: "🔍", does: "Check readability, clarity, structure and your opening hook on a chapter or sample.", get: "Measured statistics plus AI-assisted editorial notes", free: "Analyse a sample of up to 20,000 words", account: "Save reports to your project", service: "ebook-formatting-conversion", cta: "Analyse my chapter" },
  { slug: "launch-planner", name: "Book Launch Planner", icon: "🚀", does: "Build a launch timeline, checklist, content calendar and email outline around your launch date.", get: "Editable tasks, calendar file and checklist", free: "Build and edit the plan", account: "Save it and tick off tasks", service: "book-launch-strategy", cta: "Plan my book launch" },
  { slug: "royalty-calculator", name: "Publishing Cost & Royalty Estimator", icon: "🧮", does: "Estimate royalties, costs and break-even for eBook and paperback scenarios with the formulas shown.", get: "Side-by-side scenarios with every assumption visible", free: "Everything", account: "Save scenarios", service: "ebook-publishing", cta: "Estimate my royalties" },
  { slug: "readiness-checker", name: "Publishing Readiness Checker", icon: "✅", does: "Check a manuscript, cover image and listing details against common platform requirements.", get: "What we checked, what failed, and what still needs a person or the platform", free: "Everything", account: "Save results to your project", service: "ebook-publishing", cta: "Check my book" },
];

export const PUBLISHING_SERVICES = [
  { slug: "ebook-publishing", label: "eBook Publishing Support", short: "From manuscript to upload-ready files and a launch plan." },
  { slug: "ebook-formatting-conversion", label: "eBook Formatting & Conversion", short: "Clean EPUB, print PDF and Word files." },
  { slug: "book-cover-design", label: "Book Cover Design", short: "eBook covers and full paperback wraps." },
  { slug: "book-mockups-graphics", label: "Mockups & Promotional Graphics", short: "3D mockups and launch graphics." },
  { slug: "book-metadata-positioning", label: "Book Metadata & Positioning", short: "Descriptions, keywords and categories." },
  { slug: "book-launch-strategy", label: "Book Launch Strategy", short: "A launch plan with dates and owners." },
  { slug: "book-marketing", label: "Book Marketing", short: "Email, social, landing pages and ads." },
];

const START = { id: "start", label: "When would you like to start?", options: ["This month", "Next 1–3 months", "Just exploring"] };
const STAGE = { id: "stage", label: "Where is the book now?", options: ["Idea or outline", "Draft in progress", "Finished manuscript", "Already published"] };
const FORMAT = { id: "format", label: "Which formats?", options: ["eBook", "Paperback", "Both", "Not sure yet"], multi: false };

const honestFaq = [
  { q: "Are you a publisher?", a: "No. EmmaForYou provides publishing support: we prepare your files, design your cover, write your listing copy and plan and run your marketing. You publish under your own account (for example Amazon KDP, Apple Books, Google Play Books or your own website) and keep your rights and royalties." },
  { q: "Can you guarantee sales or a bestseller ranking?", a: "No one honestly can. We build a clear listing, a professional product and a launch plan that gives your book its best chance, and we report what each channel actually delivered." },
];

export const PUBLISHING_EXPERTISE: ServiceItem[] = [
  {
    slug: "ebook-publishing",
    name: "eBook Publishing & Book Marketing",
    short: "Publishing support from manuscript to launch: formatting, covers, mockups, listing copy and marketing.",
    icon: "📚", gradient: "from-amber-500 to-orange-600",
    hero: { headline: "Turn Your Manuscript into a Book People Can Find, Trust and Buy.",
      sub: "eBook creation and conversion, manuscript formatting, cover design, 3D mockups, book descriptions and keywords, launch planning and marketing — done with you, published under your own name and account." },
    pains: [
      { icon: "❌", title: "A finished manuscript stuck in a folder", body: "Formatting, covers and platform rules stop many books from ever being published." },
      { icon: "❌", title: "Files that get rejected or look homemade", body: "Broken EPUBs, wrong cover sizes and messy layouts cost reviews and sales." },
      { icon: "❌", title: "A listing nobody clicks", body: "A weak description, vague categories and missing keywords hide a good book." },
      { icon: "❌", title: "Launch day, then silence", body: "Without a plan and a list, most launches are a single post and a handful of sales." },
    ],
    criteria: [
      { title: "Clean files", body: "EPUB, print PDF and Word files that open correctly and follow the platform's specifications." },
      { title: "A cover that fits the genre", body: "Readable at thumbnail size, designed for eBook and print dimensions." },
      { title: "Honest, findable listings", body: "Descriptions, keywords and categories that follow platform rules." },
      { title: "A launch with a plan", body: "Dates, channels and owners, so the book keeps selling after week one." },
    ],
    process: [
      { phase: "Phase 1", title: "Prepare", bullets: ["Review the manuscript and goals", "Choose formats, trim size and platforms", "Format and convert the interior", "Proof files on real readers and previewers"] },
      { phase: "Phase 2", title: "Package", bullets: ["Cover concepts, then the final eBook cover and print wrap", "Book description, tagline and author bio", "Keywords and category research", "3D mockups and launch graphics"] },
      { phase: "Phase 3", title: "Launch & Market", bullets: ["Launch timeline and checklist", "Author landing page and email sequence", "Social content and optional ads", "Results report and next steps"] },
    ],
    results: [],
    forYou: ["You've written (or are writing) a book and want it published properly", "You'd rather publish under your own name and account than sign rights away", "You want a professional cover and listing without hiring five freelancers", "You're a coach, consultant or business using a book to build authority"],
    tools: ["Amazon KDP", "Apple Books", "Google Play Books", "Kobo Writing Life", "EPUB 3", "Canva", "Figma", "Mailchimp", "Meta Ads"],
    faqs: [
      ...honestFaq,
      { q: "Which formats do you deliver?", a: "Usually a reflowable EPUB for eBook stores, a print-ready interior PDF at your trim size for paperbacks, and an editable Word file. Covers come as an eBook cover image and, for print, a full wrap sized to your page count." },
      { q: "How much does it cost?", a: "It depends on the length of the book and which parts you need. You'll get a fixed quote after a free call. The free tools on this site are free to use." },
      { q: "How long does it take?", a: "Formatting and a cover typically take 1–3 weeks once the manuscript is final; a full launch campaign is usually planned 6–12 weeks ahead of launch day." },
    ],
  },
  {
    slug: "ebook-formatting-conversion",
    name: "eBook Formatting & Conversion",
    short: "Your manuscript formatted and converted into clean EPUB, print PDF and Word files.",
    icon: "📘", gradient: "from-amber-500 to-orange-600",
    hero: { headline: "Professional eBook and Print Files from Your Manuscript.",
      sub: "We format and convert manuscripts, notes, blog posts and course content into reflowable EPUB, print-ready interior PDFs and editable Word files, with a proper contents page, chapter styles and consistent typography." },
    pains: [
      { icon: "❌", title: "Formatting that breaks on Kindle", body: "Manual spacing and tabs look fine in Word and fall apart on an e-reader." },
      { icon: "❌", title: "Print interiors with wrong margins", body: "Text too close to the spine or edge gets a file rejected." },
      { icon: "❌", title: "Content scattered across documents", body: "Blog posts, notes and drafts that need to become one coherent book." },
      { icon: "❌", title: "No proper contents page", body: "Readers can't navigate, and platforms flag missing navigation." },
    ],
    criteria: [
      { title: "Real styles", body: "Headings and paragraphs styled properly, never spaced by hand." },
      { title: "Navigation", body: "A linked contents page and the reader's built-in menu both work." },
      { title: "Platform-correct", body: "Trim size, margins by page count and embedded fonts for print." },
      { title: "Your words untouched", body: "We format; we don't rewrite unless you ask us to edit." },
    ],
    process: [
      { phase: "Phase 1", title: "Review", bullets: ["Collect the manuscript and assets", "Agree formats, trim size and style", "Flag images, tables and footnotes"] },
      { phase: "Phase 2", title: "Format", bullets: ["Chapter structure and contents page", "Typography and front matter", "EPUB, print PDF and Word builds"] },
      { phase: "Phase 3", title: "Proof", bullets: ["Check on e-reader apps and the platform previewer", "One round of corrections", "Final files and upload guidance"] },
    ],
    results: [],
    forYou: ["You have a finished manuscript in Word or Google Docs", "You want to turn blog posts or a course into an eBook", "Your current files were rejected or look unprofessional", "You need both eBook and paperback files"],
    tools: ["EPUB 3", "Kindle Previewer", "Amazon KDP", "Microsoft Word", "Google Docs", "Adobe InDesign"],
    faqs: [
      { q: "Can I try it myself first?", a: "Yes. Our free eBook Creator converts pasted text or a .docx file into PDF, EPUB and Word files you can preview before signing in. For complex books (images, tables, footnotes, poetry) our formatting service handles what the tool doesn't." },
      { q: "Will you change my writing?", a: "No. Formatting never changes your words. Editing or proofreading is a separate, explicit service." },
      { q: "Do you handle images and tables?", a: "Yes, in the formatting service. The free tool imports text, headings, lists and emphasis and tells you about anything it can't carry over." },
      ...honestFaq.slice(0, 1),
    ],
  },
  {
    slug: "book-cover-design",
    name: "Book Cover Design",
    short: "eBook covers and full paperback wraps designed for your genre and readers.",
    icon: "🎨", gradient: "from-fuchsia-500 to-rose-600",
    hero: { headline: "A Book Cover That Looks Right for Your Genre — at Thumbnail Size.",
      sub: "Cover concepts, final eBook covers and print wraps with spine and bleed calculated from your page count and paper, designed to be readable on a phone screen and on a shelf." },
    pains: [
      { icon: "❌", title: "Covers that look homemade", body: "Readers judge quality in under a second, mostly from the cover." },
      { icon: "❌", title: "Unreadable thumbnails", body: "Thin type and busy images vanish at the size shoppers actually see." },
      { icon: "❌", title: "Wrong print dimensions", body: "Spine and bleed calculated wrongly means a rejected or badly trimmed cover." },
      { icon: "❌", title: "Off-genre signals", body: "A thriller that looks like a romance attracts the wrong readers." },
    ],
    criteria: [
      { title: "Genre fit", body: "Typography, colour and imagery readers of your genre recognise." },
      { title: "Thumbnail-first", body: "Title legible at small sizes." },
      { title: "Correct specs", body: "eBook size and ratio; print wraps with spine, bleed and safe zones." },
      { title: "Licensed assets", body: "Fonts and images you're allowed to use commercially." },
    ],
    process: [
      { phase: "Phase 1", title: "Brief", bullets: ["Genre, audience and comparable titles", "Mood and must-haves", "Formats and page count"] },
      { phase: "Phase 2", title: "Concepts", bullets: ["Several directions to compare", "Typography and colour options", "Your choice and feedback"] },
      { phase: "Phase 3", title: "Final files", bullets: ["eBook cover at the platform's size", "Print wrap with spine and bleed", "3D mockups for promotion (optional)"] },
    ],
    results: [],
    forYou: ["You're about to publish and need a professional cover", "Your current cover isn't attracting clicks", "You need an eBook cover and a matching paperback wrap", "You're publishing a series and want a consistent look"],
    tools: ["Adobe Photoshop", "Adobe Illustrator", "Figma", "Canva", "Licensed stock libraries"],
    faqs: [
      { q: "What's the difference between an eBook cover and a print cover?", a: "An eBook cover is a single front image (Amazon KDP recommends 2,560 × 1,600 pixels, a 1.6:1 ratio). A paperback cover is one wide file with the back, spine and front, plus bleed around the edges; its width depends on the trim size, page count and paper." },
      { q: "Can I try cover ideas myself?", a: "Yes. Our free Cover Designer generates editable concepts from your title, genre and style, and exports eBook covers and print-wrap layout proofs after you sign in." },
      { q: "Do you use AI images?", a: "Only if you want them and the platform allows them; some platforms ask you to declare AI-generated content. Otherwise we use licensed photography, illustration or typography-led designs." },
      honestFaq[1],
    ],
  },
  {
    slug: "book-mockups-graphics",
    name: "Book Mockups & Promotional Graphics",
    short: "3D book mockups, device shots and launch graphics sized for each platform.",
    icon: "🖼️", gradient: "from-violet-500 to-indigo-600",
    hero: { headline: "Make Your Book Look Real Before Readers Hold It.",
      sub: "3D eBook and paperback mockups, tablet and phone compositions, social launch posts, stories, banners and quote cards — a consistent promo pack built from your actual cover." },
    pains: [
      { icon: "❌", title: "A flat cover image everywhere", body: "A cover alone doesn't feel like a product people can own." },
      { icon: "❌", title: "Wrong sizes for every platform", body: "Cropped titles on stories, blurry banners, mismatched posts." },
      { icon: "❌", title: "No visuals for launch week", body: "Launch posts get made in a rush the night before." },
      { icon: "❌", title: "Inconsistent branding", body: "Every graphic looks like a different book." },
    ],
    criteria: [
      { title: "Built from your cover", body: "Every image uses your real cover, never a stock book." },
      { title: "Right sizes", body: "Square, portrait, story and banner formats." },
      { title: "Consistent", body: "One palette and type system across the pack." },
      { title: "Ready to post", body: "Exported and named for each channel." },
    ],
    process: [
      { phase: "Phase 1", title: "Plan", bullets: ["Channels and launch moments", "Quotes and hooks to feature", "Visual direction from your cover"] },
      { phase: "Phase 2", title: "Create", bullets: ["3D and device mockups", "Social posts, stories and banners", "Quote and announcement cards"] },
      { phase: "Phase 3", title: "Deliver", bullets: ["Organised export pack", "Captions to match (optional)", "Updates for later promotions"] },
    ],
    results: [],
    forYou: ["You have a cover and need launch visuals", "You want consistent graphics across Instagram, Facebook, TikTok and email", "You're running a pre-order or launch campaign", "You need mockups for your website or media kit"],
    tools: ["Adobe Photoshop", "Figma", "Canva", "CapCut"],
    faqs: [
      { q: "Can I make mockups myself?", a: "Yes. The free Mockup Generator places your cover on 3D books, tablets and phones and builds social graphics. Sign in to download them." },
      { q: "Which sizes do you deliver?", a: "Typically square (1080 × 1080), portrait (1080 × 1350), story (1080 × 1920) and a banner/link-preview size (1200 × 628), plus any others your channels need." },
      honestFaq[1],
    ],
  },
  {
    slug: "book-metadata-positioning",
    name: "Book Metadata & Positioning",
    short: "Book descriptions, taglines, author bios, keywords and categories that help readers find you.",
    icon: "✍️", gradient: "from-sky-500 to-blue-600",
    hero: { headline: "Help the Right Readers Find Your Book — and Click Buy.",
      sub: "Positioning, book descriptions, taglines, author bios, keyword and category research for store listings, written within each platform's rules — no misleading keywords or invented praise." },
    pains: [
      { icon: "❌", title: "A description that summarises instead of sells", body: "Plot summaries and tables of contents don't make people want to read." },
      { icon: "❌", title: "Keywords wasted", body: "Repeating the title, or using terms readers don't search for." },
      { icon: "❌", title: "The wrong categories", body: "Broad categories bury the book among thousands of others." },
      { icon: "❌", title: "Rules broken by accident", body: "Reviews, links or promotional claims in a description can be removed by the platform." },
    ],
    criteria: [
      { title: "Reader-first", body: "Who it's for and why they'll care, in the first lines." },
      { title: "Rule-aware", body: "Lengths and content rules checked before you paste it in." },
      { title: "Researched", body: "Keywords and categories based on how readers browse and search." },
      { title: "Honest", body: "No invented reviews, awards or bestseller claims." },
    ],
    process: [
      { phase: "Phase 1", title: "Position", bullets: ["Audience, comparable titles and promise", "Genre and sub-genre", "What makes it different"] },
      { phase: "Phase 2", title: "Write", bullets: ["Description, tagline and author bio", "Keyword and category shortlist", "Variants to test"] },
      { phase: "Phase 3", title: "Refine", bullets: ["Review after launch data", "Update keywords and copy", "A+ / landing page copy (optional)"] },
    ],
    results: [],
    forYou: ["You're about to list your book and want the copy right first time", "Your book is live but rarely appears in searches", "You struggle to describe your own book", "You're relaunching or repositioning a backlist title"],
    tools: ["Amazon KDP", "Publisher Rocket (optional)", "Google Trends", "Goodreads"],
    faqs: [
      { q: "Can AI write my book description?", a: "Our free Marketing Assistant drafts descriptions, taglines, bios, keywords and captions from your summary. Everything is editable, and it checks your draft against KDP's published rules (for example the 4,000-character limit and no reviews or links in descriptions)." },
      { q: "How many keywords can I use?", a: "Amazon KDP lets you add up to seven keywords or short phrases. Avoid words already in your title or categories, quality claims, other authors' names and Amazon programme names." },
      honestFaq[1],
    ],
  },
  {
    slug: "book-launch-strategy",
    name: "Book Launch Strategy",
    short: "A launch plan with a timeline, channels, content and an email sequence.",
    icon: "🚀", gradient: "from-emerald-500 to-teal-600",
    hero: { headline: "A Book Launch Planned Weeks Ahead, Not the Night Before.",
      sub: "Launch timelines, advance reader copies, pre-orders, content calendars, email sequences, partnerships and launch-week promotion — matched to your audience and budget." },
    pains: [
      { icon: "❌", title: "No build-up", body: "Announcing a book on launch day gives readers no reason to wait for it." },
      { icon: "❌", title: "No early reviews", body: "Without advance readers, the listing starts with nothing." },
      { icon: "❌", title: "No list", body: "Social posts reach a fraction of followers; email reaches readers directly." },
      { icon: "❌", title: "One week, then nothing", body: "Sales drop off when promotion stops." },
    ],
    criteria: [
      { title: "Dated plan", body: "Every task has a date and an owner." },
      { title: "Channels that fit", body: "Only the channels your readers actually use." },
      { title: "Budget-aware", body: "Works with zero ad spend; scales if you add it." },
      { title: "Beyond week one", body: "Post-launch content and promotions planned too." },
    ],
    process: [
      { phase: "Phase 1", title: "Plan", bullets: ["Launch date, goals and budget", "Audience and channels", "Timeline and checklist"] },
      { phase: "Phase 2", title: "Build up", bullets: ["Advance reader team", "Pre-order or waitlist", "Content calendar and email sequence"] },
      { phase: "Phase 3", title: "Launch", bullets: ["Launch-week promotion", "Partnerships and media", "Post-launch follow-up and report"] },
    ],
    results: [],
    forYou: ["Your launch date is 4–16 weeks away", "You have a small or no mailing list yet", "You want a plan you can run yourself, or with us", "You're launching a book alongside a business or course"],
    tools: ["Mailchimp", "MailerLite", "BookFunnel", "Instagram", "TikTok", "Meta Ads", "Google Calendar"],
    faqs: [
      { q: "How early should I start planning?", a: "Ideally 8–12 weeks before launch, so there's time for advance readers and a waitlist. Our free Launch Planner builds a dated plan from whatever time you have." },
      { q: "Do I need an ad budget?", a: "No. Many launches rely on email, advance readers, partnerships and organic social. Ads can extend reach once the listing converts." },
      honestFaq[1],
    ],
  },
  {
    slug: "book-marketing",
    name: "Book Marketing",
    short: "Ongoing book marketing through email, social media, author landing pages and ads.",
    icon: "📣", gradient: "from-pink-500 to-rose-600",
    hero: { headline: "Keep Your Book Selling Long After Launch Week.",
      sub: "Author landing pages, reader email lists and sequences, social content, promotions and carefully tested ads on Amazon, Meta and Google — measured by what each channel actually delivers." },
    pains: [
      { icon: "❌", title: "Sales stopped after launch", body: "Most books need ongoing visibility, not one push." },
      { icon: "❌", title: "No home base", body: "Without an author site and list, every sale depends on a platform." },
      { icon: "❌", title: "Ads that burn money", body: "Ads pointed at a listing that doesn't convert lose money quickly." },
      { icon: "❌", title: "No idea what works", body: "Without tracking, the same mistakes repeat." },
    ],
    criteria: [
      { title: "Own your audience", body: "An author page and email list you control." },
      { title: "Content with a purpose", body: "Posts that point readers somewhere." },
      { title: "Ads only when ready", body: "Tested in small budgets, scaled only if profitable." },
      { title: "Tracked", body: "Links, codes and a monthly report." },
    ],
    process: [
      { phase: "Phase 1", title: "Foundations", bullets: ["Author landing page", "Reader magnet and email list", "Listing and tracking review"] },
      { phase: "Phase 2", title: "Promote", bullets: ["Monthly content plan", "Email newsletters and sequences", "Promotions and partnerships"] },
      { phase: "Phase 3", title: "Scale", bullets: ["Small ad tests", "Scale what's profitable", "Monthly results report"] },
    ],
    results: [],
    forYou: ["Your book is published and sales are slow", "You want an author website and mailing list", "You're writing a series and want readers to follow", "You use a book to win clients for your business"],
    tools: ["Amazon Ads", "Meta Ads", "Google Ads", "Mailchimp", "MailerLite", "WordPress", "Instagram", "TikTok"],
    faqs: [
      { q: "Is book marketing different from other marketing?", a: "The principles are the same (audience, message, offer, channels, tracking), but books have small margins, so organic channels and email usually matter more, and ads need careful testing." },
      { q: "Can you build my author website?", a: "Yes — an author landing page or full site with your books, a mailing-list sign-up and links to each store. It's part of our website service too." },
      honestFaq[1],
    ],
  },
];

const wf = (a: [string, string][]) => a.map(([label, detail]) => ({ label, detail }));

export const PUBLISHING_EXTRAS: Record<string, ServiceExtra> = {
  "ebook-publishing": {
    audience: "Authors, coaches, consultants and businesses publishing eBooks and paperbacks under their own name.",
    deliverables: ["Manuscript formatting (EPUB, print PDF, Word)", "eBook cover and paperback wrap", "Book description, tagline and author bio", "Keyword and category shortlist", "3D mockups and launch graphics", "Launch plan and marketing support"],
    timeline: "Files and cover in 1–3 weeks; launches planned 6–12 weeks ahead",
    engagement: "Project, with optional ongoing marketing",
    demo: "workflow",
    workflow: wf([["Manuscript", "Your text, untouched"], ["Format", "EPUB, PDF, Word"], ["Cover", "eBook + print wrap"], ["Listing", "Description + keywords"], ["Launch", "Plan, graphics, email"]]),
    questions: [STAGE, FORMAT, { id: "need", label: "What do you need help with?", options: ["Formatting & conversion", "Cover design", "Mockups & graphics", "Description & keywords", "Launch plan", "Ongoing marketing"], multi: true }, START],
  },
  "ebook-formatting-conversion": {
    audience: "Authors and businesses with a manuscript, notes or course content to turn into a book.",
    deliverables: ["Reflowable EPUB 3 with linked contents", "Print-ready interior PDF at your trim size", "Editable Word file", "Front matter (title, copyright, dedication)", "Proof on readers and previewers", "One round of corrections"],
    timeline: "Typically 5–10 working days",
    engagement: "Fixed-price project",
    demo: "workflow",
    workflow: wf([["Upload", "Word, Docs or text"], ["Structure", "Chapters + contents"], ["Style", "Typography + front matter"], ["Build", "EPUB, PDF, Word"], ["Proof", "Readers + previewer"]]),
    questions: [STAGE, FORMAT, { id: "content", label: "What does the book include?", options: ["Text only", "Images", "Tables or charts", "Footnotes", "Poetry or special layout"], multi: true }, START],
  },
  "book-cover-design": {
    audience: "Authors who need a professional eBook cover, a paperback wrap, or a series look.",
    deliverables: ["Genre and comparable-title review", "Several cover concepts", "Final eBook cover", "Paperback wrap with spine and bleed", "Licensed fonts and imagery", "3D mockup (optional)"],
    timeline: "Typically 1–2 weeks",
    engagement: "Fixed-price project",
    demo: "workflow",
    workflow: wf([["Brief", "Genre, mood, readers"], ["Concepts", "Directions to compare"], ["Refine", "Type, colour, image"], ["eBook", "Front cover file"], ["Print", "Wrap with spine"]]),
    questions: [FORMAT, { id: "genre", label: "Genre", options: ["Fiction", "Non-fiction / business", "Memoir", "Children's", "Faith & inspiration", "Other"] }, START],
  },
  "book-mockups-graphics": {
    audience: "Authors preparing a launch, pre-order or promotion who need consistent visuals.",
    deliverables: ["3D eBook and paperback mockups", "Tablet and phone compositions", "Social posts and stories", "Banners and link previews", "Quote and announcement cards", "Organised export pack"],
    timeline: "Typically 3–7 working days",
    engagement: "Fixed-price pack",
    demo: "workflow",
    workflow: wf([["Cover", "Your final cover"], ["Mockups", "3D + devices"], ["Social", "Posts + stories"], ["Banners", "Web + email"], ["Pack", "Named exports"]]),
    questions: [{ id: "channels", label: "Where will you promote?", options: ["Instagram", "Facebook", "TikTok", "X", "LinkedIn", "Email", "Website"], multi: true }, START],
  },
  "book-metadata-positioning": {
    audience: "Authors listing a new book or improving a listing that isn't being found.",
    deliverables: ["Positioning summary", "Book description (with variants)", "Tagline and author bio", "Keyword shortlist", "Category recommendations", "Listing rules check"],
    timeline: "Typically 3–7 working days",
    engagement: "Fixed-price project",
    demo: "workflow",
    workflow: wf([["Book", "Summary + audience"], ["Position", "Genre + promise"], ["Copy", "Description + bio"], ["Discover", "Keywords + categories"], ["Check", "Platform rules"]]),
    questions: [STAGE, { id: "platforms", label: "Where will it be sold?", options: ["Amazon KDP", "Apple Books", "Google Play Books", "Kobo", "My own website"], multi: true }, START],
  },
  "book-launch-strategy": {
    audience: "Authors with a launch date in the next few months.",
    deliverables: ["Dated launch timeline", "Checklist with owners", "Content calendar", "Email sequence outline", "Advance reader plan", "Launch-week promotion plan"],
    timeline: "Plan in 1–2 weeks; launches 6–12 weeks ahead",
    engagement: "Project, optional launch management",
    demo: "workflow",
    workflow: wf([["Goals", "Date, budget, readers"], ["Build-up", "ARC + waitlist"], ["Content", "Calendar + emails"], ["Launch", "Week-one push"], ["After", "Keep it selling"]]),
    questions: [{ id: "when", label: "When is your launch?", options: ["Within 4 weeks", "1–3 months", "3–6 months", "Not set yet"] }, { id: "list", label: "Do you have a mailing list?", options: ["No", "Under 500", "500–5,000", "5,000+"] }, START],
  },
  "book-marketing": {
    audience: "Published authors and businesses who want a book to keep selling or winning clients.",
    deliverables: ["Author landing page", "Reader magnet and email sequence", "Monthly content plan", "Promotions and partnerships", "Ad tests (Amazon, Meta, Google)", "Monthly results report"],
    timeline: "Foundations in 2–4 weeks, then monthly",
    engagement: "Monthly",
    demo: "dashboard",
    questions: [{ id: "status", label: "Where is your book?", options: ["Launching soon", "Published, slow sales", "Published, selling, want to scale"] }, { id: "channels", label: "Channels you use now", options: ["Email list", "Instagram", "TikTok", "Facebook", "Amazon Ads", "None yet"], multi: true }, START],
  },
};

export const PUBLISHING_QA: Record<string, ServiceQA[]> = {
  "ebook-publishing": [
    { q: "How do I publish an eBook?", a: "Finish and edit the manuscript, format it as an EPUB (and a print PDF for a paperback), create a cover at the platform's size, write the description and choose keywords and categories, then upload to stores such as Amazon KDP, Apple Books, Google Play Books or Kobo from your own account. Plan the launch before the book goes live." },
    { q: "What's the difference between self-publishing and a publishing service?", a: "Self-publishing means you publish under your own account and keep your rights and royalties. A publishing-support service like ours does the preparation and marketing work for a fee; it doesn't take your rights or royalties." },
  ],
  "ebook-formatting-conversion": [
    { q: "What file format do eBook stores accept?", a: "EPUB is the standard for most stores, including Amazon KDP, Apple Books, Google Play Books and Kobo. Paperbacks need a print-ready interior PDF at the chosen trim size with fonts embedded." },
  ],
  "book-cover-design": [
    { q: "What size should an eBook cover be?", a: "Amazon KDP recommends 2,560 × 1,600 pixels (height × width), a 1.6:1 ratio, with a minimum of 1,000 × 625 pixels, in JPEG or TIFF. Other stores accept similar portrait sizes; check each platform's current guidance." },
    { q: "How is a paperback cover size calculated?", a: "Width = bleed + back cover + spine + front cover + bleed; height = bleed + trim height + bleed. On KDP bleed is 0.125 in, and the spine is the page count × the paper thickness (for example 0.002252 in per page for white paper)." },
  ],
  "book-mockups-graphics": [
    { q: "What is a book mockup?", a: "A realistic image of your cover on a physical book, tablet or phone, used in social posts, ads, websites and media kits so readers can picture the finished product." },
  ],
  "book-metadata-positioning": [
    { q: "What should a book description include?", a: "A hook in the first line, who the book is for, what it promises or what's at stake, and why it's different — in short paragraphs. Leave out reviews, links, prices and time-limited offers; KDP doesn't allow them in descriptions." },
  ],
  "book-launch-strategy": [
    { q: "How do I launch a book with no audience?", a: "Start 8–12 weeks ahead: build a small advance reader team, collect emails with a free sample, partner with people who already reach your readers, and keep promoting after launch week with content and occasional promotions." },
  ],
  "book-marketing": [
    { q: "What's the best way to market a self-published book?", a: "Make the listing convert first (cover, description, sample), build an email list you own, use the one or two social channels your readers prefer, run promotions, and test ads with small budgets once the listing converts." },
  ],
};

export const PUBLISHING_FAQS = [
  { q: "Do I keep the rights to my book?", a: "Yes. You publish under your own account and keep your rights and royalties. We're paid for the work we do, not a share of your book." },
  { q: "Are the book tools really free?", a: "Yes. You can paste or upload your text, build covers, mockups, descriptions and launch plans, and preview everything without an account. Signing in (free) lets you download files and save projects to your author workspace." },
  { q: "Will the AI rewrite my manuscript?", a: "No. Formatting and conversion never change your words. AI suggestions only appear when you ask for them, and you choose what to use." },
  { q: "Can you publish the book for me?", a: "We prepare everything and can guide you through the upload, but the book is published from your own platform account, so you stay in control. We don't guarantee acceptance, sales or rankings." },
  { q: "What does a book project cost?", a: "It depends on the book's length and which services you need. You'll get a fixed quote after a free call." },
];

export const isPublishingSlug = (s: string) => PUBLISHING_EXPERTISE.some((e) => e.slug === s);
