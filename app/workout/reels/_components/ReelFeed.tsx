"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadReelSheet } from "./UploadReelSheet";

export interface ReelItem {
  id: string;
  videoUrl: string;
  caption: string | null;
  createdAt: string;
  authorTag: string;
  likeCount: number;
  likedByMe: boolean;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [52, "w"],
  ];
  let value = seconds;
  let label = "s";
  for (const [size, unit] of units) {
    if (value < size) {
      label = unit;
      break;
    }
    value = Math.floor(value / size);
    label = unit;
  }
  return `${value}${label} ago`;
}

export function ReelFeed({ userId, initialItems }: { userId: string; initialItems: ReelItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [showUpload, setShowUpload] = useState(false);
  const [mutedId, setMutedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { root: container, threshold: [0, 0.6, 1] },
    );

    videoRefs.current.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [items]);

  async function toggleLike(reel: ReelItem) {
    const supabase = createClient();
    const nextLiked = !reel.likedByMe;
    setItems((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, likedByMe: nextLiked, likeCount: r.likeCount + (nextLiked ? 1 : -1) }
          : r,
      ),
    );

    if (nextLiked) {
      await supabase.from("reel_likes").insert({ reel_id: reel.id, user_id: userId });
    } else {
      await supabase.from("reel_likes").delete().eq("reel_id", reel.id).eq("user_id", userId);
    }
  }

  function toggleMute(id: string) {
    setMutedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        ref={containerRef}
        className="h-[72vh] snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-2xl border border-slate-800 bg-black sm:h-[78vh]"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((reel) => {
          const muted = mutedId !== reel.id;
          return (
            <div key={reel.id} className="relative flex h-full w-full snap-start items-center justify-center">
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(reel.id, el);
                  else videoRefs.current.delete(reel.id);
                }}
                src={reel.videoUrl}
                muted={muted}
                loop
                playsInline
                preload="metadata"
                onClick={() => toggleMute(reel.id)}
                className="h-full w-full cursor-pointer object-contain"
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pb-6">
                <p className="pointer-events-auto text-xs font-semibold text-amber-400">{reel.authorTag}</p>
                {reel.caption && <p className="mt-1 text-sm text-slate-100">{reel.caption}</p>}
                <p className="mt-1 text-xs text-slate-400">{timeAgo(reel.createdAt)}</p>
              </div>

              <div className="pointer-events-auto absolute bottom-8 right-3 flex flex-col items-center gap-1">
                <button
                  onClick={() => toggleLike(reel)}
                  aria-pressed={reel.likedByMe}
                  aria-label={reel.likedByMe ? "Unlike" : "Like"}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg backdrop-blur ${
                    reel.likedByMe
                      ? "border-amber-500 bg-amber-500/20 text-amber-400"
                      : "border-white/20 bg-black/40 text-white"
                  }`}
                >
                  {reel.likedByMe ? "♥" : "♡"}
                </button>
                <span className="text-xs font-medium text-white">{reel.likeCount}</span>
              </div>

              {muted && (
                <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white">
                  tap to unmute
                </span>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <p className="text-lg font-semibold text-white">No reels yet</p>
            <p className="text-sm text-slate-400">Post the first clip and get the feed moving.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowUpload(true)}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30"
      >
        + Post a reel
      </button>

      {showUpload && (
        <UploadReelSheet
          userId={userId}
          onClose={() => setShowUpload(false)}
          onPosted={(reel) => {
            setItems((prev) => [reel, ...prev]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}
