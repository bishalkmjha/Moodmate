import { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, Text, View, type ViewToken } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useAuth } from "@/lib/auth-provider";
import { fetchReels, toggleReelLike, type ReelWithMeta } from "@/lib/workout/reels";
import { ReelVideoItem } from "@/components/ReelVideoItem";
import { ScreenTitle } from "@/components/ui";

const TAB_BAR_HEIGHT = 78;
const HEADER_HEIGHT = 96;

export default function ReelsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<ReelWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screenFocused, setScreenFocused] = useState(true);

  const listHeight = Dimensions.get("window").height - TAB_BAR_HEIGHT - HEADER_HEIGHT;

  const load = useCallback(async () => {
    if (!user) return;
    const reels = await fetchReels(user.id);
    setItems(reels);
    setLoading(false);
    setActiveId((current) => current ?? reels[0]?.id ?? null);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      void load();
      return () => setScreenFocused(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item) setActiveId((first.item as ReelWithMeta).id);
  }).current;

  async function handleToggleLike(reel: ReelWithMeta) {
    if (!user) return;
    const nextLiked = !reel.likedByMe;
    setItems((prev) =>
      prev.map((r) =>
        r.id === reel.id ? { ...r, likedByMe: nextLiked, likeCount: r.likeCount + (nextLiked ? 1 : -1) } : r,
      ),
    );
    await toggleReelLike(reel.id, user.id, nextLiked);
  }

  return (
    <View className="flex-1 bg-base pt-16">
      <View className="px-5 pb-3">
        <ScreenTitle title="Reels" subtitle="Short clips from the community — post yours, cheer someone else's." />
      </View>

      {!loading && items.length === 0 && (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-lg font-semibold text-slate-50">No reels yet</Text>
          <Text className="text-center text-sm text-slate-400">Post the first clip and get the feed moving.</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={listHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: listHeight, offset: listHeight * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        renderItem={({ item }) => (
          <ReelVideoItem
            reel={item}
            height={listHeight}
            isActive={screenFocused && item.id === activeId}
            onToggleLike={handleToggleLike}
          />
        )}
      />

      <View pointerEvents="box-none" className="absolute inset-x-0 bottom-6 items-center">
        <Pressable
          onPress={() => router.push("/reels-upload")}
          className="rounded-full bg-accent px-5 py-3 shadow-lg"
        >
          <Text className="text-sm font-semibold text-accent-dark">+ Post a reel</Text>
        </Pressable>
      </View>
    </View>
  );
}
