import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import Resources from "./Resources";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = me?.role === "admin";

  const { data: docs = [] } = await supabase
    .from("documents")
    .select("*, uploader:uploaded_by(full_name)")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Resources" subtitle="Pitch decks, portfolio, and the sales kit for the BD team." />
      <div className="p-8">
        <Resources initialDocs={docs || []} isAdmin={isAdmin} currentUserId={user.id} />
      </div>
    </>
  );
}
