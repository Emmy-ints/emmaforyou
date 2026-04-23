export interface EmailItem {
  day: number;
  subject: string;
  preview: string;
  body: string;
}

export type SequenceTemplate = (vars: { businessName: string; ownerName: string }) => EmailItem[];

export const SEQUENCES: Record<string, SequenceTemplate> = {
  "welcome-restaurant": ({ businessName, ownerName }) => [
    { day: 0, subject: `Welcome! Here's your exclusive first-visit offer 🍽️`, preview: "We've been waiting for you...",
      body: `Hi friend,\n\nWelcome to ${businessName}! I'm ${ownerName}, and I personally wanted to thank you for joining our list.\n\nAs a welcome gift, here's 15% off your first visit. Just show this email at the table and we'll take care of the rest.\n\nCan't wait to host you,\n${ownerName}\n${businessName}` },
    { day: 2, subject: "Our most popular dish — here's how we make it", preview: `Behind the scenes at ${businessName}...`,
      body: `Hi friend,\n\nEvery week regulars come back for one specific dish. Today I want to tell you why.\n\nIt started 3 years ago when our chef tried something new... [story]\n\nReserve a table → ${businessName}.com/book` },
    { day: 5, subject: "Are you free this weekend?", preview: "We have something special planned...", body: "Weekend special menu drops Friday. Limited tables. Book now." },
    { day: 8, subject: "Real talk — here's what our regulars know", preview: "The insider menu items worth ordering...", body: "Our top 5 hidden menu items — most customers don't know about these." },
    { day: 12, subject: "This offer expires in 48 hours ⏰", preview: "Last chance for your welcome discount...", body: "Final reminder — your 15% welcome discount expires Sunday at midnight." },
  ],
  "welcome-fashion": ({ businessName, ownerName }) => [
    { day: 0, subject: `Welcome to ${businessName} — here's 20% off your first order ✨`, preview: "Style starts here.", body: `Hi gorgeous,\n\nWelcome to the ${businessName} family! Use code WELCOME20 at checkout for 20% off your first order. Free shipping on orders over $50.\n\n${ownerName}` },
    { day: 2, subject: "The 3 outfits everyone's reordering", preview: "Our top sellers this month...", body: "Here are the 3 pieces our customers can't stop ordering." },
    { day: 5, subject: "Style guide: how to wear our newest drop", preview: "5 ways to style our viral piece...", body: "Style inspiration from our community." },
    { day: 8, subject: "Real customer reviews you need to see", preview: "Honest words from real shoppers...", body: "Don't take our word for it — here's what our customers are saying." },
    { day: 12, subject: "Last chance: WELCOME20 expires tonight ⏰", preview: "Your discount disappears at midnight...", body: "Final reminder — code WELCOME20 expires tonight." },
  ],
  "welcome-clinic": ({ businessName, ownerName }) => [
    { day: 0, subject: `Welcome to ${businessName} — your wellness journey starts here`, preview: "We're glad you're here.", body: `Hi,\n\nWelcome to ${businessName}. ${ownerName} and our team are committed to your wellbeing.\n\nFirst-visit benefit: book within 14 days and save 15%.\n\nWarmly,\n${ownerName}` },
    { day: 2, subject: "Meet your care team", preview: "The people behind your care...", body: "Quick intros to your future care team." },
    { day: 5, subject: "5 questions to ask before your first visit", preview: "Get the most out of your appointment...", body: "Tips for a great first appointment." },
    { day: 8, subject: "What our patients say", preview: "Real stories of recovery...", body: "Patient testimonials." },
    { day: 12, subject: "Last reminder: book your first visit", preview: "Your welcome offer expires soon...", body: "Final reminder for your 15% welcome offer." },
  ],
  "welcome-coach": ({ businessName, ownerName }) => [
    { day: 0, subject: "Welcome — let's get you results", preview: `From ${ownerName}, your coach.`, body: `Hi friend,\n\nWelcome to ${businessName}! Over the next 12 days, I'll share my 5 most effective insights with you.\n\nLet's go.\n${ownerName}` },
    { day: 2, subject: "The mistake 90% of [audience] make", preview: "Most of my clients make this exact mistake...", body: "Here's the #1 mistake I see and how to avoid it." },
    { day: 5, subject: "My personal framework, free", preview: "The exact 4-step process I use...", body: "Download my framework PDF inside." },
    { day: 8, subject: "Real client transformation 👀", preview: "From X to Y in 90 days...", body: "Case study of a real client transformation." },
    { day: 12, subject: "Want to work together?", preview: "Limited spots open this month...", body: "If you're ready to take this further, I have 3 spots open." },
  ],
  "abandoned-cart": ({ businessName }) => [
    { day: 0, subject: "You left something behind 👀", preview: "Your cart is waiting...", body: `Hey,\n\nYou added some items to your cart at ${businessName} but didn't check out. Want us to hold them for you?` },
    { day: 1, subject: "Still thinking it over?", preview: "Here's 10% off to help you decide...", body: "Use code COMEBACK10 at checkout." },
    { day: 2, subject: "Almost gone ⏰", preview: "Items in your cart are running low...", body: "Stock is limited — grab yours before it's gone." },
    { day: 4, subject: "Last chance — your cart expires tomorrow", preview: "We'll release your items soon...", body: "Final 24 hours to complete your order." },
    { day: 7, subject: "Would you tell us why?", preview: "Quick 1-question survey", body: "We'd love to know what stopped you from completing your order." },
  ],
  "re-engage": ({ businessName }) => [
    { day: 0, subject: "Long time no see 👋", preview: `Things have changed at ${businessName}...`, body: "Catch up on what you've missed." },
    { day: 3, subject: "Here's what's new", preview: "Big updates since we last spoke...", body: "Three new things you'll love." },
    { day: 6, subject: "A gift for coming back", preview: "10% off, just for you...", body: "Use code WELCOMEBACK10." },
    { day: 10, subject: "Are you still interested?", preview: "We don't want to bother you...", body: "Click yes to stay subscribed, no to unsubscribe gracefully." },
    { day: 14, subject: "Last email — let's keep in touch?", preview: "We'll remove you tomorrow if no reply...", body: "Final farewell email if no engagement." },
  ],
  "product-launch": ({ businessName }) => [
    { day: 0, subject: "Coming soon: something we've been working on for months", preview: "An early peek for our list...", body: `${businessName} has a launch coming. Here's the first peek.` },
    { day: 2, subject: "Behind the scenes of our launch", preview: "How it came together...", body: "The story behind it." },
    { day: 5, subject: "Launching tomorrow at 9am", preview: "Set your alarm 🚨", body: "Final reminder before launch." },
    { day: 6, subject: "🚀 IT'S LIVE", preview: "Doors are open. Limited spots.", body: "Doors are open." },
    { day: 9, subject: "Closing in 24 hours", preview: "Last call before doors shut...", body: "Final 24 hours." },
  ],
};

export const GOAL_TO_SEQ: Record<string, Record<string, string>> = {
  Welcome: { Restaurant: "welcome-restaurant", Fashion: "welcome-fashion", Clinic: "welcome-clinic", Coach: "welcome-coach" },
  "Abandoned cart": { Ecommerce: "abandoned-cart", Fashion: "abandoned-cart" },
  "Re-engage cold leads": { default: "re-engage" },
  "Launch product/service": { default: "product-launch" },
};

export function pickSequence(goal: string, biz: string): string {
  const map = GOAL_TO_SEQ[goal] || GOAL_TO_SEQ["Welcome"];
  return map[biz] || map["default"] || "welcome-coach";
}