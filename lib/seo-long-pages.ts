import type { SeoFaq, SeoSection } from "@/components/SeoArticle";

export const platformsPage = {
  badge: "Supported platforms",
  title: "Every major",
  titleAccent: "social platform",
  lede: "TrustifySMM covers Instagram, YouTube, TikTok, Facebook, X, Telegram, WhatsApp, Snapchat, Threads, LinkedIn, Spotify, Pinterest and a catch-all Other catalog — one reseller panel, live rates, and the same order desk for every network.",
  sections: [
    {
      heading: "One panel instead of ten logins",
      paragraphs: [
        "Agencies used to keep a different supplier for every network. TrustifySMM puts followers, likes, views, members and engagement services for the major platforms in a single catalog with a shared wallet. You search by platform, pick a service ID, and place the order without leaving the dashboard.",
        "Each platform tab follows the same rules: minimum and maximum quantity, rate per 1,000, refill notes when the service offers them, and a live status after you submit. That consistency is what makes the panel usable for shops that resell under their own brand.",
      ],
    },
    {
      heading: "Instagram, YouTube and TikTok",
      paragraphs: [
        "Instagram services typically include followers, likes, views, comments, story views and reel views. YouTube covers subscribers, watch time, likes and live viewers. TikTok covers followers, likes, views and shares. Exact names and speeds change as providers update the catalog, so the public services page always shows the current list.",
        "Choose a service whose minimum matches the account size you are growing. A high-speed service on a brand-new profile can look unnatural. The service description on the card is the source of truth for start time, daily speed and refill.",
      ],
    },
    {
      heading: "Facebook, X, Telegram and messaging apps",
      paragraphs: [
        "Facebook page followers, post likes and video views sit beside X followers, likes and reposts. Telegram member and view services are common for channels. WhatsApp growth options, when listed, are limited to what providers actually deliver — the panel does not invent a service that is not in the catalog.",
        "Always paste the correct public URL. A private profile, a wrong post link, or a channel that blocks joins will stall or partial. The order page shows the link you submitted so support can check it if you open a ticket.",
      ],
    },
    {
      heading: "Snapchat, Threads, LinkedIn, Spotify, Pinterest and Other",
      paragraphs: [
        "Smaller catalogs still matter for agencies. Snapchat, Threads, LinkedIn, Spotify and Pinterest appear as those networks gain active services. Anything that does not map to a named platform is grouped under Other Services so it never hides the main networks.",
        "If a platform you need is missing, it is not hidden — it is not currently supplied. Check Services again after catalog syncs, or ask support which service ID is the closest match.",
      ],
    },
    {
      heading: "How to pick a platform service",
      paragraphs: [
        "Start from the platform, then the outcome (followers, views, likes), then the speed and refill line. Compare the rate per 1,000 against your resale price before you promise a client a delivery window. The panel price is what you pay; your client price is your decision.",
        "Favorites let you pin the service IDs you sell every week. Mass order is for sheets of links that share one service. Both live in the customer dashboard after you create a free account and add crypto balance.",
      ],
    },
  ] satisfies SeoSection[],
  faqTitle: "Platform FAQ",
  faq: [
    {
      q: "Which platforms does TrustifySMM support?",
      a: "The live catalog includes Instagram, YouTube, TikTok, Facebook, X, Telegram, WhatsApp, Snapchat, Threads, LinkedIn, Spotify, Pinterest and Other. Availability follows the current provider list.",
    },
    {
      q: "Are the same prices on every platform?",
      a: "No. Each service has its own rate per 1,000, minimum, maximum and refill terms. Open Services to see the current USD price.",
    },
    {
      q: "Can I order several platforms from one wallet?",
      a: "Yes. One USD balance pays for every platform. Top up with crypto through Banker, then place orders from New Order or Mass Order.",
    },
    {
      q: "What if a platform link is private?",
      a: "Most services need a public URL. Private accounts, deleted posts and wrong links are the usual reason an order stays pending or completes partial.",
    },
    {
      q: "Do you guarantee a specific follower count overnight?",
      a: "Delivery follows the speed written on the service. TrustifySMM does not promise a result that the selected service does not list.",
    },
    {
      q: "Where do I see Other Services?",
      a: "Other is always last in the platform filter so named networks stay easy to scan.",
    },
  ] satisfies SeoFaq[],
};

export const howPage = {
  badge: "How TrustifySMM works",
  title: "From signup to",
  titleAccent: "delivered order",
  lede: "Create a free account, fund the wallet with crypto, pick a service ID, submit a public link, and track status in the same dashboard. Four steps, no separate supplier for each network.",
  sections: [
    {
      heading: "1. Create a free account",
      paragraphs: [
        "Sign up with email or Google. You get a customer dashboard, an API key, and an empty USD wallet. There is no monthly panel fee to open the account. You pay only for the orders you place.",
        "Add your name and timezone under My Profile. If you signed in with Google, you can still set an email password later so the panel is not tied to one login method.",
      ],
    },
    {
      heading: "2. Add crypto balance",
      paragraphs: [
        "Add Funds uses the Banker crypto desk. Choose a coin the gateway supports, set a USD amount, and pay the invoice before it expires. Balance increases only after the payment gateway confirms the transfer. A screenshot alone does not credit the wallet.",
        "Payment History lists pending, confirming and paid deposits. Transactions shows the ledger after credit, including later order charges and refunds.",
      ],
    },
    {
      heading: "3. Place an order",
      paragraphs: [
        "Open New Order, filter by platform, and select a service. Enter the public link and quantity inside the minimum and maximum. The charge is calculated from the rate per 1,000 and deducted from available balance when the order is accepted.",
        "Mass Order accepts many links for one service. Favorites keeps the IDs you reuse. Both are in the main menu after you sign in.",
      ],
    },
    {
      heading: "4. Track, refill and support",
      paragraphs: [
        "My Orders shows pending, processing, in progress, completed, partial and canceled. Open an order for the service name, charge, start count and remains. If the service includes refill, use the refill action while the window is still open.",
        "If something looks wrong, open a support ticket with the order ID. Help Center answers the common cases — private links, partials, and slow starts — before you need a human.",
      ],
    },
    {
      heading: "Optional: automate with the API",
      paragraphs: [
        "The same account can place orders from your own site. The API documentation page lists services, add order, status and balance. Your key is under API Documentation in the dashboard. Treat it like a password.",
        "API orders use the same wallet and the same service IDs as the panel. There is no second price list.",
      ],
    },
  ] satisfies SeoSection[],
  faqTitle: "How it works FAQ",
  faq: [
    {
      q: "Is the account free?",
      a: "Yes. Creating an account is free. You pay the service rate only when you place an order.",
    },
    {
      q: "How fast is the first order?",
      a: "Start time is printed on the service. Some start within minutes. Others queue. The card is the promise, not a generic slogan.",
    },
    {
      q: "What currency is the wallet?",
      a: "The panel balance is USD. You deposit with crypto. The invoice converts the USD amount into the coin you pick.",
    },
    {
      q: "Can I cancel an order?",
      a: "Cancellation depends on status and the provider. Pending orders are the usual candidates. Completed delivery is not reversed from the button.",
    },
    {
      q: "What is a partial?",
      a: "The provider delivered some of the quantity and stopped. Remains and charge are updated. You can reorder the gap with another service if you want.",
    },
    {
      q: "Do I need the API?",
      a: "No. The dashboard is enough for manual orders. The API is for stores and scripts.",
    },
  ] satisfies SeoFaq[],
};

export const reviewsPage = {
  badge: "Customer reviews",
  title: "What resellers say",
  titleAccent: "about the panel",
  lede: "TrustifySMM is built for people who place orders every day: stable starts, a clear wallet, and a catalog they can mark up for their own clients. Here is how those workflows usually feel, and what to check before you trust any review.",
  sections: [
    {
      heading: "What a useful review actually tells you",
      paragraphs: [
        "A useful panel review mentions order speed against the service description, refill behavior, and whether support answered with the order ID. Generic praise does not help you pick a service. Compare comments with the min, max and rate you see on the live catalog.",
        "TrustifySMM publishes sample feedback on the homepage so new visitors can see the tone of the product. Your own orders are the better test: place a small quantity, watch status, then scale.",
      ],
    },
    {
      heading: "Speed and stability",
      paragraphs: [
        "Resellers care that a service starts inside the window it advertises. The dashboard shows status changes so you are not refreshing a supplier chat. If a start is late, the order page is what you attach to a ticket.",
        "Stability also means the wallet math is boring. Charges match the rate, refunds show on the ledger, and a deposit does not appear until the gateway confirms it. That is the behavior buyers describe when they stay.",
      ],
    },
    {
      heading: "Pricing for agencies",
      paragraphs: [
        "Agencies compare rate per 1,000, not a single “cheap panel” headline. A slower service with refill can be cheaper to resell than a fast service that drops. Read both lines before you lock a client price.",
        "Because every platform shares one balance, finance teams reconcile one ledger instead of five supplier wallets. Transactions and Payment History are there for that reason.",
      ],
    },
    {
      heading: "Support when an order sticks",
      paragraphs: [
        "Tickets work best with the numeric order ID, the link, and what you expected versus what status shows. Support can see the same order you see. A message that only says “not working” takes longer.",
        "The Help Center already covers private links, partials, API keys and crypto deposits. Read that page first if you are evaluating how the panel explains itself.",
      ],
    },
    {
      heading: "Try it with a small order",
      paragraphs: [
        "Create a free account, deposit a small crypto amount, and order the minimum on a service you already understand. That single loop — pay, order, track — tells you more than a long testimonial.",
        "If the loop fits your shop, pin the service to Favorites and, if you have a store, call the same ID from the API.",
      ],
    },
  ] satisfies SeoSection[],
  faqTitle: "Reviews FAQ",
  faq: [
    {
      q: "Are homepage quotes a guarantee?",
      a: "No. They describe typical experiences. Each service has its own speed, refill and drop behavior.",
    },
    {
      q: "How can I judge the panel myself?",
      a: "Place a minimum order on a public link you control and watch status, charge and remains in My Orders.",
    },
    {
      q: "Where do I report a bad delivery?",
      a: "Open a ticket from the dashboard with the order ID. Include the link and the status you see.",
    },
    {
      q: "Do you edit reviews?",
      a: "Marketing quotes on the homepage are short samples. Your order history is the record that matters for your account.",
    },
    {
      q: "Can agencies share one review of the API?",
      a: "The API uses the same services and wallet as the panel. Test status and balance calls with your key before you connect a store.",
    },
    {
      q: "What should I ignore in random panel reviews?",
      a: "Claims of instant followers on every service, or prices that do not match the live rate per 1,000.",
    },
  ] satisfies SeoFaq[],
};

export const termsPage = {
  badge: "Legal",
  title: "Terms of",
  titleAccent: "Service",
  lede: "These terms cover TrustifySMM accounts, crypto deposits, SMM orders and the API. By creating an account or placing an order you agree to them. If you resell services, you are responsible for your own clients.",
  sections: [
    {
      heading: "Accounts",
      paragraphs: [
        "You must provide a real email and keep your password and API key private. You are responsible for orders placed from your account, including orders placed with your API key. We may suspend an account that abuses the panel, shares keys publicly, or attempts to manipulate balances.",
        "Google sign-in and email sign-in can belong to the same customer record. Setting a password does not remove Google sign-in. Closing other sessions after a password change is normal.",
      ],
    },
    {
      heading: "Orders",
      paragraphs: [
        "An order is a request to deliver the quantity described on the service you selected, to the public link you submitted, inside that service’s minimum and maximum. Start speed, refill and drop behavior are defined by the service text, not by marketing pages.",
        "Wrong links, private accounts, deleted posts and prohibited targets can be canceled or partial. You must have the right to promote the account or content you submit. TrustifySMM does not accept orders that ask us to break a platform’s rules on your behalf beyond the ordinary SMM services listed in the catalog.",
      ],
    },
    {
      heading: "Wallet and crypto",
      paragraphs: [
        "Balance is stored in USD. Deposits are crypto invoices. Funds are credited only after the payment gateway confirms the transfer. Sending a different amount, paying after expiry, or paying the wrong asset can delay or prevent credit.",
        "Order charges reduce available balance when the order is accepted. Refunds, when a provider returns them, appear on the ledger. We do not add balance from payment screenshots.",
      ],
    },
    {
      heading: "Refills, partials and cancellations",
      paragraphs: [
        "Refill is available only when the service says so, and only inside its refill window. A partial means part of the quantity was delivered. The remains and charge follow the provider update.",
        "Cancellation is not guaranteed after processing starts. Completed orders are not refunded because the result later fluctuates, unless the service’s own refill terms apply.",
      ],
    },
    {
      heading: "API and acceptable use",
      paragraphs: [
        "The API is part of your account. Rate limits and service IDs can change as the catalog changes. You must not hammer the API, scrape other customers, or use the panel to send malware or to phish.",
        "We may change services, prices and features. Continued use after a change means you accept the current catalog. These terms may be updated on this page; the date you rely on is the page you read before ordering.",
      ],
    },
  ] satisfies SeoSection[],
  faqTitle: "Terms FAQ",
  faq: [
    {
      q: "Who is responsible for client orders if I resell?",
      a: "You are. Your clients are not TrustifySMM customers unless they open their own accounts.",
    },
    {
      q: "When is my deposit real?",
      a: "When the gateway marks it paid and the wallet ledger shows the credit. A pending invoice is not balance.",
    },
    {
      q: "Can I get a refund for a completed order?",
      a: "Completed delivery is generally final. Use refill if the service includes it. Partials are adjusted to what was delivered.",
    },
    {
      q: "What happens if I share my API key?",
      a: "Anyone with the key can spend your balance. Revoke and regenerate the key immediately, then change your password.",
    },
    {
      q: "Do these terms cover the public website and the dashboard?",
      a: "Yes. The marketing site, the customer panel and the API are one service.",
    },
    {
      q: "How do I contact you about a terms issue?",
      a: "Use the Help Center ticket form or the support email listed in the footer.",
    },
  ] satisfies SeoFaq[],
};

export const privacyPage = {
  badge: "Legal",
  title: "Privacy",
  titleAccent: "Policy",
  lede: "This policy explains what TrustifySMM stores to run accounts, orders, crypto deposits and support tickets, and what we do not sell. It applies to the public site, the customer dashboard and the API.",
  sections: [
    {
      heading: "Data we collect",
      paragraphs: [
        "Account data includes your email, name, username, timezone, password hash or Google identifier, API key, and session records. Order data includes service IDs, target links, quantities, charges and statuses. Payment data includes invoice IDs, coin, amount, address, transaction hash if you submit one, and gateway status.",
        "Support tickets store the messages you send and files you attach. Server logs may store IP address, browser type and pages visited so we can secure the panel and understand traffic.",
      ],
    },
    {
      heading: "Why we use it",
      paragraphs: [
        "We use this data to create your account, show your balance, place and track orders, credit confirmed deposits, answer tickets, and prevent fraud. API requests are matched to your key so orders bill the correct wallet.",
        "We do not sell personal information. We do not use your order links as marketing audiences. Providers receive the link and quantity required to deliver the service you bought.",
      ],
    },
    {
      heading: "Payments",
      paragraphs: [
        "Crypto checkout is handled by the payment gateway configured on the server. The gateway sees the invoice details needed to collect the coin. TrustifySMM stores the status and the credit decision, not your wallet seed or card number. The panel does not ask for bank card numbers.",
        "Webhook notifications update deposit status. Those notices are verified before a balance changes.",
      ],
    },
    {
      heading: "Cookies and sessions",
      paragraphs: [
        "A session cookie keeps you signed in to the dashboard. It is required for the panel to work. You can sign out, which ends that browser session. Changing your password signs out other sessions.",
        "The public site may count anonymous page views to measure traffic. That measurement is not a profile of your social accounts.",
      ],
    },
    {
      heading: "Retention and your choices",
      paragraphs: [
        "Orders, ledger lines and tickets are kept so your account history stays accurate and so disputes can be checked. You may ask support to correct your name or email. Some records must stay for finance and abuse prevention even if you stop ordering.",
        "Do not send passwords or full API keys in a ticket. Use the dashboard controls to rotate a key. Questions about this policy go to the support email in the footer.",
      ],
    },
  ] satisfies SeoSection[],
  faqTitle: "Privacy FAQ",
  faq: [
    {
      q: "Do you sell my email?",
      a: "No. Email is used for the account and for support you request.",
    },
    {
      q: "Do you store my crypto seed?",
      a: "No. You pay a gateway invoice from your own wallet. We store invoice status, not your seed phrase.",
    },
    {
      q: "Who sees the link I order?",
      a: "TrustifySMM and the provider that delivers that service. The link is required to fulfill the order.",
    },
    {
      q: "Can I delete my account?",
      a: "Ask support. Finance records for completed orders and confirmed deposits may be retained.",
    },
    {
      q: "Are API keys shown to staff?",
      a: "Keys are stored so the server can authenticate requests. Do not paste a live key into email. Regenerate it if it leaks.",
    },
    {
      q: "Do you use my data to run ads?",
      a: "We do not build ad audiences from your order links or wallet.",
    },
  ] satisfies SeoFaq[],
};
