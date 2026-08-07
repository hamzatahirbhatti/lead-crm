import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import AddLeads from "./AddLeads";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/leads");

  const { data: team = [] } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");

  return (
    <>
      <PageHeader title="Add leads" subtitle="Import a spreadsheet or add a lead by hand." />
      <div className="p-8">
        <AddLeads team={team || []} currentUserId={user.id} />
      </div>
    </>
  );
}
