/** Use cases for AI, automation, mobile/desktop and industry solutions (see use-cases.ts). */
export const USE_CASES_MORE: Record<string, string[]> = {
  // AI solutions
  "ai-customer-support-agent": [
    "An online store answers delivery and returns questions at night from its own policies.",
    "A clinic's assistant explains opening hours and services, then hands bookings to staff.",
    "A software company deflects common setup questions and escalates bugs to the team.",
  ],
  "ai-sales-agent": [
    "Website visitors are asked a few questions and booked into the right salesperson's calendar.",
    "Instagram enquiries about prices get the right package recommended from your price list.",
    "Leads outside your service area are politely redirected so the team only talks to good fits.",
  ],
  "ai-executive-assistant": [
    "A founder gets a morning briefing of emails, meetings and deadlines.",
    "Drafts of routine replies are prepared and wait for approval before sending.",
    "Meeting notes become a task list with owners.",
  ],
  "ai-workflow-automation-agent": [
    "Incoming requests are read, classified and routed to the right team with a log.",
    "Supplier invoices are checked against orders before reaching finance.",
    "Refund requests under a set limit are processed; larger ones wait for a manager.",
  ],
  "ai-lead-generation-assistant": [
    "A B2B agency builds a list of companies matching its ideal-client profile from permitted sources.",
    "Leads are scored so salespeople start with the most promising ones.",
    "Weekly lists of new prospects arrive in the CRM.",
  ],
  "ai-lead-research-agent": [
    "Before a sales call, the rep gets a one-page brief on the prospect's business.",
    "Account managers prepare for renewals with a summary of public news.",
    "Founders research investors' portfolios before meetings.",
  ],
  "ai-personalized-outreach-writer": [
    "Sales reps get first drafts that reference a real detail about each prospect.",
    "Partnership emails are tailored to each organisation's recent work.",
    "Follow-ups are drafted in your tone and reviewed before sending.",
  ],
  "ai-email-marketing-assistant": [
    "A store drafts a promotion campaign with two subject lines to test.",
    "Campaign results are summarised in plain language with next steps.",
    "Segments are suggested from purchase history.",
  ],
  "ai-social-media-manager": [
    "A month of posts is drafted from a brand brief and approved in batches.",
    "One announcement becomes versions for Instagram, LinkedIn and X.",
    "Weekly performance summaries highlight what to post more of.",
  ],
  "ai-content-repurposing": [
    "A podcast episode becomes clips, a blog summary and a newsletter.",
    "A webinar recording becomes a series of LinkedIn posts.",
    "A long article becomes a carousel and a short video script.",
  ],
  "ai-seo-assistant": [
    "A clinic gets keyword clusters and briefs for service pages.",
    "Existing pages are audited for titles, descriptions and missing topics.",
    "Monthly content plans are drafted from search demand.",
  ],
  "ai-advertising-assistant": [
    "A store gets several ad concepts and copy variants to test.",
    "Campaign data is summarised with suggestions on budget shifts.",
    "New audience ideas are proposed from customer data.",
  ],
  "ai-conversion-rate-optimization": [
    "A store's checkout drop-off is analysed and test ideas are ranked.",
    "Landing pages get specific copy and layout suggestions.",
    "A testing roadmap is kept up to date as results come in.",
  ],
  "ai-review-reputation-assistant": [
    "A restaurant group gets weekly themes from hundreds of reviews.",
    "Reply drafts are prepared in the owner's tone for approval.",
    "Repeated complaints about one branch are flagged early.",
  ],
  "ai-sales-call-analyst": [
    "Sales managers see objections raised across all calls this week.",
    "Each call gets a summary and next steps sent to the CRM.",
    "New reps are coached using scores against your call rubric.",
  ],
  "ai-proposal-generator": [
    "An agency turns discovery-call notes into a proposal draft in minutes.",
    "Scope and timelines are built only from your approved service catalogue.",
    "Proposals stay consistent across the team.",
  ],
  "ai-competitor-research-assistant": [
    "A business compares competitors' public prices and offers each quarter.",
    "Positioning gaps are summarised for the marketing team.",
    "New competitor launches are noted for review.",
  ],
  "ai-customer-segmentation": [
    "A retailer groups customers into new, loyal and lapsing for different campaigns.",
    "High-value customers get early access offers.",
    "Segments update as people buy.",
  ],
  "ai-retention-assistant": [
    "A subscription business spots customers who stopped logging in.",
    "Account managers get suggested actions for each at-risk account.",
    "Cancellation reasons are summarised monthly.",
  ],
  "ai-market-research-assistant": [
    "Survey answers are grouped into themes with example quotes.",
    "Interview transcripts are compared to find common needs.",
    "Product teams get a summary before planning sessions.",
  ],
  "ai-website-chatbot": [
    "Visitors get instant answers about services and prices at any hour.",
    "The chatbot collects contact details and passes warm leads to WhatsApp.",
    "Unanswered questions show where the website needs better content.",
  ],
  "ai-website-builder": [
    "A new business gets a first website draft from a short brief.",
    "Sections and copy are adjusted by describing the change.",
    "Drafts are refined by our team before launch.",
  ],
  "ai-shopping-assistant": [
    "Shoppers ask which product suits them and get recommendations.",
    "Customers compare two products side by side.",
    "Gift buyers get suggestions by budget and recipient.",
  ],
  "ai-product-description-generator": [
    "A store with hundreds of products fills in missing descriptions consistently.",
    "Marketplace listings get channel-specific titles and bullets.",
    "New collections launch with copy ready on day one.",
  ],
  "ai-product-recommendation-engine": [
    "Product pages show items often bought together.",
    "Returning customers see picks based on past orders.",
    "Bundles are suggested to raise order value.",
  ],
  "ai-abandoned-cart-assistant": [
    "Abandoned carts get reminders on email or WhatsApp.",
    "High-value carts get a personal follow-up from staff.",
    "Discounts are offered only within rules you set.",
  ],
  "ai-pricing-assistant": [
    "A shop models how a price change affects profit.",
    "Margins are checked against supplier cost changes.",
    "Seasonal pricing ideas are suggested for review.",
  ],
  "ai-inventory-forecasting": [
    "A retailer gets reorder suggestions before peak season.",
    "Slow-moving stock is flagged for promotion.",
    "Purchasing plans are based on recent demand.",
  ],
  "ai-order-support-agent": [
    "Customers ask 'where is my order?' and get the live status.",
    "Return requests are started within your policy.",
    "Complex issues are handed to staff with the full context.",
  ],
  "ai-catalog-enrichment": [
    "Missing sizes, colours and materials are filled in from product data.",
    "Products are classified into the right categories.",
    "Duplicate variants are merged.",
  ],
  "ai-visual-search": [
    "Shoppers upload a photo to find similar items.",
    "A furniture store matches styles from inspiration pictures.",
    "A parts supplier helps buyers identify components from photos.",
  ],
  "ai-review-analyzer": [
    "Product teams see the most common complaints by product.",
    "Feature requests are collected from reviews.",
    "Praise is surfaced for marketing copy.",
  ],
  "ai-localization-assistant": [
    "A store launches in France with translated product pages.",
    "Prices, dates and units are adapted for each market.",
    "Marketing copy is adapted rather than literally translated.",
  ],
  "ai-fraud-detection": [
    "High-risk orders are held for review before shipping.",
    "Unusual refund patterns are flagged.",
    "Thresholds are tuned to reduce false alarms.",
  ],
  "ai-document-processor": [
    "Invoices are read and fields extracted for approval.",
    "Application forms are digitised and checked for missing data.",
    "Uncertain extractions go to a person for review.",
  ],
  "ai-invoice-assistant": [
    "Supplier invoices are matched to purchase orders.",
    "Discrepancies in amounts or tax are flagged.",
    "Entries are prepared for the accounting system.",
  ],
  "ai-bookkeeping-assistant": [
    "Bank transactions are categorised for review.",
    "Monthly variances are explained in plain language.",
    "Reconciliations are prepared for the accountant.",
  ],
  "ai-reporting-assistant": [
    "A manager gets a weekly summary of sales and key numbers.",
    "Questions about the data are answered in plain language.",
    "Board reports are drafted from dashboards.",
  ],
  "ai-spreadsheet-assistant": [
    "Messy exports are cleaned into usable tables.",
    "Formulas are written from a description.",
    "Anomalies in the data are explained.",
  ],
  "ai-meeting-assistant": [
    "Meetings are transcribed with decisions and action items.",
    "Follow-up emails are drafted for review.",
    "Teams search past meetings by topic.",
  ],
  "ai-recruitment-assistant": [
    "CVs are organised against the role's stated requirements.",
    "Interview slots are coordinated with candidates.",
    "Hiring managers get summaries of each shortlist.",
  ],
  "ai-hr-assistant": [
    "Staff ask policy questions and get answers with the source.",
    "New hires get guided through onboarding steps.",
    "Requests are routed to the right HR person.",
  ],
  "ai-procurement-assistant": [
    "Supplier quotes are compared side by side.",
    "Unusual terms or prices are flagged.",
    "Purchasing decisions are documented.",
  ],
  "ai-knowledge-base-assistant": [
    "Staff get answers from company documents with citations.",
    "Gaps in documentation are reported.",
    "Customers get answers from public help content.",
  ],
  "ai-project-management-assistant": [
    "Big projects are broken into tasks and milestones.",
    "Weekly status updates are drafted for clients.",
    "Deadline risks are flagged early.",
  ],
  "ai-quality-assurance-assistant": [
    "Content is checked against brand and legal rules before publishing.",
    "Forms and records are checked for missing or inconsistent data.",
    "Issues are logged for correction.",
  ],
  "ai-document-search-extraction": [
    "Legal teams find relevant clauses across many contracts.",
    "Researchers extract facts from large reports.",
    "Support teams search manuals for precise answers.",
  ],
  "ai-compliance-support": [
    "Evidence for audits is collected and organised.",
    "Policies are mapped to controls with gaps flagged.",
    "Experts review findings before submission.",
  ],
  "conversational-ai": [
    "An app adds natural-language search across its content.",
    "A website lets visitors ask questions instead of browsing menus.",
    "A product adds an in-app helper for new users.",
  ],
  "retrieval-augmented-generation": [
    "AI answers come from your own documents with sources shown.",
    "Policies and product records stay the single source of truth.",
    "Answers update when documents change.",
  ],
  "tool-using-ai-agents": [
    "An agent looks up orders and creates support tickets.",
    "An assistant schedules meetings through your calendar API.",
    "Actions are limited to what you authorise and logged.",
  ],
  "document-image-understanding": [
    "Scanned forms are read with OCR and classified.",
    "Product photos are tagged automatically.",
    "Tables in PDFs are extracted to spreadsheets.",
  ],
  "predictive-analytics": [
    "Sales forecasts help plan stock and staffing.",
    "Customers likely to churn are flagged.",
    "Unusual activity is detected for review.",
  ],
  "ai-governance-controls": [
    "Each AI feature has permissions, budgets and rate limits.",
    "Every AI action is logged for review.",
    "Sensitive actions require human approval.",
  ],

  // Automation & integrations
  "crm-automation": [
    "Leads from forms, WhatsApp and ads land in the CRM automatically.",
    "New leads are assigned and the owner is notified.",
    "Follow-up tasks are created after every enquiry.",
  ],
  "email-workflows": [
    "New subscribers get a welcome series.",
    "Customers get post-purchase tips and review requests.",
    "Inactive subscribers get a re-engagement sequence.",
  ],
  "lead-routing": [
    "Leads go to the salesperson covering their city.",
    "High-value enquiries go straight to a senior rep.",
    "Unassigned leads escalate after a set time.",
  ],
  "appointment-reminders": [
    "Patients get WhatsApp reminders the day before.",
    "Clients confirm or reschedule from the message.",
    "No-shows get a follow-up to rebook.",
  ],
  "payment-synchronization": [
    "Paystack payments mark invoices as paid automatically.",
    "Orders update when payment is confirmed.",
    "Accounting records stay in sync without manual entry.",
  ],
  "reporting-automation": [
    "A weekly sales report lands in the owner's inbox every Monday.",
    "Monthly client reports are generated and shared.",
    "Alerts fire when numbers cross thresholds.",
  ],
  "platform-integrations": [
    "The store, CRM and accounting system share the same customer data.",
    "Form submissions create records in Airtable or Sheets.",
    "Custom APIs connect older systems to new tools.",
  ],
  "whatsapp-automation": [
    "Customers get instant replies to common questions.",
    "Order and delivery updates are sent automatically.",
    "Broadcasts go to opted-in customers only.",
  ],

  // Mobile & desktop
  "native-mobile-app": [
    "A retailer launches an app with push notifications for offers.",
    "A service company's app uses the camera for job photos.",
    "Loyal customers reorder in a couple of taps.",
  ],
  "cross-platform-mobile-app": [
    "A gym launches iOS and Android apps from one codebase.",
    "A startup ships its MVP to both stores quickly.",
    "Offline storage keeps the app working on poor connections.",
  ],
  "progressive-web-app": [
    "A restaurant's ordering site installs on phones like an app.",
    "A field team uses a web app that still loads offline where implemented.",
    "A business avoids app-store fees for a simple app.",
  ],
  "desktop-application": [
    "An office team uses a desktop app that works with local files.",
    "A studio runs background processing on Windows and macOS.",
    "Notifications alert staff to new jobs.",
  ],
  "browser-extension": [
    "Sales reps save LinkedIn prospects to the CRM from the browser.",
    "Support agents see customer details while browsing tickets.",
    "Researchers clip pages into a shared library.",
  ],
  "internal-company-app": [
    "Staff enter data in one app instead of many spreadsheets.",
    "Managers see dashboards for their teams.",
    "Approval workflows replace email chains.",
  ],
  "field-service-app": [
    "Technicians see jobs, routes and checklists on their phones.",
    "Customers sign on the device when work is complete.",
    "Photos and notes sync when connection returns.",
  ],
  "delivery-app": [
    "Dispatchers assign orders to drivers.",
    "Customers track deliveries live.",
    "Drivers capture proof of delivery.",
  ],
  "on-demand-service-app": [
    "Customers book cleaners, mechanics or tutors nearby.",
    "Providers accept jobs and get paid through the app.",
    "Ratings help maintain service quality.",
  ],
  "messaging-app": [
    "A community gets private group chats with media sharing.",
    "A company runs secure internal messaging.",
    "Users control who can message them.",
  ],
  "financial-management-app": [
    "Users see accounts and spending by category.",
    "Budgets warn before overspending.",
    "Reports export for accountants.",
  ],
  "health-fitness-app": [
    "Members follow workout plans and log progress.",
    "Coaches see client progress charts.",
    "Reminders keep users on track with goals.",
  ],
  "travel-app": [
    "Travellers keep itineraries and bookings offline.",
    "Tour operators send trip updates to groups.",
    "Maps show meeting points and activities.",
  ],
  "iot-smart-device-app": [
    "Users pair devices and see live readings.",
    "Alerts fire when sensors cross limits.",
    "Devices are controlled remotely.",
  ],
  "ai-productivity-app": [
    "Teams chat with their documents and get summaries.",
    "Users automate repetitive tasks with prompts.",
    "Usage limits keep AI costs predictable.",
  ],
};

/** Industry-specific problems, before/after and use cases (replaces the shared generic text). */
export const INDUSTRY_DETAIL: Record<string, { problems: string[]; before: string; after: string; useCases: string[] }> = {
  "music-entertainment": {
    problems: ["Bookings, sessions and releases tracked across chats and notebooks", "Royalties and splits are hard to reconcile", "Fans and promoters reach you through too many channels"],
    before: "Studio time booked by DM, release plans in a notebook, royalty splits in a spreadsheet nobody trusts.",
    after: "One calendar for sessions, a release plan with owners and dates, and splits recorded for every track.",
    useCases: ["A studio takes session bookings with deposits online.", "A manager plans a release with tasks for artist, label and designer.", "A promoter sells event tickets and checks guests in at the door."],
  },
  "photography-video": {
    problems: ["Clients wait too long for galleries and proofs", "Contracts and deposits chased by message", "Edit status unclear to clients"],
    before: "Galleries sent by file-transfer link, proofing by email, deposits chased on WhatsApp.",
    after: "Branded client galleries with favourites, signed contracts and an edit tracker clients can check.",
    useCases: ["A wedding photographer delivers proofs and lets the couple pick favourites.", "A video studio books shoots with a contract and deposit.", "Clients check where their edit is without messaging."],
  },
  "real-estate": {
    problems: ["Enquiries lost between portals, WhatsApp and calls", "Viewings double-booked or forgotten", "Landlords chase rent and repairs manually"],
    before: "Listings on several portals, enquiries in agents' personal phones, viewings in a paper diary.",
    after: "Listings and enquiries in one CRM, viewings booked online, tenants reporting repairs in a portal.",
    useCases: ["An agency routes enquiries to the agent covering each area.", "Buyers book viewings from the listing page.", "A property manager tracks rent and maintenance per unit."],
  },
  healthcare: {
    problems: ["Phone lines busy with booking calls", "No-shows waste appointment slots", "Patient records scattered across systems"],
    before: "Bookings by phone, reminders not sent, patient forms on paper.",
    after: "Online booking with reminders, digital intake forms and records available to the right staff.",
    useCases: ["A clinic lets patients book and fill intake forms before arriving.", "A pharmacy sends refill reminders.", "A practice answers routine questions with an assistant that never gives medical advice."],
  },
  legal: {
    problems: ["Deadlines tracked in personal calendars", "Client intake repeated by phone and email", "Billable time missed"],
    before: "Matters in folders, deadlines in diaries, time noted at the end of the week.",
    after: "Matter management with deadline alerts, online intake and time recorded as work happens.",
    useCases: ["A firm collects new-client information and conflict-check details online.", "Associates get alerts before filing deadlines.", "Partners search past documents for relevant clauses."],
  },
  restaurants: {
    problems: ["Reservations and orders arrive in too many places", "Kitchen misreads handwritten tickets", "Stock runs out without warning"],
    before: "Orders on WhatsApp, Instagram and the phone, reservations in a book, stock counted by eye.",
    after: "One order queue for the kitchen, online reservations and ingredient stock alerts.",
    useCases: ["A restaurant takes table bookings online with reminders.", "A cloud kitchen receives delivery orders on a kitchen screen.", "The manager is warned before key ingredients run low."],
  },
  hospitality: {
    problems: ["Overbookings across booking sites", "Guest questions answered late", "Housekeeping status unclear"],
    before: "Rooms tracked across OTAs and a spreadsheet, guest messages on staff phones.",
    after: "Direct bookings and availability in one system, instant guest replies and a housekeeping board.",
    useCases: ["A guesthouse takes direct bookings with deposits.", "Guests get check-in details and answers automatically.", "Housekeeping marks rooms ready from a phone."],
  },
  logistics: {
    problems: ["Customers keep calling for status updates", "Proof of delivery is paper-based", "Fleet maintenance missed"],
    before: "Dispatch by phone, delivery notes on paper, vehicle service dates in a notebook.",
    after: "Live tracking for customers, digital proof of delivery and maintenance reminders.",
    useCases: ["A courier gives customers a tracking link for every parcel.", "Drivers capture signatures and photos on delivery.", "Fleet managers get service reminders per vehicle."],
  },
  construction: {
    problems: ["Estimates take days to prepare", "Site progress unclear to clients", "Change orders disputed later"],
    before: "Estimates in spreadsheets, site updates by phone, changes agreed verbally.",
    after: "Faster estimates from templates, site reports with photos and signed change orders.",
    useCases: ["A contractor prepares estimates from standard rates.", "Site managers post daily reports with photos.", "Clients approve change orders before work starts."],
  },
  manufacturing: {
    problems: ["Production plans out of step with materials", "Quality issues found too late", "Unplanned machine downtime"],
    before: "Work orders on paper, quality checks in a binder, maintenance done when something breaks.",
    after: "Digital work orders linked to stock, quality checks logged on tablets and planned maintenance.",
    useCases: ["A factory schedules production against materials in stock.", "Inspectors log defects with photos.", "Maintenance is scheduled from machine hours."],
  },
  fitness: {
    problems: ["Classes over- or under-booked", "Members lapse without anyone noticing", "Payments chased manually"],
    before: "Class lists on paper, memberships tracked in a spreadsheet, renewals chased by message.",
    after: "Online class booking, automatic recurring billing and alerts when members stop attending.",
    useCases: ["A gym lets members book classes from their phones.", "Trainers assign workout plans and track progress.", "Members who haven't visited in two weeks get a check-in message."],
  },
  "beauty-salons": {
    problems: ["Booking requests buried in DMs", "No-shows on long appointments", "Stylist commissions calculated by hand"],
    before: "Bookings by DM, no deposits, commissions worked out at month end.",
    after: "Online booking by stylist with deposits, reminders and automatic commission reports.",
    useCases: ["A salon takes deposits for braids and long colour appointments.", "Clients get rebooking reminders after six weeks.", "The owner sees each stylist's bookings and commission."],
  },
  travel: {
    problems: ["Itineraries rebuilt for every enquiry", "Travellers message for the same details", "Supplier bookings tracked manually"],
    before: "Itineraries in Word documents, supplier confirmations in email threads.",
    after: "Itinerary builder from templates, traveller app with offline details and supplier tracking.",
    useCases: ["A tour operator builds itineraries from reusable days.", "Travellers see bookings and maps offline.", "Staff track supplier confirmations for every trip."],
  },
  recruitment: {
    problems: ["CVs scattered across inboxes", "Interview scheduling takes days", "Clients ask for updates constantly"],
    before: "CVs in email folders, interviews arranged by long email threads.",
    after: "Applicant tracking with stages, self-booked interviews and client shortlists online.",
    useCases: ["An agency publishes jobs and collects applications in one place.", "Candidates book interview slots themselves.", "Clients review shortlists and leave feedback."],
  },
  nonprofits: {
    problems: ["Donor records incomplete", "Volunteers coordinated by message", "Impact reporting takes weeks"],
    before: "Donors in spreadsheets, volunteer rotas on WhatsApp, reports compiled by hand.",
    after: "Donor CRM with recurring giving, volunteer sign-ups and impact dashboards.",
    useCases: ["A charity takes recurring donations online.", "Volunteers sign up for shifts.", "Funders get impact reports from live data."],
  },
  education: {
    problems: ["Admissions handled on paper", "Parents lack visibility on attendance and grades", "Timetabling done manually"],
    before: "Paper admission forms, report cards printed termly, attendance in registers.",
    after: "Online admissions, parent portal with attendance and grades, and digital timetables.",
    useCases: ["A school takes admissions and documents online.", "Parents check attendance and results.", "Teachers create quizzes and track progress."],
  },
  agriculture: {
    problems: ["Farm records kept in notebooks", "Input costs hard to track", "Harvest forecasts are guesswork"],
    before: "Crop and input records on paper, stock counted by hand.",
    after: "Digital farm records, input and equipment tracking and harvest dashboards.",
    useCases: ["A cooperative records members' deliveries.", "A farm tracks fertiliser and seed use per field.", "Managers see expected harvest by crop."],
  },
  automotive: {
    problems: ["Service bookings by phone only", "Parts stock unknown", "Customers forget maintenance"],
    before: "Paper job cards, parts counted by eye, no reminders.",
    after: "Online service booking, digital job cards, parts inventory and maintenance reminders.",
    useCases: ["A garage takes service bookings online.", "Mechanics update job status for customers.", "Customers get reminders when service is due."],
  },
  insurance: {
    problems: ["Quotes take too long", "Claims documents arrive incomplete", "Renewals missed"],
    before: "Quotes by phone, claim documents by email, renewals tracked in spreadsheets.",
    after: "Online quotes, guided claim forms with document checks and renewal reminders.",
    useCases: ["A broker gives instant indicative quotes online.", "Claimants upload documents with checks for missing items.", "Agents get renewal lists each month."],
  },
  "financial-services": {
    problems: ["Client onboarding paperwork is slow", "Reports compiled manually", "Compliance evidence scattered"],
    before: "Onboarding by paper forms, reports built in spreadsheets, evidence in email folders.",
    after: "Digital onboarding with document checks, automated reports and organised compliance records.",
    useCases: ["An adviser onboards clients with online forms and uploads.", "A lender processes applications with document extraction.", "Compliance teams find evidence quickly for reviews."],
  },
};
