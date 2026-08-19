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

  // Admin sees all leads (RLS), so we can build an assignment breakdown.
  const { data: leadRows = [] } = await supabase.from("leads").select("id, assigned_to, status");

  const counts = {};
  let unassigned = 0;
  for (const l of leadRows || []) {
    if (!l.assigned_to) {
      unassigned += 1;
      continue;
    }
    if (!counts[l.assigned_to]) counts[l.assigned_to] = { total: 0, open: 0 };
    counts[l.assigned_to].total += 1;
    if (l.status !== "Won" && l.status !== "Lost") counts[l.assigned_to].open += 1;
  }

  return (
    <>
      <PageHeader title="Team" subtitle="Your BD reps and who's working which leads." />
      <div className="p-8">
        <TeamList
          initialTeam={team || []}
          currentUserId={user.id}
          counts={counts}
          unassigned={unassigned}
        />
      </div>
    </>
  );
}
