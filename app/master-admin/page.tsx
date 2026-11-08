export const instant = false;

import { connection } from "next/server";
import { MasterAdminPanel } from "@/components/master-admin/master-admin-panel";
import { getMasterAdminDataAction } from "@/app/actions/master-admin";

export default async function MasterAdminPage() {
  await connection();
  const result = await getMasterAdminDataAction();
  return <MasterAdminPanel initialClubs={result.clubs} initialLogs={result.logs} error={result.success ? null : result.error || "Nie udało się pobrać danych."} />;
}
