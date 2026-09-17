import { ScrollView } from "react-native";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { ProfileForm } from "@/components/ProfileForm";
import { OutlineButton, ScreenTitle } from "@/components/ui";

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();

  if (!user || !profile) return null;

  return (
    <ScrollView className="flex-1 bg-base" contentContainerClassName="gap-4 px-5 pb-16 pt-16">
      <ScreenTitle title="Your profile" subtitle={user.email ?? undefined} />
      <ProfileForm
        userId={user.id}
        initialProfile={profile}
        submitLabel="Save changes"
        onSaved={refreshProfile}
      />
      <OutlineButton onPress={() => supabase.auth.signOut()}>Sign out</OutlineButton>
    </ScrollView>
  );
}
