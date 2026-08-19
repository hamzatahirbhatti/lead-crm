import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import LeadsTable from "./LeadsTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = me?.role === "admin";

  const { data: leads = [] } = await supabase
    .from("leads")
    .select("*, assigned:assigned_to(id, full_name)")
    .order("created_at", { ascending: false });

  const { data: team = [] } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  return (
    <>
      <PageHeader title="Leads" subtitle={`${(leads || []).length} leads in view.`}>
        {isAdmin && (
          <Link href="/upload" className="btn-primary">
            Add leads
          </Link>
        )}
      </PageHeader>

      <div className="p-8">
        <LeadsTable
          initialLeads={leads || []}
          team={team || []}
          isAdmin={isAdmin}
          initialStatus={searchParams?.status || ""}
          initialAssignee={searchParams?.assignee || ""}
        />
      </div>
    </>
  );
}
