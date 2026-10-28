import type { BlogPost } from "../blog-data";

const EMMA = { name: "Emmanuel Oluwaseun Akinloye", role: "Founder, EmmaForYou", initials: "EA" };

export const POSTS_PUBLISHING: BlogPost[] = [
  {
    slug: "launch-a-book-with-a-small-audience",
    title: "How to Launch a Book When You Don't Have a Big Audience Yet",
    seoTitle: "How to Launch a Book With a Small Audience",
    category: "Publishing",
    excerpt: "A practical 8-week launch plan for first-time authors: advance readers, a simple email list, the two social channels that matter, and what to do after launch week.",
    read: "7 min", date: "Oct 28, 2026", author: EMMA,
    cover: { from: "#ffb347", to: "#ff6a3d", emoji: "📚" },
    tool: { label: "Book launch planner", to: "/publishing/launch-planner", text: "Enter your launch date and channels to get a dated checklist, content calendar and email outline." },
    body: `## Start before the book is "ready"

Most first launches go quiet because the author announces the book on the day it comes out. Readers need a reason to wait for it, and you need a few weeks to find the first people who care. Aim to start **8–12 weeks before launch day**.

## Weeks 8–6: foundations

- **Finish the files.** Final proofread, then the EPUB and print PDF, checked in the store's previewer.
- **Lock the cover.** Check the title is readable at thumbnail size.
- **Write the listing.** A description with a hook, the stakes or promise, and who it's for — plus seven keywords and specific categories.
- **Make one simple home for the book.** A page with the cover, the description, a sample chapter and a sign-up form.

## Weeks 6–4: find your first readers

- **Advance readers.** Invite 10–50 people who enjoy your genre to read early, and ask them to post *honest* reviews after launch. Never pay for reviews or require positive ones — it breaks store rules and readers can tell.
- **A free sample for emails.** Offer the first chapter in exchange for an email address. Email reaches people directly; social posts reach a fraction of your followers.
- **Pick two channels.** Where do your readers already spend time? Do those two well rather than six badly.

## Weeks 4–1: build up

- Reveal the cover and the date.
- Share why you wrote the book, a favourite line, and who it's for.
- Count down in the final week, and prepare launch-day posts in advance so you're not writing them on the day.

## Launch week

Post everywhere you've been active, send the launch email, thank your advance readers and remind them their honest reviews help other readers decide. Check every store link works.

## After launch week

Sales usually drop after the first week. Keep going: a reminder email, a guest post or podcast, a price promotion, a new audience. Look at what actually drove sales and sign-ups, and improve your description or keywords if the listing isn't converting.

## The honest part

No plan guarantees sales or rankings. A clear listing, a cover that fits the genre and steady promotion give your book its best chance — and you learn what works for your readers.

Want the plan with dates? Use the free [book launch planner](/publishing/launch-planner), write your listing with the [book description assistant](/publishing/book-marketing), or see our [book launch strategy](/expertise/book-launch-strategy) service.`,
  },
];
