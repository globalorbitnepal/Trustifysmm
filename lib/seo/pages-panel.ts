import type { SeoLanding } from "@/lib/seo/landing-types";

/**
 * Panel-level landing pages. Each one targets a different search intent:
 * research, comparison, budget, reseller, API, agency and bulk buying.
 */
export const PANEL_PAGES: SeoLanding[] = [
  {
    slug: "smm-panel",
    family: "panel",
    metaTitle: "SMM Panel for Social Media Marketing | TrustifySMM",
    metaDescription:
      "Use the TrustifySMM SMM panel to order Instagram, TikTok, YouTube, Facebook and Telegram services from one wallet, with live per-1K rates and instant delivery.",
    h1: "An SMM panel built for",
    h1Accent: "daily order volume",
    breadcrumbLabel: "SMM Panel",
    keywords: ["smm panel", "social media marketing panel", "smm services panel"],
    intro: [
      "An SMM panel is a single ordering desk for social media services. Instead of signing up with a different supplier for every network, you fund one wallet, open one catalog and place orders across Instagram, TikTok, YouTube, Facebook, Telegram and the rest of the platforms TrustifySMM supports.",
      "TrustifySMM is built around repeat ordering. The catalog shows the real rate per 1,000 units, the minimum and maximum quantity a provider will accept, and the delivery window before you commit. After an order is placed you can follow its status in the dashboard and open a ticket with the order ID if a delivery needs checking.",
    ],
    sections: [
      {
        heading: "What you can order from one dashboard",
        paragraphs: [
          "Services are grouped by platform and by outcome. On Instagram that means followers, likes, views, Reels views and comments. On YouTube it covers subscribers, views, likes and watch hours. Facebook includes page followers, post reactions and video views, while TikTok covers followers, likes, views and shares.",
          "Smaller catalogs are included where providers genuinely supply them: Telegram members and post views, X followers and likes, Spotify plays and followers, LinkedIn followers and connections, Twitch followers and views, plus Snapchat, Threads, Pinterest and WhatsApp where available. If a service is not in the catalog it is not currently supplied — the panel does not list placeholder services.",
        ],
      },
      {
        heading: "How pricing and quantities work",
        paragraphs: [
          "Every service is priced per 1,000 units. A rate of $1.25 per 1,000 means 1,000 followers cost $1.25 and 10,000 cost $12.50. The catalog also prints the minimum and maximum order size, because some providers start at 50 units while others require 500 or more.",
          "Different services on the same platform can be ten times apart in price. That gap usually reflects speed, drop protection and the quality of the accounts delivering the engagement, not a markup trick. Read the service description on the card — it states the start time, the daily speed and whether a refill is offered.",
        ],
      },
      {
        heading: "Wallet, deposits and API",
        paragraphs: [
          "The wallet holds a USD balance. You top it up with a supported cryptocurrency through the automated checkout, and the balance is credited after the network confirms the deposit. Orders are deducted from that same balance, so there is no per-order payment step once you are funded.",
          "For teams that place orders programmatically, the panel exposes a REST API for balance checks, service lists, order creation and status polling. Keys are generated inside the dashboard and can be rotated, so a leaked key can be replaced without changing your account.",
        ],
      },
      {
        heading: "Support and order visibility",
        paragraphs: [
          "Each order has a status that moves from pending through processing to completed. If a service stalls, partial delivery is visible on the order. You can open a support ticket with the order ID attached so the team can check the provider without asking you to repeat the details.",
          "The public catalog — rates, minimums, delivery windows — is readable before you create an account. You can compare services and plan a resale price before committing any money to a wallet.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "TikTok likes", groupMatch: ["TikTok Likes"] },
      { label: "YouTube views", groupMatch: ["YouTube Views"] },
      { label: "Facebook views", groupMatch: ["Facebook Views"] },
      { label: "Telegram post views", groupMatch: ["Telegram Views"] },
    ],
    howItWorks: [
      { title: "Create a free account", text: "Sign up with an email address. No card is required to open the panel." },
      { title: "Fund the wallet", text: "Deposit with a supported cryptocurrency; the balance appears once the network confirms." },
      { title: "Pick a service", text: "Filter by platform, compare the per-1K rate, minimum quantity and delivery window." },
      { title: "Submit the order", text: "Paste the public link and quantity. The order status is tracked from your dashboard." },
    ],
    delivery: [
      "Delivery windows are printed on each service card, from near-instant starts to multi-day drip feeds.",
      "Refill is available only on services that state it; the card is the source of truth.",
      "Partial delivery is shown on the order instead of being hidden behind a single status label.",
    ],
    ordering: [
      "Open Services or the New Order form in the dashboard.",
      "Choose the platform tab, then the service, then enter the target URL and quantity.",
      "Confirm the charge shown against the wallet balance and submit.",
    ],
    faq: [
      {
        q: "Do I need to create an account before seeing prices?",
        a: "No. The public Services and Pricing pages list the live rate per 1,000 units, minimum and maximum order sizes and delivery estimates. An account is only needed to place an order.",
      },
      {
        q: "Which platforms are supported?",
        a: "Instagram, TikTok, YouTube, Facebook, Telegram, X, Spotify, LinkedIn, Twitch, Snapchat, Threads, Pinterest and WhatsApp appear in the catalog where services are supplied. Anything not listed is not currently offered.",
      },
      {
        q: "How is the wallet funded?",
        a: "Through the automated crypto checkout. The balance is credited once the transaction is confirmed on the network and picked up by the payment reconciler.",
      },
      {
        q: "Is there an API for automated ordering?",
        a: "Yes. API keys are created in the dashboard and support balance lookup, service listing, order placement and status polling.",
      },
      {
        q: "Can I resell these services?",
        a: "Yes. Many customers set their own price for their clients. The panel charges the catalog rate; the markup you apply is your decision.",
      },
    ],
    related: ["best-smm-panel", "cheap-smm-panel", "smm-panel-api", "smm-panel-reseller", "buy-social-media-services"],
    image: { src: "/brand/glass/glass-instagram.png", alt: "Instagram service icon in the TrustifySMM social media panel catalog" },
    ctaTitle: "Open the panel and check today's rates",
    ctaText: "Browse the full catalog with per-1K pricing, then fund a wallet when you are ready to order.",
  },
  {
    slug: "best-smm-panel",
    family: "panel",
    metaTitle: "Best SMM Panel for Resellers & Agencies | TrustifySMM",
    metaDescription:
      "What separates a reliable SMM panel from a cheap one: transparent per-1K pricing, visible delivery windows, accurate order status and support that answers with order IDs.",
    h1: "Choosing the best SMM panel",
    h1Accent: "without guesswork",
    breadcrumbLabel: "Best SMM Panel",
    keywords: ["best smm panel", "best smm panel for resellers", "reliable smm panel"],
    intro: [
      "Searching for the best SMM panel returns hundreds of near-identical lists, most of which rank suppliers by how much they pay for the placement. The judgement that actually matters is narrower: can you see the real price per 1,000 units, does the delivery window match the claim, and does the order status tell you the truth when something goes wrong?",
      "This page explains the criteria TrustifySMM is built against, so you can evaluate it against any other panel using the same checklist rather than a marketing slogan.",
    ],
    sections: [
      {
        heading: "Criterion one: published rates, not teaser prices",
        paragraphs: [
          "A panel that advertises \"followers from $0.01\" is usually quoting the cheapest, slowest service in a very large catalog and hoping you do not compare. TrustifySMM shows the full range on the pricing page: the lowest and highest rate for each service group, plus how many services sit in that group.",
          "That visibility matters because resale margins depend on it. If you sell 1,000 followers to a client at $6, you need to know whether your cost is $0.44 or $4.40. Both can be profitable, but only one supports a fast turnaround.",
        ],
      },
      {
        heading: "Criterion two: honest delivery windows",
        paragraphs: [
          "Start time and speed are the two numbers that decide whether a client complains. A service that starts in 30 minutes and runs 10,000 per day behaves very differently from one that starts in six hours and drips 500 per day, even when both eventually deliver the same total.",
          "TrustifySMM prints the delivery line on each service card, sourced from the provider's own specification. Where a service offers a refill, the card says so; where it does not, the page does not imply protection that is not there.",
        ],
      },
      {
        heading: "Criterion three: status you can act on",
        paragraphs: [
          "Orders move through pending, in progress, completed, partial and cancelled. A panel that shows only \"processing\" forever gives support nothing to work with. With a real status you can tell a client what is happening and open a ticket that references a specific order ID.",
          "The dashboard also keeps order history, so a dispute from three weeks ago can still be looked up without digging through email.",
        ],
      },
      {
        heading: "Criterion four: a wallet and an API, not ad-hoc invoices",
        paragraphs: [
          "Repeat buyers should not be paying per order. A single USD wallet funded in advance, with the API available for automation, is what turns a panel into a supplier relationship. TrustifySMM supports both: manual ordering from the dashboard and programmatic ordering through REST endpoints.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "Facebook followers", groupMatch: ["Facebook Followers"] },
      { label: "YouTube subscribers", groupMatch: ["YouTube Subscribers"] },
      { label: "TikTok followers", groupMatch: ["TikTok Followers"] },
      { label: "Spotify plays", groupMatch: ["Spotify Plays"] },
    ],
    howItWorks: [
      { title: "Compare the range", text: "Look at the lowest and highest rate for the service you intend to resell." },
      { title: "Check the delivery line", text: "Confirm start time and daily speed against what you promise clients." },
      { title: "Test with a small order", text: "Run a minimum-size order before committing a large campaign." },
      { title: "Scale on the same service ID", text: "Keep the service ID stable so reporting stays comparable over time." },
    ],
    delivery: [
      "Speed is quoted per day on the service card, not as an average across the catalog.",
      "Refill coverage differs per service and is never assumed.",
      "Large orders can be split across several service IDs when one provider has a ceiling.",
    ],
    ordering: [
      "Open Services and filter to the platform you need.",
      "Compare two or three services in the same group before choosing.",
      "Place a minimum-size test order, then scale once delivery is confirmed.",
    ],
    faq: [
      {
        q: "Is the cheapest SMM panel always the worst choice?",
        a: "Not automatically, but the cheapest tier usually has the slowest start or no refill. Compare the full service line — start time, speed, refill — before treating a low rate as a bargain.",
      },
      {
        q: "How do I test a panel safely?",
        a: "Place a minimum-quantity order on a public profile you control. Confirm the start time and the delivered count before moving a client campaign onto the same service.",
      },
      {
        q: "Do you guarantee a specific ranking or follower count?",
        a: "No. TrustifySMM delivers the ordered quantity of the selected service. It does not guarantee algorithmic ranking, monetisation or organic growth, and any panel that does should be treated with suspicion.",
      },
      {
        q: "Can I see the catalog without depositing?",
        a: "Yes. Rates, minimums and delivery windows are public. A deposit is only needed to place an order.",
      },
    ],
    related: ["smm-panel", "cheap-smm-panel", "smm-panel-provider", "smm-panel-reseller", "smm-panel-for-agencies"],
    image: { src: "/brand/glass/glass-youtube.png", alt: "YouTube service icon representing delivery comparison across SMM panels" },
    ctaTitle: "Compare the catalog on real numbers",
    ctaText: "Rates, minimums and delivery windows are public — check them before you deposit.",
  },
  {
    slug: "cheap-smm-panel",
    family: "panel",
    metaTitle: "Cheap SMM Panel with Transparent Per-1K Rates | TrustifySMM",
    metaDescription:
      "Compare low-cost SMM services by real per-1K rate, minimum order and delivery speed. Understand why the cheapest tier is not always the best value per order.",
    h1: "A cheap SMM panel priced",
    h1Accent: "in the open",
    breadcrumbLabel: "Cheap SMM Panel",
    keywords: ["cheap smm panel", "affordable smm services", "low cost smm panel"],
    intro: [
      "Budget matters when you are reselling. A panel that hides its rate card forces you to deposit before you can compare, which is the opposite of a competitive market. TrustifySMM publishes the per-1,000 rate for every service in the catalog, including the low-cost tiers.",
      "This page explains what low price does and does not tell you, so you can pick the cheapest service that still meets the promise you made to a client.",
    ],
    sections: [
      {
        heading: "What a low per-1K rate actually means",
        paragraphs: [
          "Every service is priced per 1,000 units, so a $0.09 rate means 1,000 likes cost nine cents. At that level the provider is usually running a large, automated pool with a long start window and no refill. That is fine for a test post or a volume campaign where the outcome is cosmetic.",
          "The same platform will also carry a $2.07 service. That one typically starts faster, drops less and may include a refill window. Paying more per unit is a decision about reliability, not about being overcharged.",
        ],
      },
      {
        heading: "Where cheap is genuinely the right call",
        paragraphs: [
          "Volume metrics are the clearest case. Post views, impressions and reach counters move quickly and clients rarely audit them individually, so the cheapest working service is often the sensible purchase. Test one minimum-size order first and confirm the counter actually moves.",
          "For follower services attached to a client's brand account, the calculation changes. A slow, drop-prone service can cost more in support time than the rate difference saves.",
        ],
      },
      {
        heading: "Reading the minimum order before you commit",
        paragraphs: [
          "A low rate paired with a 1,000-unit minimum is not cheap if you only needed 100 units. The catalog prints both numbers side by side, so compare the total for the quantity you actually want rather than the headline rate.",
          "Some providers also cap the maximum below what you need, which forces a split across two service IDs. Both lines are visible before checkout.",
        ],
      },
      {
        heading: "Keeping costs down without cutting quality",
        paragraphs: [
          "Fund the wallet once rather than paying per order, keep popular services bookmarked in Favorites, and standardise on one service ID per outcome so reporting stays consistent. Those three habits remove most of the friction that makes budget panel work feel expensive.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "Instagram views", groupMatch: ["Instagram Views"] },
      { label: "TikTok likes", groupMatch: ["TikTok Likes"] },
      { label: "TikTok views", groupMatch: ["TikTok Views"] },
      { label: "Telegram post views", groupMatch: ["Telegram Views"] },
      { label: "Facebook views", groupMatch: ["Facebook Views"] },
    ],
    howItWorks: [
      { title: "Sort by your real quantity", text: "Compare totals at the quantity you need, not the per-1K headline." },
      { title: "Check the minimum", text: "A cheap service with a high minimum may cost more than a mid-tier one." },
      { title: "Confirm the counter moves", text: "Run a minimum order and verify delivery before scaling." },
      { title: "Bookmark the winner", text: "Save the service in Favorites so repeat orders use the same ID." },
    ],
    delivery: [
      "Low-cost services usually have the longest start windows — check the card before promising same-hour delivery.",
      "Refill is rarely included in the cheapest tier; the card states it explicitly.",
      "Volume counters such as views can be delivered far faster than follower counts at the same price level.",
    ],
    ordering: [
      "Open Pricing and compare the low and high rate for the group you need.",
      "Check that the minimum order fits the quantity you actually want.",
      "Place a small order, confirm delivery, then scale on the same service.",
    ],
    faq: [
      {
        q: "How cheap are the lowest services?",
        a: "The pricing page shows the current lowest and highest rate per service group, drawn from the live catalog. Rates change when providers update their lists, so the page is always the current figure.",
      },
      {
        q: "Are cheap services lower quality?",
        a: "Usually they are slower and drop more, which is why they cost less. Quality per unit is stated on the service card as speed and refill coverage.",
      },
      {
        q: "Is there a minimum deposit?",
        a: "The wallet is funded through the crypto checkout. Small test deposits are fine — start with an amount that covers one or two minimum-size orders.",
      },
      {
        q: "Do cheap orders still show a real status?",
        a: "Yes. Every order, regardless of tier, moves through the same status pipeline and appears in order history.",
      },
    ],
    related: ["smm-panel", "best-smm-panel", "bulk-social-media-services", "buy-social-media-services", "smm-panel-provider"],
    image: { src: "/brand/glass/glass-tiktok.png", alt: "TikTok service icon illustrating low-cost engagement tiers" },
    ctaTitle: "See the low end of the rate card",
    ctaText: "Every group shows its cheapest and most expensive service, with minimums beside each.",
  },
  {
    slug: "smm-panel-provider",
    family: "panel",
    metaTitle: "SMM Panel Provider with a Live Catalog | TrustifySMM",
    metaDescription:
      "TrustifySMM is a social media service provider for resellers and agencies: a live multi-platform catalog, one USD wallet, REST API access and order-level support.",
    h1: "Inside the TrustifySMM",
    h1Accent: "provider desk",
    breadcrumbLabel: "SMM Panel Provider",
    keywords: ["smm panel provider", "social media service provider", "smm provider"],
    intro: [
      "A provider is the layer that actually sources the delivery. Panels differ mainly in how honestly they describe that layer: which platforms are really covered, what the speed and refill terms are, and what happens when an order does not finish.",
      "This page documents how TrustifySMM sources and presents services, so you can decide whether the operating model fits your own business.",
    ],
    sections: [
      {
        heading: "How the catalog is sourced",
        paragraphs: [
          "Service definitions — name, platform, group, rate, minimum, maximum and delivery estimate — are synchronised from the upstream supplier and published on the public catalog. Prices you see are the rates the panel charges, not a marketing placeholder.",
          "Platform groups are normalised so the same outcome appears consistently: Instagram Followers, Instagram Likes, Instagram Views and so on. That normalisation is what makes search, filtering and comparison possible across a catalog of roughly 1,900 services.",
        ],
      },
      {
        heading: "What is deliberately not offered",
        paragraphs: [
          "If a platform has no live services, it does not appear with a fake list. Services that cannot be delivered reliably are removed rather than kept to pad the category count. This is why the catalog changes over time: it reflects current supply, not a fixed menu.",
          "The provider desk also does not sell guarantees. No panel can guarantee algorithmic promotion, monetisation approval or a specific follower count after delivery. Any provider making those claims is describing something it cannot control.",
        ],
      },
      {
        heading: "Order lifecycle from the provider side",
        paragraphs: [
          "When you submit an order it is dispatched to the matching upstream service. The panel polls for status and writes the result back to your order. That is why the dashboard can show pending, in progress, completed, partial or cancelled instead of a single static label.",
          "If an order stalls, the order ID is the key. Support uses it to query the provider and, where the service allows, cancel and refund back to the wallet.",
        ],
      },
      {
        heading: "Working with a provider as a reseller",
        paragraphs: [
          "Resellers buy at catalog rates and sell at their own price. Nothing in the panel restricts that. What the panel does enforce is one balance and one ledger, so your cost per order is always traceable in Transactions.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Facebook followers", groupMatch: ["Facebook Followers"] },
      { label: "Telegram members", groupMatch: ["Telegram Members"] },
      { label: "X followers", groupMatch: ["X (Twitter) Followers"] },
      { label: "LinkedIn followers", groupMatch: ["LinkedIn Followers"] },
      { label: "Twitch followers", groupMatch: ["Twitch Followers", "Twitch"] },
    ],
    howItWorks: [
      { title: "Catalog sync", text: "Service definitions are refreshed from the live supplier list." },
      { title: "Order dispatch", text: "Your order is routed to the matching upstream service automatically." },
      { title: "Status polling", text: "The panel checks the provider and updates your order status." },
      { title: "Resolution", text: "Stalled orders are handled by ticket using the order ID." },
    ],
    delivery: [
      "Delivery estimates come from the upstream service, not from a blanket promise.",
      "Services are removed when they stop delivering instead of being left in the catalog.",
      "Partial delivery is reported as partial, not rounded up to completed.",
    ],
    ordering: [
      "Confirm the platform and outcome you need in the catalog.",
      "Check that the service's maximum covers your quantity.",
      "Submit and track the order; open a ticket with the ID if it stalls.",
    ],
    faq: [
      {
        q: "Is TrustifySMM the actual delivery source?",
        a: "TrustifySMM is the panel you buy from. Delivery is fulfilled through upstream service providers, and the catalog reflects what those providers currently supply.",
      },
      {
        q: "Why do services disappear from the catalog?",
        a: "Because they stopped being supplied or stopped delivering reliably. Keeping a dead service listed only creates failed orders.",
      },
      {
        q: "Do you offer white-label reseller accounts?",
        a: "Resellers buy at catalog rates and set their own client pricing. The panel itself is branded TrustifySMM; it is not sold as a hosted white-label instance.",
      },
      {
        q: "How are disputes handled?",
        a: "Open a ticket with the order ID. Support checks the provider and, when the service permits, refunds the unfulfilled amount to the wallet.",
      },
    ],
    related: ["smm-panel", "smm-panel-api", "smm-panel-reseller", "best-smm-panel", "smm-panel-for-agencies"],
    image: { src: "/brand/glass/glass-telegram.png", alt: "Telegram service icon from the provider catalog" },
    ctaTitle: "Inspect the catalog before you commit",
    ctaText: "The full service list, including minimums and delivery lines, is public.",
  },
  {
    slug: "smm-panel-reseller",
    family: "panel",
    metaTitle: "SMM Panel for Resellers — Buy at Catalog Rates | TrustifySMM",
    metaDescription:
      "Run a reseller business on one wallet: buy SMM services at catalog rates, set your own client prices, and track every order, transaction and refund in the dashboard.",
    h1: "A reseller desk that keeps",
    h1Accent: "costs traceable",
    breadcrumbLabel: "SMM Panel Reseller",
    keywords: ["smm panel reseller", "reseller smm services", "smm reselling panel"],
    intro: [
      "Reselling SMM services is a margin business, and margin only exists if you can see your cost per order. TrustifySMM keeps that number explicit: every service has a published per-1,000 rate, every order debits the wallet by a known amount, and the Transactions page records the movement.",
      "This page covers the practical side of reselling on the panel — pricing, volume, capacity planning and what to do when a client claims non-delivery.",
    ],
    sections: [
      {
        heading: "Set your resale price from a known cost",
        paragraphs: [
          "Take the catalog rate, add your margin, and you have a client price. Because rates are per 1,000 units, the arithmetic scales cleanly: if a service costs $1.25 per 1,000, 5,000 units cost $6.25, and any client price above that is your gross margin.",
          "Watch the minimums. A client asking for 250 followers when the service minimum is 500 changes your cost basis, so check the card before quoting.",
        ],
      },
      {
        heading: "Standardise on service IDs",
        paragraphs: [
          "A catalog this size contains near-duplicates: several follower services with slightly different speeds and refill terms. Pick one per outcome and keep using it. Switching service IDs between client orders makes delivery inconsistent and makes your own reporting meaningless.",
          "Use Favorites for the shortlist and Mass Order when a batch of links needs the same service and quantity.",
        ],
      },
      {
        heading: "Plan capacity against the delivery line",
        paragraphs: [
          "If a service runs 5,000 per day and a client needs 50,000, the honest answer is ten days, not overnight. Quoting from the speed line on the card protects you from the most common reseller complaint: a delivery that was never physically possible.",
          "For larger campaigns, split across two service IDs so one provider's ceiling does not stall the whole batch.",
        ],
      },
      {
        heading: "Handle refunds with the ledger",
        paragraphs: [
          "When an order delivers partially or fails, the transaction record shows exactly what was charged. That record is what you use to decide a client refund. Support can cancel and refund unfulfilled amounts to the wallet when the service allows it.",
          "Keep a simple habit: never close a client ticket before checking the order status in the panel. A completed order and a partial order require different conversations, and guessing which one you have is how resellers lose trust.",
        ],
      },
      {
        heading: "A working week on the panel",
        paragraphs: [
          "A typical reseller week looks like this: quote new requests from the catalog range, batch the repeat work through Mass Order, reconcile the wallet debits against invoices, and review any partial deliveries before the client asks about them.",
          "None of those steps require a second tool. Order history, the transaction ledger and the service catalog live in the same account, which is what keeps the numbers consistent as volume grows.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "TikTok followers", groupMatch: ["TikTok Followers"] },
      { label: "YouTube subscribers", groupMatch: ["YouTube Subscribers"] },
      { label: "Facebook page followers", groupMatch: ["Facebook Followers", "Facebook Likes"] },
      { label: "Telegram members", groupMatch: ["Telegram Members"] },
    ],
    howItWorks: [
      { title: "Fund once", text: "Top up the wallet so orders never wait on a payment step." },
      { title: "Quote from the card", text: "Use the printed range and speed line to set client expectations." },
      { title: "Order in bulk", text: "Use Mass Order for batches that share one service and quantity." },
      { title: "Reconcile", text: "Match wallet debits to client invoices from Transactions." },
    ],
    delivery: [
      "Daily speed on the card is the number to quote against client deadlines.",
      "Mass Order accepts a list of links for the same service in one submission.",
      "Order History keeps older orders available for later client disputes.",
    ],
    ordering: [
      "Bookmark your standard services in Favorites.",
      "Confirm the minimum and maximum for each client quantity.",
      "Submit via Mass Order when several links need identical treatment.",
    ],
    faq: [
      {
        q: "Can I resell TrustifySMM services under my own brand?",
        a: "Yes. You buy at catalog rates and invoice your clients at whatever price you choose. The panel stays branded TrustifySMM and is not offered as a white-label installation.",
      },
      {
        q: "Is there a reseller discount tier?",
        a: "Pricing is published per service in the catalog; there is no separate hidden reseller price list. Compare groups on the Pricing page to find the tier that fits your volume.",
      },
      {
        q: "How do I quote a delivery time to a client?",
        a: "Use the start time and daily speed printed on the service card. Those figures come from the provider and are the only defensible basis for a quote.",
      },
      {
        q: "What happens if an order delivers partially?",
        a: "The order shows partial. Open a ticket with the order ID so the unfulfilled portion can be reviewed and refunded to the wallet where the service allows.",
      },
    ],
    related: ["smm-panel", "smm-panel-for-agencies", "smm-panel-api", "bulk-social-media-services", "best-smm-panel"],
    image: { src: "/brand/glass/glass-facebook.png", alt: "Facebook service icon for reseller order workflows" },
    ctaTitle: "Start with a small funded wallet",
    ctaText: "Test one service at minimum quantity, then scale the service ID that works.",
  },
  {
    slug: "smm-panel-api",
    family: "panel",
    metaTitle: "SMM Panel API for Automated Ordering | TrustifySMM",
    metaDescription:
      "Connect your own storefront to the TrustifySMM REST API: list services, check balance, place orders and poll status with a rotatable dashboard API key.",
    h1: "A REST API for",
    h1Accent: "SMM order automation",
    breadcrumbLabel: "SMM Panel API",
    keywords: ["smm panel api", "smm api provider", "smm api v2"],
    intro: [
      "If you run your own storefront, the manual dashboard becomes the bottleneck. The TrustifySMM REST API lets your system list the catalog, read your wallet balance, submit orders and poll their status without a human in the middle.",
      "Keys are generated and rotated inside the dashboard. This page covers the endpoints, the parameters that matter, and the failure modes worth handling before you go live.",
    ],
    sections: [
      {
        heading: "What the API exposes",
        paragraphs: [
          "The v2 surface covers the operations an automated storefront actually needs: service listing with IDs, names, rates, minimums and maximums; balance lookup; order creation with a link and quantity; and status polling by order ID.",
          "Service IDs are the stable identifier. Names change when providers update wording, so store IDs in your own database and treat the name as display text.",
        ],
      },
      {
        heading: "Authentication and key hygiene",
        paragraphs: [
          "Requests are authenticated with an API key created in the dashboard. Because the key identifies your wallet, treat it like a payment credential: keep it server-side, never ship it to a browser, and rotate it if it may have been exposed.",
          "Rotating a key invalidates the old one immediately, so build your integration to read the key from configuration rather than hard-coding it.",
        ],
      },
      {
        heading: "Handling errors and partial orders",
        paragraphs: [
          "Order creation can fail for predictable reasons: an invalid link, a quantity below the service minimum, a quantity above the maximum, or an insufficient wallet balance. Each returns an error you should surface rather than retrying blindly.",
          "Status polling can also return partial. Treat partial as a distinct outcome in your own system — it needs a refund decision, not a retry.",
        ],
      },
      {
        heading: "Recommended integration pattern",
        paragraphs: [
          "Pull the service list on a schedule and cache it. Validate quantity against the cached minimum and maximum before submitting. Write the returned order ID to your database, then poll on a timer instead of blocking a request thread.",
          "For volume, keep a single funded wallet and reconcile daily against your own ledger rather than topping up per order.",
        ],
      },
      {
        heading: "What to log on your side",
        paragraphs: [
          "Store four things per submission: your own order reference, the TrustifySMM order ID, the service ID, and the quantity you requested. Those four fields answer almost every later question, including which client the charge belongs to.",
          "Log the error body when a submission fails. A rejected quantity and an insufficient balance both return an error, but they need completely different fixes, and a generic \"request failed\" message hides which one occurred.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "YouTube views", groupMatch: ["YouTube Views"] },
      { label: "TikTok views", groupMatch: ["TikTok Views"] },
      { label: "Telegram post views", groupMatch: ["Telegram Views"] },
      { label: "Spotify plays", groupMatch: ["Spotify Plays"] },
      { label: "X likes", groupMatch: ["X (Twitter) Likes", "Twitter Likes"] },
    ],
    howItWorks: [
      { title: "Create a key", text: "Generate an API key in the dashboard and store it in server configuration." },
      { title: "Cache the catalog", text: "Fetch services and keep IDs, minimums and maximums locally." },
      { title: "Submit orders", text: "Post the link and quantity, then persist the returned order ID." },
      { title: "Poll status", text: "Check order status on a timer and treat partial as its own state." },
    ],
    delivery: [
      "Order status is polled from the provider and reflected in API responses.",
      "Balance changes are visible through the balance endpoint and the dashboard ledger.",
      "Rate limits protect the upstream catalog; batch reads instead of looping per second.",
    ],
    ordering: [
      "Create the API key in the dashboard under API Documentation.",
      "Fetch the service list once and store the IDs you plan to sell.",
      "Test order creation with a minimum quantity before automating volume.",
    ],
    faq: [
      {
        q: "Is the API key the same as my login password?",
        a: "No. The API key is a separate credential generated in the dashboard and can be rotated without changing your sign-in password.",
      },
      {
        q: "Can I test the API before adding a balance?",
        a: "Read endpoints such as service listing work without spending, but order creation requires a funded wallet because it debits real balance.",
      },
      {
        q: "Do you publish official SDKs?",
        a: "The integration is plain HTTP with a key header, so any language works. The dashboard documents the endpoints and payload shapes rather than shipping language-specific packages.",
      },
      {
        q: "How should I handle a partial order through the API?",
        a: "Persist the partial status against your own order and treat it as a refund decision. Do not resubmit the same order automatically.",
      },
    ],
    related: ["smm-panel", "smm-panel-reseller", "smm-panel-for-agencies", "buy-social-media-services", "best-smm-panel"],
    image: { src: "/brand/glass/glass-x.png", alt: "X service icon representing API-driven order automation" },
    ctaTitle: "Generate a key and read the endpoints",
    ctaText: "The API documentation page in the dashboard lists request and response shapes.",
  },
  {
    slug: "smm-services",
    family: "panel",
    metaTitle: "Social Media Marketing Services Catalog | TrustifySMM",
    metaDescription:
      "Browse social media marketing services for Instagram, TikTok, YouTube, Facebook, Telegram, X, Spotify and more, with live per-1K rates and delivery windows.",
    h1: "Social media marketing",
    h1Accent: "services catalog",
    breadcrumbLabel: "SMM Services",
    keywords: ["social media marketing services", "smm services", "social media services list"],
    intro: [
      "The catalog is the product. Around 1,900 services are organised by platform and outcome, each carrying a rate per 1,000 units, a minimum and maximum order size, and a delivery estimate taken from the provider.",
      "This page explains how the catalog is structured, how to read a service line, and which outcome to choose for a given marketing goal.",
    ],
    sections: [
      {
        heading: "The four outcome types",
        paragraphs: [
          "Almost every service in the catalog falls into one of four buckets: audience (followers, subscribers, members), approval (likes, reactions, saves), reach (views, impressions, plays) and conversation (comments, shares, reposts).",
          "Each bucket behaves differently. Audience services are the slowest and most drop-sensitive. Reach services are the fastest and cheapest per unit. Approval and conversation sit between them, and comments in particular vary enormously in price because custom text costs more than a random pool.",
        ],
      },
      {
        heading: "Reading one service line",
        paragraphs: [
          "A line contains the service name, the platform, the group, the rate per 1,000, the minimum, the maximum, the average delivery time and a description with start time, speed, refill and quality notes.",
          "The description matters more than the name. Two services called \"Instagram Followers\" can differ in start time by hours and in refill coverage entirely.",
        ],
      },
      {
        heading: "Choosing by goal",
        paragraphs: [
          "For social proof on a new profile, a modest follower count plus a matching like count reads more naturally than a large follower jump with no engagement. For a campaign post, views and impressions move the metrics clients watch most.",
          "For channel growth on Telegram, post views and member counts serve different purposes: views signal reach, members signal audience size. Ordering both in proportion looks more credible than an inflated member count with no views.",
        ],
      },
      {
        heading: "Filtering and comparing",
        paragraphs: [
          "The Services page filters by platform, offers a search box for service IDs, and shows the group totals so you can see how deep a category is. The Pricing page presents the same data as a comparison deck, which is faster when you only need the range.",
          "Service IDs are the stable reference. Names are rewritten by providers when wording changes, so a saved ID keeps pointing at the same delivery even after the display name shifts. Favorites is the practical place to keep the handful of IDs you use most.",
        ],
      },
      {
        heading: "Reading the description line",
        paragraphs: [
          "Under every service name there is a short description. It states the start window, the daily speed, whether a refill is available and often a quality note such as whether accounts are real. Those four facts decide whether the service can meet a deadline.",
          "A rate on its own is not comparable across services. Two services priced at the same amount can differ by hours of start time and by whether drops are covered at all, so compare the description before the number.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "Instagram comments", groupMatch: ["Instagram Comments"] },
      { label: "Facebook post likes", groupMatch: ["Facebook Likes"] },
      { label: "YouTube views", groupMatch: ["YouTube Views"] },
      { label: "TikTok shares", groupMatch: ["TikTok Shares"] },
    ],
    howItWorks: [
      { title: "Pick the platform", text: "Start from the network, then narrow to the outcome you need." },
      { title: "Read the description", text: "Start time, speed and refill are the three lines that decide quality." },
      { title: "Check minimum and maximum", text: "Make sure your quantity is inside the accepted range." },
      { title: "Order and track", text: "Submit from the dashboard and follow the status to completion." },
    ],
    delivery: [
      "Reach services typically start fastest; audience services are the slowest.",
      "Custom comments cost more than random comment pools on the same platform.",
      "Where refill exists, the coverage window is printed on the service card.",
    ],
    ordering: [
      "Open Services and choose the platform tab.",
      "Use search to jump to a known service ID.",
      "Compare two services in the same group before ordering volume.",
    ],
    faq: [
      {
        q: "How many services are in the catalog?",
        a: "Roughly 1,900 services across the supported platforms. The exact count is shown on the Services page and changes as the upstream catalog is updated.",
      },
      {
        q: "What does the group name mean?",
        a: "The group is the outcome category, such as Instagram Followers or YouTube Views. It is what the platform filter and the pricing comparison use to group services.",
      },
      {
        q: "Why do two services with the same name cost different amounts?",
        a: "Because they are different upstream services with different start times, speeds, refill coverage and account quality. The description line on each card states the difference.",
      },
      {
        q: "Can I request a platform that is not listed?",
        a: "The catalog reflects current supply. If a platform is absent, no service is currently available for it; support can confirm whether a near-equivalent service exists.",
      },
    ],
    related: ["smm-panel", "buy-social-media-services", "bulk-social-media-services", "smm-panel-provider", "cheap-smm-panel"],
    image: { src: "/brand/glass/glass-instagram.png", alt: "Instagram icon from the TrustifySMM social media services catalog" },
    ctaTitle: "Filter the catalog by platform",
    ctaText: "Every group shows its rate range, minimum and delivery line before you order.",
  },
  {
    slug: "buy-social-media-services",
    family: "panel",
    metaTitle: "Buy Social Media Services Online | TrustifySMM",
    metaDescription:
      "Buy social media services for Instagram, TikTok, YouTube, Facebook, Telegram and more. Public per-1K pricing, crypto wallet funding and order tracking from one panel.",
    h1: "Buy social media services",
    h1Accent: "with the price in view",
    breadcrumbLabel: "Buy Social Media Services",
    keywords: ["buy social media services", "buy smm services", "social media marketing services online"],
    intro: [
      "Buying social media services should be a short, legible process: find the service, see the rate, confirm the quantity is inside the allowed range, pay from a balance, watch the order complete. That is the whole flow on TrustifySMM.",
      "This page walks through the purchase from a first-time buyer's perspective, including what to check before spending and what the order status actually means.",
    ],
    sections: [
      {
        heading: "Before you buy: three checks",
        paragraphs: [
          "First, confirm the target is public. Private profiles, age-restricted posts and channels that block joins cannot receive delivery, and that is the most common cause of a stalled order.",
          "Second, confirm the quantity is inside the service range. Third, read the start time — if you need delivery within an hour, a service with a six-hour start is the wrong choice regardless of price.",
        ],
      },
      {
        heading: "Funding the purchase",
        paragraphs: [
          "Orders are paid from the USD wallet rather than per transaction. Top up once with a supported cryptocurrency; the balance is credited after network confirmation, and the automated reconciler picks up deposits even if a provider webhook arrives late.",
          "Because the wallet is shared across the catalog, one deposit covers orders on any platform. There is no separate balance per network.",
        ],
      },
      {
        heading: "What happens after you submit",
        paragraphs: [
          "The order is queued, dispatched to the matching upstream service and tracked. Status moves through pending, in progress, completed, partial or cancelled. You can leave the page; the order continues server-side and the dashboard reflects the latest state.",
          "If a delivery stalls or arrives short, the order ID is what support needs. Open a ticket from the dashboard with that ID and the team checks the provider directly.",
        ],
      },
      {
        heading: "Buying for clients",
        paragraphs: [
          "If you are buying on behalf of a client, keep a record of the order ID against the client account. Order History holds older orders, so a question about a campaign from last month can still be answered precisely.",
          "It also helps to agree the target link in writing before ordering. Most disputes are about which post received the engagement, not whether the order ran, and a saved link settles that question in seconds.",
        ],
      },
      {
        heading: "What a purchase does not include",
        paragraphs: [
          "Buying a service changes a counter on the link you submit. It does not create followers, viewers or algorithmic reach beyond the specific action being ordered.",
          "It also does not carry any platform guarantee. If a post is later removed or an account becomes private, the delivered engagement goes with it, and that is outside the service terms.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "TikTok followers", groupMatch: ["TikTok Followers"] },
      { label: "YouTube subscribers", groupMatch: ["YouTube Subscribers"] },
      { label: "Facebook page followers", groupMatch: ["Facebook Followers", "Facebook Likes"] },
      { label: "Telegram members", groupMatch: ["Telegram Members"] },
    ],
    howItWorks: [
      { title: "Check the target is public", text: "Private profiles and blocked channels cannot receive delivery." },
      { title: "Fund the wallet", text: "Deposit a supported cryptocurrency and wait for confirmation." },
      { title: "Order from the catalog", text: "Choose the service, paste the link, set the quantity." },
      { title: "Track to completion", text: "Follow the status; open a ticket with the order ID if it stalls." },
    ],
    delivery: [
      "Start times range from near-instant to several hours depending on the service.",
      "Large quantities can run for days on slower services — the card states the daily speed.",
      "Partial deliveries are reported honestly on the order rather than closed as complete.",
    ],
    ordering: [
      "Create an account and open Add Funds.",
      "Deposit with a supported cryptocurrency.",
      "Return to New Order, pick the service and submit.",
    ],
    faq: [
      {
        q: "Do I have to fund a wallet, or can I pay per order?",
        a: "Orders are paid from the wallet balance. That keeps repeat ordering fast and produces a single ledger for every transaction.",
      },
      {
        q: "Which cryptocurrencies can I use?",
        a: "The Add Funds page lists the currently enabled coins and their networks. The list is driven by the live payment configuration rather than a static page.",
      },
      {
        q: "Can I cancel an order after submitting?",
        a: "Cancellation depends on whether the provider has started. Open a ticket with the order ID as soon as possible; unfulfilled amounts can be refunded to the wallet where the service allows.",
      },
      {
        q: "Will the order keep running if I close the browser?",
        a: "Yes. Orders are processed server-side, so closing the tab does not stop delivery. Reopen the dashboard to see the current status.",
      },
    ],
    related: ["smm-panel", "bulk-social-media-services", "smm-services", "cheap-smm-panel", "smm-panel-reseller"],
    image: { src: "/brand/glass/glass-youtube.png", alt: "YouTube icon representing a social media service purchase" },
    ctaTitle: "Place a first order at minimum quantity",
    ctaText: "Test the service on a profile you control before a client campaign.",
  },
  {
    slug: "bulk-social-media-services",
    family: "panel",
    metaTitle: "Bulk Social Media Marketing Services | TrustifySMM",
    metaDescription:
      "Place bulk social media orders across many links at once with Mass Order, one wallet balance and per-order status tracking for agencies and resellers.",
    h1: "Bulk social media orders",
    h1Accent: "without spreadsheets",
    breadcrumbLabel: "Bulk Orders",
    keywords: ["bulk social media marketing services", "bulk smm orders", "mass order smm panel"],
    intro: [
      "Once you are past a handful of orders a day, the limiting factor stops being price and becomes process. Copying a link into a form twenty times invites mistakes, and a mistyped URL produces a failed order that still consumed a support cycle.",
      "Mass Order exists for that case: paste a list of links, choose one service and one quantity, and submit the batch in a single action.",
    ],
    sections: [
      {
        heading: "How Mass Order works",
        paragraphs: [
          "Open Mass Order, select the service, set the quantity per link, then paste one URL per line. The form validates that each line looks like a URL before submitting, so an obvious typo is caught before it becomes an order.",
          "Each accepted line becomes its own order with its own ID and status. That matters because delivery per link can differ: one post may be removed, another may hit a provider ceiling. Individual IDs keep those outcomes separate.",
        ],
      },
      {
        heading: "Sizing a batch against the provider",
        paragraphs: [
          "Bulk does not remove provider limits. If a service accepts a maximum of 20,000 units but you need 50,000 on one link, split that link across two orders or two service IDs.",
          "The same applies to speed. Twenty links at 5,000 per day each do not run at the same pace as one link at 100,000 per day; the aggregate load is what the provider throttles.",
        ],
      },
      {
        heading: "Keeping batches auditable",
        paragraphs: [
          "Name client campaigns consistently in your own records and store the returned order IDs beside them. The dashboard keeps order history and transaction debits, so a batch can be reconciled against a single wallet debit group.",
        ],
      },
      {
        heading: "When bulk is the wrong tool",
        paragraphs: [
          "If each client needs a different service, quantity or delivery speed, individual orders are clearer than a mixed batch. Mass Order is for the common case where many targets need identical treatment.",
          "Bulk is also a poor fit when one of the links is critical. A large batch means a large single debit, and if the provider throttles mid-run the whole group slows together. Keep high-value links in their own orders so their delivery can be watched independently.",
        ],
      },
      {
        heading: "Validating links before submission",
        paragraphs: [
          "Open each link in a private window first. A post that has been deleted, a profile set to private, or a channel that has been restricted will all fail, and catching that before submission avoids a batch of failed orders and a support queue.",
          "For platforms where a profile and a post use different URL formats, check that the link points at the exact object the service expects. Like and view orders need a post link; follower orders need a profile link.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "Instagram views", groupMatch: ["Instagram Views"] },
      { label: "TikTok likes", groupMatch: ["TikTok Likes"] },
      { label: "TikTok shares", groupMatch: ["TikTok Shares"] },
      { label: "Telegram post views", groupMatch: ["Telegram Views"] },
      { label: "YouTube views", groupMatch: ["YouTube Views"] },
    ],
    howItWorks: [
      { title: "Open Mass Order", text: "Choose the single service the whole batch will use." },
      { title: "Paste the links", text: "One public URL per line; the form checks the shape of each entry." },
      { title: "Set one quantity", text: "The quantity applies to every accepted link in the batch." },
      { title: "Track separately", text: "Each line becomes an order with its own ID and status." },
    ],
    delivery: [
      "Batches share the service's start time and daily speed, not a faster queue.",
      "One rejected link does not block the rest of the accepted batch.",
      "Per-order status means a single failure stays visible instead of hiding in an aggregate.",
    ],
    ordering: [
      "Confirm the service maximum covers your per-link quantity.",
      "Paste links one per line and remove duplicates first.",
      "Submit, then note the returned order IDs against the client campaign.",
    ],
    faq: [
      {
        q: "How many links can one batch contain?",
        a: "The form accepts a list of links in one submission. For very large batches, split into several submissions so a single failure is easier to isolate.",
      },
      {
        q: "Can each link have a different quantity?",
        a: "No. Mass Order applies one quantity to the whole batch. Use individual orders when quantities differ.",
      },
      {
        q: "Does a bulk order cost more per unit?",
        a: "No. Each line is charged at the service rate per 1,000 units for its own quantity.",
      },
      {
        q: "What if one link in the batch fails?",
        a: "That order shows its own status. The rest of the batch continues independently, so you can open a ticket for just the failed ID.",
      },
    ],
    related: ["smm-panel", "smm-panel-reseller", "buy-social-media-services", "smm-panel-for-agencies", "cheap-smm-panel"],
    image: { src: "/brand/glass/glass-threads.png", alt: "Threads icon representing multi-link bulk order batches" },
    ctaTitle: "Submit a batch in one action",
    ctaText: "Mass Order turns a list of links into individual tracked orders.",
  },
  {
    slug: "smm-panel-for-agencies",
    family: "panel",
    metaTitle: "SMM Panel for Agencies & Marketing Teams | TrustifySMM",
    metaDescription:
      "Agencies use TrustifySMM to run client social campaigns from one wallet: predictable per-1K costs, per-client order records, API automation and support by order ID.",
    h1: "An SMM panel built around",
    h1Accent: "client reporting",
    breadcrumbLabel: "For Agencies",
    keywords: ["smm panel for agencies", "smm panel for marketing agencies", "agency smm panel"],
    intro: [
      "An agency does not buy engagement for itself. It buys on behalf of clients, and every order has to survive a question later: what did we buy, for which account, at what cost, and did it arrive?",
      "TrustifySMM is organised so those four answers exist without extra tooling — a published cost per service, an order ID per target, a ledger per transaction and a status per delivery.",
    ],
    sections: [
      {
        heading: "Client-level bookkeeping",
        paragraphs: [
          "Give each client their own record in your own systems and store the TrustifySMM order ID beside it. Order History keeps past orders retrievable, and Transactions shows the exact wallet debit for each one.",
          "That combination answers the awkward question — \"did we actually pay for 10,000 views or 9,400?\" — with a number rather than a recollection.",
        ],
      },
      {
        heading: "Quoting that survives contact with delivery",
        paragraphs: [
          "Quote from the start time and daily speed on the service card, not from the cheapest number in the category. A retainer built on a speed the provider cannot sustain is a retainer that ends in a credit.",
          "Where a campaign needs a specific date, choose a faster service even at a higher rate. The rate difference is almost always smaller than the cost of a missed deadline.",
        ],
      },
      {
        heading: "Automation for retained work",
        paragraphs: [
          "Monthly retainers repeat the same service on the same style of post. The API lets your own dashboard submit those orders directly, so account managers are not re-entering links. Keys are per-account and rotatable, which is what you want when staff turnover is a reality.",
        ],
      },
      {
        heading: "When a client disputes delivery",
        paragraphs: [
          "Pull the order ID, check its final status, and compare the delivered quantity. If it is partial or failed, open a ticket with the ID. The response references the provider's result, which is a more defensible position than an assurance that the order was sent.",
          "Keep the check in that order: order status first, wallet debit second, client conversation third. Starting from the client complaint and working backwards tends to produce a refund decision before anyone has established what actually happened.",
        ],
      },
      {
        heading: "A note on expectations",
        paragraphs: [
          "Agency work involves explaining what a service can and cannot do. A follower order changes a displayed count; it does not create engagement on future posts, and it does not influence how the platform distributes content.",
          "Setting that expectation in the proposal, before the first order, prevents the most common escalation. Clients accept a limited tool if it is described honestly at the start.",
        ],
      },
    ],
    priceGroups: [
      { label: "Instagram followers", groupMatch: ["Instagram Followers"] },
      { label: "Instagram likes", groupMatch: ["Instagram Likes"] },
      { label: "YouTube subscribers", groupMatch: ["YouTube Subscribers"] },
      { label: "YouTube watch hours", groupMatch: ["YouTube"] , nameMatch: ["Watch"] },
      { label: "LinkedIn followers", groupMatch: ["LinkedIn Followers"] },
      { label: "Spotify plays", groupMatch: ["Spotify Plays"] },
    ],
    howItWorks: [
      { title: "Map client to service", text: "Choose one service ID per outcome so reporting stays comparable." },
      { title: "Fund a shared wallet", text: "One balance covers every client, with a debit recorded per order." },
      { title: "Automate repeat work", text: "Use the API for monthly retainer orders instead of manual entry." },
      { title: "Report with IDs", text: "Store order IDs beside client records for later reconciliation." },
    ],
    delivery: [
      "Delivery windows are per service, so different clients can run on different speeds.",
      "Bulk work uses Mass Order; retained work is a better fit for API automation.",
      "Partial deliveries are reported per order, which keeps client reporting honest.",
    ],
    ordering: [
      "Create the client record in your own system first.",
      "Choose the service based on the deadline, not only the rate.",
      "Save the returned order ID against the client before the campaign ends.",
    ],
    faq: [
      {
        q: "Can several team members use one account?",
        a: "The account is single-sign-in. For team workflows, generate an API key and build the ordering into your internal tooling rather than sharing a password.",
      },
      {
        q: "Do you provide invoices for client billing?",
        a: "The Transactions and Payment History pages record wallet funding and order debits, which is what most agencies need to rebill. Formal tax invoicing depends on your own jurisdiction.",
      },
      {
        q: "How do I keep client accounts separate in reporting?",
        a: "Store the TrustifySMM order ID next to your client ID. Every order is individually addressable, so separation is a matter of your own records rather than separate panels.",
      },
      {
        q: "Is there an agency discount?",
        a: "Pricing is published per service. Compare groups on the Pricing page and pick the tier that matches the volume you actually place.",
      },
    ],
    related: ["smm-panel", "smm-panel-reseller", "smm-panel-api", "bulk-social-media-services", "best-smm-panel"],
    image: { src: "/brand/glass/glass-trustify-t.png", alt: "LinkedIn icon representing agency client campaign reporting" },
    ctaTitle: "Set up a client-ready workflow",
    ctaText: "Start with a funded wallet, one service per outcome and an order ID per client.",
  },
];
