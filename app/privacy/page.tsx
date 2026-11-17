import { SiteHeader } from "@/components/SiteHeader";
import { pageHero } from "@/lib/orbit/public-copy";

export default function PrivacyPage() {
  const hero = pageHero("/privacy", {
    title: "Privacy Policy",
    lede: "Privacy details will be published here before public launch.",
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