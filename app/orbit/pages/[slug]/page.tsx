import { PageEditorScreen } from "@/components/orbit/pages-cms";

export default async function OrbitPageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PageEditorScreen slug={slug} />;
}