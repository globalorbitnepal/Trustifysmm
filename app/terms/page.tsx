import { SiteHeader } from "@/components/SiteHeader";
import { pageHero } from "@/lib/orbit/public-copy";

export default function TermsPage() {
  const hero = pageHero("/terms", {
    title: "Terms of Service",
    lede: "Full terms will be published here before public launch.",
  });
  return (
    <main className="page">
      <SiteHeader />
      <section className="page-pad">
        <h1 className="headline">
          {hero.title} {hero.titleAccent ? <span className="grad">{hero.titleAccent}</span> : null}
        </h1>
        <p className="lede">{hero.lede}</p>
      </section>
    </main>
  );
}