export const instant = false;

import { connection } from "next/server";
import { getClubFieldsAction } from "@/app/actions/admin";
import { FieldsManager } from "@/components/admin/fields-manager";

export const metadata = {
  title: "Boiska i obiekty | FORMA",
};

export default async function AdminFieldsPage() {
  await connection();

  const result = await getClubFieldsAction();

  if (!result.success) {
    return (
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-xs font-mono text-destructive">
        {result.error || "Nie udało się załadować boisk."}
      </div>
    );
  }

  return <FieldsManager initialFields={result.fields} />;
}
