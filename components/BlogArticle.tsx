import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog-types";
import { formatBlogDate, getBlogToc } from "@/data/blog-utils";
import { BlogPostFaq } from "@/components/BlogPostFaq";
import { BlogProse } from "@/components/BlogProse";
import { BlogToc } from "@/components/BlogToc";

export function BlogArticle({ post }: { post: BlogPost }) {
  const toc = getBlogToc(post.blocks, true);

  return (
    <div className="blog-article">
      <header className="blog-article-hero">
        <div className="blog-article-hero-media">
          <Image
            src={post.image.src}
            alt={post.image.alt}
            fill
            priority
            sizes="(min-width: 1200px) 70vw, 100vw"
            quality={92}
            className="blog-article-hero-img"
          />
          <div className="blog-article-hero-shade" />
        </div>
        <div className="blog-article-hero-copy">
          <Link href="/blogs" className="blog-back">
            ← All blogs
          </Link>
          <span className="blog-article-chip">{post.category}</span>
          <h1 className="blog-article-title">{post.title}</h1>
          <p className="blog-article-excerpt">{post.excerpt}</p>
          <div className="blog-article-byline">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>Updated {formatBlogDate(post.updatedAt)}</span>
            <span aria-hidden>·</span>
            <span>{post.readMinutes} min read</span>
          </div>
          <ul className="blog-article-keywords">
            {post.focusKeywords.map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
        </div>
      </header>

      <div className="blog-article-layout">
        <article className="blog-article-main">
          <BlogProse blocks={post.blocks} />
          <BlogPostFaq items={post.faq} />
          <footer className="blog-article-footer">
            <p>Ready to put this into practice?</p>
            <div className="blog-article-footer-actions">
              <Link className="btn btn-primary" href="/signup">
                Create free account
              </Link>
              <Link className="btn btn-ghost" href="/services">
                Browse services
              </Link>
              <Link className="btn btn-ghost" href="/api">
                API docs
              </Link>
            </div>
          </footer>
        </article>
        <aside className="blog-article-aside">
          <BlogToc items={toc} title={post.title} />
        </aside>
      </div>
    </div>
  );
}