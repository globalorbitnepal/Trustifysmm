import { DashboardShell } from "@/components/dashboard/DashboardShell";
import "./panel.css";
import "./deposit.css";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(localStorage.getItem("trustify-dash-theme")==="light"){document.documentElement.setAttribute("data-dash","light")}}catch(e){}})();`,
        }}
      />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
