import { requireWorkoutUser } from "@/lib/workout/auth";
import { ReelFeed, type ReelItem } from "./_components/ReelFeed";

export default async function ReelsPage() {
  const { supabase, user } = await requireWorkoutUser();

  const { data: reels } = await supabase
    .from("reels")
    .select("id, user_id, video_path, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const reelIds = (reels ?? []).map((r) => r.id);
  const userIds = Array.from(new Set((reels ?? []).map((r) => r.user_id)));

  const [{ data: likes }, { data: profiles }] = await Promise.all([
    reelIds.length
      ? supabase.from("reel_likes").select("reel_id, user_id").in("reel_id", reelIds)
      : Promise.resolve({ data: [] as { reel_id: string; user_id: string }[] }),
    userIds.length
      ? supabase.from("workout_profiles").select("user_id, identity_statement").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; identity_statement: string | null }[] }),
  ]);

  const identityByUser = new Map((profiles ?? []).map((p) => [p.user_id, p.identity_statement]));

  const items: ReelItem[] = (reels ?? []).map((reel) => {
    const { data: publicUrl } = supabase.storage.from("reels").getPublicUrl(reel.video_path);
    const reelLikes = (likes ?? []).filter((l) => l.reel_id === reel.id);
    return {
      id: reel.id,
      videoUrl: publicUrl.publicUrl,
      caption: reel.caption,
      createdAt: reel.created_at,
      authorTag: reel.user_id === user.id ? "You" : identityByUser.get(reel.user_id) ?? "OneAtom member",
      likeCount: reelLikes.length,
      likedByMe: reelLikes.some((l) => l.user_id === user.id),
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reels</h1>
        <p className="mt-1 text-sm text-slate-400">
          Short clips from the community — post your session, cheer someone else's.
        </p>
      </div>
      <ReelFeed userId={user.id} initialItems={items} />
    </div>
  );
}
