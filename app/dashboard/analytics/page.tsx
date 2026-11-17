"use client";
import { OverviewView, useSessionName } from "@/components/dashboard/OverviewView";
export default function Page() {
  const name = useSessionName();
  return <OverviewView name={name} />;
}
