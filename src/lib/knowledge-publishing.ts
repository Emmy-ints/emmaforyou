/**
 * Knowledge-base guides for the publishing service line. Platform figures come from Amazon KDP's
 * help pages (checked 28 Oct 2026, listed in src/lib/books/specs.ts) and are attributed in the text.
 */
import type { Article } from "./knowledge-data";

export const PUBLISHING_ARTICLES: Article[] = [
  {
    slug: "ebook-formats-epub-pdf-docx",
    title: "eBook Formats Explained: EPUB, PDF or Word — Which Do You Need?",
    excerpt: "What EPUB, print-ready PDF and Word files are for, which one each store expects, and how to prepare a manuscript so conversion goes smoothly.",
    category: "Publishing", difficulty: "Beginner", readMin: 7,
    body: `## The short answer

- **EPUB** is the file eBook stores and reading apps use. It *reflows*: the reader chooses the text size, so there are no fixed pages.
- **A print-ready PDF** is for paperbacks and hardbacks. Every page is fixed at your trim size (for example 6 × 9 in), with fonts embedded and margins that suit the page count.
- **Word (.docx)** is your editable master copy. Most platforms accept it as an upload and convert it themselves, but you get more control by preparing the EPUB and PDF yourself.

Most self-published authors need an EPUB for the eBook, a PDF interior for the paperback, and the Word file to keep editing.

## EPUB: the eBook standard

EPUB is a package of web pages, a stylesheet, images and a navigation file. Because it reflows, design choices that rely on fixed positions (manual line breaks, tabs for indents, empty lines for spacing) can look wrong on a phone or e-reader.

A good EPUB has:

1. **A real table of contents** built from your chapter headings, so readers can jump between chapters from the reader's own menu.
2. **Metadata**: title, author, language and an identifier.
3. **Consistent styles** for chapter titles, sub-headings, first paragraphs, quotes and scene breaks.
4. **A cover image** (stores usually take the cover separately as well).

Amazon KDP, Apple Books, Google Play Books and Kobo all accept EPUB uploads.

## Print-ready PDF: for paperbacks

A paperback interior PDF fixes every page. Things to get right:

- **Trim size** matches what you choose on the platform (6 × 9 in is common for non-fiction and many novels; 5 × 8 in or 5.5 × 8.5 in for shorter fiction).
- **Margins**: on KDP the inside (gutter) margin depends on the page count — at least 0.375 in for 24–150 pages, rising to 0.875 in for 701–828 pages — and outside margins must be at least 0.25 in without bleed.
- **Fonts are embedded**, so the printer uses exactly the font you designed with.
- **Chapters start on new pages**, with page numbers in the footer and a contents page that matches them.

## Word: the master copy

Keep your manuscript in Word or Google Docs and use **Heading 1** for chapter titles. Converters rely on heading styles to find chapters and build the contents, so a chapter title that's just bold text in a bigger size is easy to miss.

## Preparing your manuscript for conversion

- Use Heading 1 for chapter titles and Heading 2 for sections.
- Indent paragraphs with the paragraph style, not tabs or spaces.
- Use a centred "* * *" line for scene breaks instead of empty lines.
- Keep images high quality (at least 300 DPI for print) and make sure you have the rights to use them.
- Remove tracked changes and comments before converting.

## Try it free

Our [eBook Creator](/publishing/ebook-creator) turns pasted text or a Word file into a PDF, EPUB and Word file you can preview page by page — without changing your words. If your book has images, tables, footnotes or a complex layout, our [formatting and conversion service](/expertise/ebook-formatting-conversion) prepares and proofs the files for you.`,
  },
  {
    slug: "ebook-vs-paperback-cover-specs",
    title: "eBook vs Paperback Covers: Sizes, Spine Width and Bleed Explained",
    excerpt: "Why an eBook cover and a paperback cover are different files, KDP's recommended sizes, how spine width is calculated, and what bleed and safe zones mean.",
    category: "Publishing", difficulty: "Beginner", readMin: 6,
    body: `## Two different files

An **eBook cover** is a single front image shown in stores and on reading devices. A **paperback cover** is one wide file containing the back cover, the spine and the front cover, plus extra "bleed" around the edges that gets trimmed off.

## eBook cover size

Amazon KDP recommends an eBook cover of **2,560 × 1,600 pixels** (height × width), a ratio of 1.6 : 1, with a minimum of 1,000 × 625 pixels. It prefers JPEG (TIFF is also accepted), in RGB colour and under 50 MB. Other stores accept similar portrait sizes — check each one's current guidance.

Design for the thumbnail: most shoppers first see your cover as a small image in search results, so the title must be readable at that size.

## Paperback cover size

The full cover's dimensions come from the trim size, the page count and the paper:

- **Height** = bleed + trim height + bleed
- **Width** = bleed + back cover + spine + front cover + bleed

On KDP, bleed is **0.125 in** (3.2 mm) on each edge, and the spine width is **page count × paper thickness**. KDP gives 0.002252 in per page for white paper and 0.0025 in per page for cream. A 300-page book on white paper has a spine of about 0.676 in.

That's why you should finish the interior first: the final page count decides the spine.

## Safe zones and spine text

- Keep text on the front and back at least **0.125 in inside the trim line** so nothing gets cut off.
- KDP only allows **spine text on books with at least 79 pages**, and asks for at least 0.0625 in of space on either side of it.
- Leave room on the back cover for the barcode; KDP adds one if you don't supply your own (check the KDP cover template for the exact area).

## Colour and resolution

Print covers should be **300 DPI**. KDP asks for images in **CMYK** in a single PDF. Most browser and phone tools work in RGB, so convert the final file in a design tool, or have your designer supply the print-ready PDF.

## Try it free

Our [Cover Designer](/publishing/cover-designer) calculates the spine and bleed from your page count, shows trim and safe-area guides, and exports an eBook cover at KDP's recommended size and a paperback wrap proof. For an original, professionally designed cover with licensed images and a CMYK print file, see our [book cover design service](/expertise/book-cover-design). Then turn the cover into [3D mockups and launch graphics](/publishing/mockups).`,
  },
  {
    slug: "write-a-book-description-that-sells",
    title: "How to Write a Book Description (and Keywords) Readers Click",
    excerpt: "A simple structure for book descriptions, what Amazon KDP doesn't allow in them, and how to choose seven keywords that help the right readers find you.",
    category: "Publishing", difficulty: "Beginner", readMin: 7,
    body: `## What a book description is for

Your description has one job: help the right reader decide this book is for them. It isn't a summary of every chapter or the whole plot.

## A structure that works

1. **Hook (one or two lines).** The situation, question or promise that makes your reader lean in.
2. **The stakes or the promise.** For fiction: who wants what, what stands in the way, what happens if they fail. For non-fiction: the problem, and what the reader will be able to do after reading.
3. **Why this book.** The angle, method or voice that makes it different.
4. **Who it's for.** "Perfect for readers who love…" or "For first-time managers who…".

Keep paragraphs short — most people read listings on a phone.

## What KDP doesn't allow in descriptions

Amazon KDP's guidelines limit descriptions to **4,000 characters** and don't accept, among other things:

- phone numbers, email or postal addresses, or website links;
- reviews, quotes or testimonials, or requests for reviews;
- advertising, time-sensitive information (tour dates, promotions), prices or availability;
- spoilers, emoji, or lists of keywords.

Claims you can't prove ("bestseller", "#1", "award-winning") also put your listing at risk: KDP has a zero-tolerance policy for misleading metadata.

## Choosing keywords

KDP lets you add **up to seven keywords or short phrases**. Use them for words readers actually type that aren't already in your title, subtitle or categories:

- the sub-genre and setting ("cosy mystery small town", "Lagos family saga");
- the reader's problem or goal ("first-time manager", "pay off debt");
- themes, character types or tropes readers search for.

Avoid other authors' names, brand names you don't own, Amazon programme names (such as Kindle Unlimited), quality claims, "new" or "on sale", quotation marks, and spelling or plural duplicates.

## Categories

Choose the most specific categories that genuinely fit, from the list in your KDP dashboard. A precise category puts your book in front of readers who browse it; a broad one buries it among thousands of titles.

## Try it free

Our [Book Description & Marketing Assistant](/publishing/book-marketing) drafts a description, taglines, an author bio, keywords, category ideas, social captions and launch emails from your summary — then checks your edits against these rules. For positioning research and copy written with you, see [book metadata and positioning](/expertise/book-metadata-positioning), and plan the rest with the [launch planner](/publishing/launch-planner).`,
  },
];
