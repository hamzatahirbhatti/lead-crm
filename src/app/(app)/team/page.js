import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import TeamList from "./TeamList";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/leads");

  const { data: team = [] } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at");

  return (
    <>
      <PageHeader title="Team" subtitle="Your BD reps and admins." />
      <div className="p-8">
        <TeamList initialTeam={team || []} currentUserId={user.id} />
      </div>
    </>
  );
}
