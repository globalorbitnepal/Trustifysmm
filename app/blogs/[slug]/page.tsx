import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/BlogArticle";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getBlogPostBySlug, getBlogSlugs } from "@/data/blog-utils";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Blog | TrustifySMM" };

  const ogImage = post.image.src.startsWith("http") ? post.image.src : `https://trustifysmm.com${post.image.src}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.focusKeywords,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `/blogs/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: [{ url: ogImage, alt: post.image.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
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
    mainEntityOfPage: `https://trustifysmm.com/blogs/${post.slug}`,
    keywords: post.focusKeywords.join(", "),
  };

  return (
    <main className="page">
      <Header />
      <section className="blog-post-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <div className="blog-post-page-inner">
          <BlogArticle post={post} />
        </div>
      </section>
      <Footer />
    </main>
  );
}