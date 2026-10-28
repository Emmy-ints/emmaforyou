/**
 * Book launch plan: a dated task list built from the author's launch date, channels and budget,
 * plus a content calendar, an email sequence outline and calendar/CSV exports. Rules only — the
 * optional AI ideas come separately and are labelled.
 */
export type Channel = "email" | "instagram" | "tiktok" | "facebook" | "x" | "linkedin" | "youtube" | "blog" | "whatsapp" | "ads" | "events" | "podcasts" | "arc";
export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "email", label: "Email list" }, { id: "arc", label: "Advance readers (ARC team)" }, { id: "instagram", label: "Instagram" }, { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook (page / groups)" }, { id: "x", label: "X / Twitter" }, { id: "linkedin", label: "LinkedIn" }, { id: "youtube", label: "YouTube" },
  { id: "whatsapp", label: "WhatsApp (status / broadcast)" }, { id: "blog", label: "Website / blog" }, { id: "podcasts", label: "Podcasts & interviews" }, { id: "events", label: "Events / readings" }, { id: "ads", label: "Paid ads" },
];
export type Budget = "0" | "low" | "mid" | "high";
export const BUDGETS: { id: Budget; label: string }[] = [{ id: "0", label: "No ad budget" }, { id: "low", label: "Under $200" }, { id: "mid", label: "$200–$1,000" }, { id: "high", label: "Over $1,000" }];

export interface LaunchInput { title: string; launchDate: string; today: string; format: "ebook" | "paperback" | "both"; audience: string; channels: Channel[]; budget: Budget; preorder: boolean }
export interface Task { id: string; title: string; detail: string; due: string; phase: "Prepare" | "Build-up" | "Launch week" | "After launch"; channel: Channel | "all"; done: boolean; custom?: boolean }
export interface Post { date: string; channel: Channel; theme: string }
export interface EmailOutline { when: string; subject: string; points: string[] }
export interface Plan { tasks: Task[]; calendar: Post[]; emails: EmailOutline[]; warnings: string[] }

const day = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const parse = (d: string) => Date.parse(`${d}T12:00:00Z`);

export function buildPlan(i: LaunchInput): Plan {
  const L = parse(i.launchDate), T = parse(i.today);
  const warnings: string[] = [];
  if (!Number.isFinite(L)) return { tasks: [], calendar: [], emails: [], warnings: ["Choose a launch date."] };
  const lead = Math.round((L - T) / day);
  if (lead < 0) warnings.push("That date is in the past. Pick your next launch or relaunch date.");
  else if (lead < 21) warnings.push(`Only ${lead} days to go: tasks that should have happened earlier are scheduled for the next few days. Consider moving the date if advance reviews matter to you.`);
  const has = (c: Channel) => i.channels.includes(c);
  const at = (offset: number) => iso(Math.max(T, L + offset * day));
  const tasks: Task[] = [];
  const add = (id: string, offset: number, phase: Task["phase"], channel: Task["channel"], title: string, detail: string) => tasks.push({ id, title, detail, due: at(offset), phase, channel, done: false });

  add("final-files", -56, "Prepare", "all", "Finalise the manuscript and files", "Final edit and proofread, then build the EPUB and print PDF and check them in the store previewer.");
  add("cover", -56, "Prepare", "all", "Final cover (eBook + print wrap)", "Check the title is readable at thumbnail size and the print wrap matches the final page count.");
  add("listing", -49, "Prepare", "all", "Write the listing", "Description, keywords, categories, author bio and price. Check the store's content rules.");
  add("landing", -42, "Prepare", "blog", "Author landing page", "A page with the cover, description, sample chapter, sign-up form and store links (add links on launch day).");
  if (has("email")) add("magnet", -42, "Prepare", "email", "Free sample to grow your list", "Offer the first chapter or a bonus in exchange for an email address.");
  if (has("arc")) { add("arc-recruit", -42, "Build-up", "arc", "Recruit advance readers", "Invite 10–50 readers who enjoy the genre to read early. Ask for honest reviews after launch; never pay for or require positive reviews."); add("arc-send", -28, "Build-up", "arc", "Send advance copies", "Send the EPUB/PDF with a short note and the date reviews can be posted."); }
  if (i.preorder) add("preorder", -35, "Build-up", "all", "Set up the pre-order", "Upload the final (or near-final) files and set the release date; check the platform's pre-order deadlines.");
  add("announce", -28, "Build-up", "all", "Announce the book and date", "Cover reveal and the launch date on every channel you use.");
  for (const c of ["instagram", "tiktok", "facebook", "x", "linkedin", "youtube"] as Channel[]) if (has(c)) add(`content-${c}`, -21, "Build-up", c, `Batch launch content for ${label(c)}`, "Prepare posts for the build-up and launch week (see the calendar) so you aren't writing them on the day.");
  if (has("podcasts")) add("pitch", -35, "Build-up", "podcasts", "Pitch podcasts and media", "Send a short pitch with the book's angle to 10–20 shows or writers your readers follow.");
  if (has("events")) add("event", -21, "Build-up", "events", "Plan a launch event", "A reading, live Q&A or bookshop event in launch week.");
  if (has("whatsapp")) add("wa", -14, "Build-up", "whatsapp", "Prepare WhatsApp broadcasts", "Message only people who agreed to hear from you; one announcement and one reminder.");
  if (has("ads") && i.budget !== "0") { add("ads-setup", -10, "Build-up", "ads", "Set up small ad tests", "Prepare 2–3 ad variations (cover, hook, audience). Start small and only scale what turns clicks into sales."); }
  add("links", -1, "Launch week", "all", "Check store pages and links", "Confirm the book is live in each store and every link on your landing page works.");
  add("launch", 0, "Launch week", "all", "Launch day", "Post the announcement everywhere, send the launch email, thank your advance readers and ask them to post their honest reviews.");
  if (has("email")) add("email-reminder", 3, "Launch week", "email", "Reminder email", "A short reminder with one new reason to read (a quote, the story behind the book).");
  if (has("ads") && i.budget !== "0") add("ads-review", 7, "After launch", "ads", "Review ad results", "Keep ads that sell, pause the rest. Check cost per sale against your royalty.");
  add("review-week", 7, "After launch", "all", "Week-one review", "Note sales, sign-ups and which channel drove them.");
  add("keep-going", 21, "After launch", "all", "Plan the next promotion", "A price promotion, a new audience, a guest post or the next book's announcement.");
  add("listing-update", 30, "After launch", "all", "Improve the listing", "Update the description or keywords based on what you learned.");
  tasks.sort((a, b) => a.due.localeCompare(b.due));

  const themes = ["Cover reveal", "Behind the book: why I wrote it", "A favourite line or quote", "Who this book is for", "Meet a character / the big idea", "Countdown: one week to go", "Launch day — it's out!", "Thank you + first reader reactions (shared with permission)", "A short reading or excerpt", "Reminder + where to get it"];
  const offsets = [-28, -21, -17, -14, -10, -7, 0, 2, 5, 10];
  const social = i.channels.filter((c) => ["instagram", "tiktok", "facebook", "x", "linkedin", "youtube", "whatsapp", "blog"].includes(c));
  const calendar: Post[] = [];
  offsets.forEach((o, k) => { for (const c of social) calendar.push({ date: at(o), channel: c, theme: themes[k] }); });

  const emails: EmailOutline[] = has("email") ? [
    { when: at(-28), subject: `The cover and date for ${i.title || "my new book"}`, points: ["Reveal the cover", "Launch date", "Why you wrote it (2–3 sentences)", i.preorder ? "Pre-order link" : "Ask them to save the date"] },
    { when: at(-7), subject: "One week to go (+ a sneak peek)", points: ["A short excerpt or the first page", "Who it's for", "What happens on launch day"] },
    { when: at(0), subject: `${i.title || "The book"} is out today`, points: ["It's live — one clear link per store", "Thank you", "Honest reviews help other readers decide (no pressure)"] },
    { when: at(3), subject: "In case you missed it", points: ["One new reason to read", "A reader reaction (with permission) or a favourite quote", "Link"] },
    { when: at(14), subject: "The story behind the story", points: ["Something personal or surprising", "A question to reply to", "Link for anyone who hasn't read it yet"] },
  ] : [];
  if (!social.length && !has("email")) warnings.push("Choose at least one channel so the plan includes promotion.");
  return { tasks, calendar, emails, warnings };
}

export function label(c: Channel) { return CHANNELS.find((x) => x.id === c)?.label ?? c; }

const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
/** iCalendar file with one all-day event per task (imports into Google, Apple and Outlook calendars). */
export function toIcs(title: string, tasks: Task[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EmmaForYou//Book Launch Planner//EN", "CALSCALE:GREGORIAN"];
  for (const t of tasks) {
    const d = t.due.replace(/-/g, "");
    const next = new Date(Date.parse(`${t.due}T00:00:00Z`) + 86400000).toISOString().slice(0, 10).replace(/-/g, "");
    lines.push("BEGIN:VEVENT", `UID:${t.id}-${d}@emmaforyou.lovable.app`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${esc(`${title ? `${title}: ` : ""}${t.title}`)}`, `DESCRIPTION:${esc(t.detail)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
function fold(line: string) { const out: string[] = []; let l = line; while (new TextEncoder().encode(l).length > 74) { let cut = 74; while (new TextEncoder().encode(l.slice(0, cut)).length > 74) cut--; out.push(l.slice(0, cut)); l = ` ${l.slice(cut)}`; } out.push(l); return out.join("\r\n"); }

export function toCsv(tasks: Task[]): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return ["Due,Phase,Channel,Task,Details,Done", ...tasks.map((t) => [t.due, t.phase, t.channel === "all" ? "All" : label(t.channel), q(t.title), q(t.detail), t.done ? "yes" : "no"].join(","))].join("\n");
}
