import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog-types";
import { formatBlogDate } from "@/data/blog-utils";

export function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article className={`blog-card${featured ? " blog-card--featured" : ""}`}>
      <Link href={`/blogs/${post.slug}`} className="blog-card-link">
        <div className="blog-card-media">
          <Image
            src={post.image.src}
            alt={post.image.alt}
            width={featured ? 1200 : 640}
            height={featured ? 520 : 360}
            sizes={featured ? "(min-width: 900px) 66vw, 100vw" : "(min-width: 900px) 33vw, 100vw"}
            className="blog-card-img"
            quality={90}
            priority={featured}
          />
          <span className="blog-card-chip">{post.category}</span>
        </div>
        <div className="blog-card-body">
          <p className="blog-card-meta">
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readMinutes} min read</span>
          </p>
          <h2 className="blog-card-title">{post.title}</h2>
          <p className="blog-card-excerpt">{post.excerpt}</p>
          <ul className="blog-card-keywords" aria-label="Focus keywords">
            {post.focusKeywords.slice(0, 3).map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
          <span className="blog-card-cta">
            Read full article
            <Arrow />
          </span>
        </div>
      </Link>
    </article>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}