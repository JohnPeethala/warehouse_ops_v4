import { getDashboardData } from "@/app/actions/dashboard";
import { DashboardClient } from "./_components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { funnel, subCategorySplit, futureSchedule, stagedTickets, dailyCrewSummary } = await getDashboardData();
  return <DashboardClient funnel={funnel} subCategorySplit={subCategorySplit} futureSchedule={futureSchedule} stagedTickets={stagedTickets} dailyCrewSummary={dailyCrewSummary} />;
}
