import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminConsole } from "@/components/admin/admin-console";
import { getAdminAccess } from "@/lib/admin/access";
import { loadAdminDashboard } from "@/lib/admin/dashboard";

export const metadata: Metadata = {
  title: "Index operations",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await getAdminAccess();
  if (!access) notFound();

  const dashboard = await loadAdminDashboard();
  return (
    <AdminConsole
      key={dashboard.generatedAt}
      initialData={dashboard}
      operatorEmail={access.user.email ?? "Admin"}
    />
  );
}
