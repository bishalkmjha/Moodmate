"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReelItem } from "./ReelFeed";

export function UploadReelSheet({
  userId,
  onClose,
  onPosted,
}: {
  userId: string;
  onClose: () => void;
  onPosted: (reel: ReelItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePost() {
    if (!file) {
      setError("Choose a video first.");
      return;
    }
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("reels")
      .upload(path, file, { contentType: file.type || "video/mp4" });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("reels")
      .insert({ user_id: userId, video_path: path, caption: caption || null })
      .select("id, created_at")
      .single();

    setUploading(false);

    if (insertError || !inserted) {
      setError(insertError?.message ?? "Couldn't save that reel.");
      return;
    }

    const { data: publicUrl } = supabase.storage.from("reels").getPublicUrl(path);

    onPosted({
      id: inserted.id,
      videoUrl: publicUrl.publicUrl,
      caption: caption || null,
      createdAt: inserted.created_at,
      authorTag: "You",
      likeCount: 0,
      likedByMe: false,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="workout-card w-full max-w-sm space-y-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Post a reel</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-100">
            ✕
          </button>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Video (max 100MB)</span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Caption (optional)</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Leg day, day 12. Feeling it."
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </label>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          onClick={handlePost}
          disabled={uploading}
          className="workout-btn-primary w-full py-2.5 disabled:opacity-50"
        >
          {uploading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
