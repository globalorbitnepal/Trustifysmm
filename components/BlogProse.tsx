import type { BlogBlock } from "@/data/blog-types";

export function BlogProse({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="blog-prose">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={block.id} id={block.id} className="blog-prose-h2">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={block.id} id={block.id} className="blog-prose-h3">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="blog-prose-p">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="blog-prose-ul">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote key={i} className="blog-prose-quote">
                <p>{block.text}</p>
                {block.cite ? <cite>— {block.cite}</cite> : null}
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}