import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { generateId } from "@/lib/id";
import { Card, OutlineButton, PrimaryButton, ScreenTitle } from "@/components/ui";

export default function ReelsUploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickVideo() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow access to your videos to post a reel.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setAsset(result.assets[0]);
    }
  }

  async function handlePost() {
    if (!user || !asset) {
      setError("Choose a video first.");
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const ext = asset.fileName?.split(".").pop() || asset.mimeType?.split("/")[1] || "mp4";
      const path = `${user.id}/${generateId()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(path, arrayBuffer, { contentType: asset.mimeType || "video/mp4" });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("reels")
        .insert({ user_id: user.id, video_path: path, caption: caption || null });

      setUploading(false);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.back();
    } catch {
      setUploading(false);
      setError("Something went wrong uploading that video. Try again.");
    }
  }

  return (
    <ScrollView className="flex-1 bg-base" contentContainerClassName="gap-4 px-5 pb-16 pt-16">
      <ScreenTitle title="Post a reel" subtitle="Share a clip from your session with the community." />

      <Card className="gap-3">
        <OutlineButton onPress={pickVideo}>
          {asset ? "Choose a different video" : "Choose a video"}
        </OutlineButton>
        {asset && (
          <View className="rounded-lg border border-border bg-base p-3">
            <Text className="text-sm text-slate-200">{asset.fileName ?? "Video selected"}</Text>
            {!!asset.duration && (
              <Text className="mt-1 text-xs text-slate-400">{Math.round(asset.duration / 1000)}s</Text>
            )}
          </View>
        )}
      </Card>

      <Card className="gap-2">
        <Text className="text-sm text-slate-300">Caption (optional)</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
          placeholder="Leg day, day 12. Feeling it."
          placeholderTextColor="#64748b"
          className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
        />
      </Card>

      {error && <Text className="text-sm text-rose-400">{error}</Text>}

      <PrimaryButton onPress={handlePost} loading={uploading}>
        Post
      </PrimaryButton>
      <OutlineButton onPress={() => router.back()}>Cancel</OutlineButton>
    </ScrollView>
  );
}
