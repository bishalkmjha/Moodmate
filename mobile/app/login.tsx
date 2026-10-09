import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import { PrimaryButton, Card } from "@/components/ui";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    if (email) {
      await supabase.auth.updateUser({ data: { contact_email: email } });
    }

    setLoading(false);
    router.replace("/onboarding");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-base"
    >
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-6">
        <View className="mb-8 items-center">
          <Text className="text-2xl font-bold text-slate-50">Start your streak</Text>
          <Text className="mt-2 text-center text-sm text-slate-400">
            A full-body plan that adapts to you, plus the habits to keep showing up.
          </Text>
        </View>

        <Card className="w-full gap-4">
          <View>
            <Text className="mb-1 text-sm font-medium text-slate-200">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
            />
            <Text className="mt-1 text-xs text-slate-500">
              Just for updates — no password, no verification needed.
            </Text>
          </View>

          {error && <Text className="text-sm text-rose-400">{error}</Text>}

          <PrimaryButton onPress={handleSubmit} loading={loading}>
            Continue
          </PrimaryButton>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
