import { DashboardShell } from "@/components/dashboard/DashboardShell";
import "./panel.css";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
