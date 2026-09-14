import { redirect } from "next/navigation";
import { requireWorkoutUser } from "@/lib/workout/auth";
import { ProfileForm } from "../_components/ProfileForm";

export default async function ProfilePage() {
  const { supabase, user } = await requireWorkoutUser();

  const { data: profile } = await supabase
    .from("workout_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/workout/onboarding");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="mt-1 text-sm text-slate-400">{user.email}</p>
      </div>
      <ProfileForm
        userId={user.id}
        initialProfile={profile}
        submitLabel="Save changes"
        redirectTo="/workout/profile"
      />
    </div>
  );
}
