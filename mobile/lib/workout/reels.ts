import { supabase } from "@/lib/supabase/client";

export interface ReelWithMeta {
  id: string;
  videoUrl: string;
  caption: string | null;
  createdAt: string;
  authorTag: string;
  likeCount: number;
  likedByMe: boolean;
}

export async function fetchReels(currentUserId: string): Promise<ReelWithMeta[]> {
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

  return (reels ?? []).map((reel) => {
    const { data: publicUrl } = supabase.storage.from("reels").getPublicUrl(reel.video_path);
    const reelLikes = (likes ?? []).filter((l) => l.reel_id === reel.id);
    return {
      id: reel.id,
      videoUrl: publicUrl.publicUrl,
      caption: reel.caption,
      createdAt: reel.created_at,
      authorTag:
        reel.user_id === currentUserId ? "You" : identityByUser.get(reel.user_id) ?? "OneAtom member",
      likeCount: reelLikes.length,
      likedByMe: reelLikes.some((l) => l.user_id === currentUserId),
    };
  });
}

export async function toggleReelLike(reelId: string, userId: string, nextLiked: boolean) {
  if (nextLiked) {
    await supabase.from("reel_likes").insert({ reel_id: reelId, user_id: userId });
  } else {
    await supabase.from("reel_likes").delete().eq("reel_id", reelId).eq("user_id", userId);
  }
}
