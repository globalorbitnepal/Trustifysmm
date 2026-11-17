import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { BlogIndexFaq } from "@/components/BlogIndexFaq";
import { Footer } from "@/components/Footer";
import { HeroStat, HeroStatGrid, PublicPageHero } from "@/components/PublicPageHero";
import { SiteHeader } from "@/components/SiteHeader";
import { blogsIndexFaq } from "@/data/blogs-index-faq";
import { getAllBlogPosts } from "@/data/blog-utils";
import { publicManagedPosts } from "@/lib/orbit/blog-store";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageHero } from "@/lib/orbit/public-copy";

const blogsMetadata: Metadata = {
  title: "SMM Panel Blogs & Growth Guides | TrustifySMM",
  description:
    "Ten long SEO guides with custom 16:9 hero images, section navigation, and FAQ schema on every post — SMM panels, Instagram, TikTok, YouTube, API, crypto Banker, agency pricing and KPIs.",
  keywords: [
    "smm panel blog",
    "smm reseller guides",
    "instagram smm tutorial",
    "tiktok smm guide",
    "trustifysmm blog",
    "smm api tutorial",
  ],
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "TrustifySMM Blogs — SMM Growth & Panel Guides",
    description: "Long-form SEO guides for agencies, developers and resellers.",
    url: "/blogs",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/blogs", blogsMetadata);
}

export default function BlogsPage() {
  const hero = pageHero("/blogs", {
    badge: "Insights & playbooks",
    title: "SMM",
    titleAccent: "Blog & Guides",
    lede: "Ten long-form articles for resellers, agencies and developers — SEO-ready titles, focus keywords, hero images and section-by-section reading on every post.",
    ctaPrimary: "Start reselling",
    ctaPrimaryHref: "/signup",
    ctaSecondary: "View services",
    ctaSecondaryHref: "/services",
  });
  const managed = publicManagedPosts();
  const managedSlugs = new Set(managed.map((post) => post.slug));
  const posts = [...managed, ...getAllBlogPosts().filter((post) => !managedSlugs.has(post.slug))].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const [featured, ...rest] = posts;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: blogsIndexFaq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "TrustifySMM Blog",
    description: blogsMetadata.description,
    url: "https://trustifysmm.com/blogs",
    hasPart: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://trustifysmm.com/blogs/${p.slug}`,
      image: `https://trustifysmm.com${p.image.src}`,
      datePublished: p.publishedAt,
      author: { "@type": "Person", name: p.author },
    })),
  };

  return (
    <main className="page">
      <SiteHeader />
      <section className="blog-page public-page-band">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

        <div className="blog-page-inner public-page-inner">
          <PublicPageHero
            id="blogs-hero-title"
            badge={hero.badge}
            badgeIcon={<PenIcon />}
            title={hero.title}
            titleAccent={hero.titleAccent}
            lede={hero.lede}
            heroImage={hero.heroImage}
            heroImageAlt={hero.heroImageAlt}
            primary={
              hero.ctaPrimary ? { label: hero.ctaPrimary, href: hero.ctaPrimaryHref || "/signup" } : undefined
            }
            secondary={
              hero.ctaSecondary
                ? { label: hero.ctaSecondary, href: hero.ctaSecondaryHref || "/services" }
                : undefined
            }
          >
            <HeroStatGrid label="Blog highlights">
              <HeroStat value={posts.length} label="Guides & articles" />
              <HeroStat value="SEO" label="Schema & focus keywords" />
              <HeroStat value="16:9" label="Hero image on every post" />
            </HeroStatGrid>
          </PublicPageHero>

          {featured ? <BlogCard post={featured} featured /> : null}

          <div className="blog-grid" aria-label="All blog posts">
            {rest.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          <BlogIndexFaq />
        </div>
      </section>
      <Footer />
    </main>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M5 17l9.2-9.2a2.8 2.8 0 1 0-4-4L4 14v4h1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}