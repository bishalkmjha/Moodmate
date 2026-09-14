import { requireWorkoutUser } from "@/lib/workout/auth";
import { ProfileForm } from "../_components/ProfileForm";

export default async function OnboardingPage() {
  const { user } = await requireWorkoutUser();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Let&apos;s build your plan</h1>
        <p className="mt-1 text-sm text-slate-400">
          Two minutes of setup, then an adaptive full-body routine that fits your body today.
        </p>
      </div>
      <ProfileForm userId={user.id} submitLabel="Build my adaptive plan" redirectTo="/workout" />
    </div>
  );
}
