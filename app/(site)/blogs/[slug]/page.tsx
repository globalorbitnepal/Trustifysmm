import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/BlogArticle";
import { getBlogPostBySlug, getBlogSlugs } from "@/data/blog-utils";
import { publicManagedPosts } from "@/lib/orbit/blog-store";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

function findPost(slug: string) {
  return publicManagedPosts().find((post) => post.slug === slug) ?? getBlogPostBySlug(slug);
}

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: "Blog | TrustifySMM", robots: { index: false, follow: false } };

  const managed = post as typeof post & {
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    noindex?: boolean;
    status?: string;
  };

  const ogImage = managed.ogImage
    ? managed.ogImage.startsWith("http")
      ? managed.ogImage
      : `https://trustifysmm.com${managed.ogImage}`
    : post.image.src.startsWith("http")
      ? post.image.src
      : `https://trustifysmm.com${post.image.src}`;

  const canonical = managed.canonical
    ? managed.canonical.startsWith("http")
      ? managed.canonical
      : `https://trustifysmm.com${managed.canonical}`
    : `https://trustifysmm.com/blogs/${post.slug}`;

  const title = managed.ogTitle || post.metaTitle;
  const noindex = Boolean(managed.noindex) || managed.status === "draft";

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical },
    // Meta keywords are not a ranking factor and are deliberately not emitted.
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    openGraph: {
      title,
      description: managed.ogDescription || post.metaDescription,
      url: canonical,
      siteName: "TrustifySMM",
      locale: "en_US",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.image.alt }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@trustifysmm",
      title,
      description: managed.ogDescription || post.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    image: `https://trustifysmm.com${post.image.src}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "TrustifySMM",
      logo: { "@type": "ImageObject", url: "https://trustifysmm.com/brand/logo-premium.png" },
    },
    isPartOf: { "@id": "https://trustifysmm.com/#website" },
    mainEntityOfPage: { "@id": `https://trustifysmm.com/blogs/${post.slug}#webpage` },
    keywords: post.focusKeywords.join(", "),
  };

  return (
    <main className="page">
      <section className="blog-post-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <div className="blog-post-page-inner">
          <BlogArticle post={post} />
        </div>
      </section>
    </main>
  );
}