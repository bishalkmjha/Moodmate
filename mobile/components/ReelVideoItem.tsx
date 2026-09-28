import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import type { ReelWithMeta } from "@/lib/workout/reels";

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

export function ReelVideoItem({
  reel,
  height,
  isActive,
  onToggleLike,
}: {
  reel: ReelWithMeta;
  height: number;
  isActive: boolean;
  onToggleLike: (reel: ReelWithMeta) => void;
}) {
  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive, player]);

  return (
    <View style={{ height }} className="w-full items-center justify-center bg-black">
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls={false}
      />

      <View className="pointer-events-none absolute inset-x-0 bottom-0 gap-1 bg-black/50 p-4 pb-8">
        <Text className="text-xs font-semibold text-accent">{reel.authorTag}</Text>
        {reel.caption && <Text className="text-sm text-slate-100">{reel.caption}</Text>}
        <Text className="text-xs text-slate-400">{timeAgo(reel.createdAt)}</Text>
      </View>

      <View className="absolute bottom-10 right-3 items-center gap-1">
        <Pressable
          onPress={() => onToggleLike(reel)}
          className={`h-11 w-11 items-center justify-center rounded-full border ${
            reel.likedByMe ? "border-accent bg-accent/20" : "border-white/30 bg-black/40"
          }`}
        >
          <Text className={`text-lg ${reel.likedByMe ? "text-accent" : "text-white"}`}>
            {reel.likedByMe ? "♥" : "♡"}
          </Text>
        </Pressable>
        <Text className="text-xs font-medium text-white">{reel.likeCount}</Text>
      </View>
    </View>
  );
}
