import { TicketThreadView } from "@/components/dashboard/AccountViews";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketThreadView id={id} />;
}
