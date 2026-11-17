import type { CustomerReview, HowPerk, HowStep, PaymentCoin, PaymentPerk, PlatformCard } from "@/lib/orbit/types";

export const defaultPlatformCards: PlatformCard[] = [
  { id: "instagram", name: "Instagram", services: "Followers, Likes, Views" },
  { id: "youtube", name: "YouTube", services: "Subscribers, Views, Likes" },
  { id: "tiktok", name: "TikTok", services: "Followers, Likes, Views" },
  { id: "facebook", name: "Facebook", services: "Followers, Likes, Shares" },
  { id: "x", name: "X (Twitter)", services: "Followers, Likes, Retweets" },
  { id: "telegram", name: "Telegram", services: "Members, Views, Reactions" },
  { id: "whatsapp", name: "WhatsApp", services: "Channel & Group Growth" },
  { id: "snapchat", name: "Snapchat", services: "Followers, Views, Engagement" },
  { id: "threads", name: "Threads", services: "Followers, Likes, Replies" },
  { id: "more", name: "More Platforms", services: "And Many More..." },
];

export const defaultHowSteps: HowStep[] = [
  { num: "01", title: "Create Account", text: "Sign up for a free account on TrustifySMM.", tone: "violet" },
  { num: "02", title: "Add Balance", text: "Top up your wallet with multiple secure payment options.", tone: "blue" },
  { num: "03", title: "Place Order", text: "Choose a service, enter the details and place your order.", tone: "violet" },
  { num: "04", title: "Get Results", text: "Your order will be processed instantly and delivered quickly.", tone: "blue" },
];

export const defaultHowPerks: HowPerk[] = [
  { label: "Fast Process" },
  { label: "Secure Payments" },
  { label: "Fully Automated" },
  { label: "Reliable Service" },
];

export const defaultCustomerReviews: CustomerReview[] = [
  {
    name: "Amit Verma",
    country: "India",
    flag: "🇮🇳",
    avatar: "/brand/reviews/review-amit-verma.jpg",
    text: "Great SMM panel! Orders are fast, stable, and the support team is very helpful. Highly recommended.",
    tone: "violet",
  },
  {
    name: "Emily Johnson",
    country: "United States",
    flag: "🇺🇸",
    avatar: "/brand/reviews/review-emily-johnson.jpg",
    text: "I've been using TrustifySMM for a few months. The service quality is excellent and prices are very competitive.",
    tone: "blue",
  },
  {
    name: "Rafiq Ahmed",
    country: "Bangladesh",
    flag: "🇧🇩",
    avatar: "/brand/reviews/review-rafiq-ahmed.jpg",
    text: "Very reliable and easy to use. The dashboard is simple and I always get my orders on time.",
    tone: "violet",
  },
  {
    name: "Daniel Müller",
    country: "Germany",
    flag: "🇩🇪",
    avatar: "/brand/reviews/review-daniel-muller.jpg",
    text: "One of the best SMM panels I've used. Fast delivery, good support and a wide range of services.",
    tone: "blue",
  },
  {
    name: "Sophie Turner",
    country: "United Kingdom",
    flag: "🇬🇧",
    avatar: "/brand/reviews/review-sophie-turner.jpg",
    text: "Clean dashboard, quick top-ups and smooth order flow. Perfect for agency clients across Europe.",
    tone: "violet",
  },
  {
    name: "Hassan Khan",
    country: "Pakistan",
    flag: "🇵🇰",
    avatar: "/brand/reviews/review-hassan-khan.jpg",
    text: "TrustifySMM saves me hours every week. Pricing is fair and delivery is consistently on time.",
    tone: "blue",
  },
];

export const defaultPaymentCoins: PaymentCoin[] = [
  { id: "btc", name: "Bitcoin", ticker: "BTC", tone: "violet" },
  { id: "eth", name: "Ethereum", ticker: "ETH", tone: "blue" },
  { id: "usdt", name: "Tether", ticker: "USDT", tone: "violet" },
  { id: "sol", name: "Solana", ticker: "SOL", tone: "blue" },
];

export const defaultPaymentPerks: PaymentPerk[] = [
  { label: "Instant Deposit" },
  { label: "Secure Transactions" },
  { label: "Global Support" },
];