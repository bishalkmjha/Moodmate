import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-provider";
import { ProfileForm } from "@/components/ProfileForm";
import { ScreenTitle } from "@/components/ui";

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-base" contentContainerClassName="px-5 pb-16 pt-16">
      <ScreenTitle
        title="Let's build your plan"
        subtitle="Two minutes of setup, then an adaptive full-body routine that fits your body today."
      />
      <ProfileForm
        userId={user.id}
        submitLabel="Build my adaptive plan"
        onSaved={async () => {
          await refreshProfile();
          router.replace("/(tabs)");
        }}
      />
    </ScrollView>
  );
}
