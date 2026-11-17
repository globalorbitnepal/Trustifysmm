"use client";

import { OverviewView, useSessionName } from "@/components/dashboard/OverviewView";

export default function DashboardPage() {
  const name = useSessionName();
  return <OverviewView name={name} />;
}
