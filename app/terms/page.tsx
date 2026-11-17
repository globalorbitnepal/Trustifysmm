import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { pageExtras } from "@/lib/orbit/page-extras";
import { pageHero } from "@/lib/orbit/public-copy";

export default function TermsPage() {
  const hero = pageHero("/terms", {
    title: "Terms of Service",
    lede: "Full terms will be published here before public launch.",
  });
  const blocks = pageExtras("/terms").body ?? [];
  return (
    <main className="page">
      <SiteHeader />
      <section className="page-pad legal-page">
        <h1 className="headline">
          {hero.title} {hero.titleAccent ? <span className="grad">{hero.titleAccent}</span> : null}
        </h1>
        <p className="lede">{hero.lede}</p>
        {hero.heroImage ? <img className="legal-hero" src={hero.heroImage} alt={hero.heroImageAlt || ""} /> : null}
        <div className="legal-body">
          {blocks.map((block) => (
            <article key={block.heading}>
              <h2>{block.heading}</h2>
              <p>{block.text}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}