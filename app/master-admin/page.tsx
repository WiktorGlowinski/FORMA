export const instant = false;

import { connection } from "next/server";
import { MasterAdminPanel } from "@/components/master-admin/master-admin-panel";
import { getMasterAdminDataAction } from "@/app/actions/master-admin";
import { getMasterBugReportsAction } from "@/app/actions/bug-reports";

export default async function MasterAdminPage() {
  await connection();
  const [result, reportsResult] = await Promise.all([getMasterAdminDataAction(), getMasterBugReportsAction()]);
  return <MasterAdminPanel initialClubs={result.clubs} initialLogs={result.logs} initialReports={reportsResult.reports} error={result.success ? null : result.error || "Nie udało się pobrać danych."} />;
}
