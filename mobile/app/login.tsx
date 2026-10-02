import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import { PrimaryButton, Card } from "@/components/ui";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    if (mode === "sign_up") {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.replace("/onboarding");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-base"
    >
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-6">
        <View className="mb-8 items-center">
          <Text className="text-2xl font-bold text-slate-50">
            {mode === "sign_in" ? "Welcome back" : "Start your streak"}
          </Text>
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
          </View>
          <View>
            <Text className="mb-1 text-sm font-medium text-slate-200">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor="#64748b"
              className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
            />
          </View>

          {error && <Text className="text-sm text-rose-400">{error}</Text>}

          <PrimaryButton onPress={handleSubmit} loading={loading}>
            {mode === "sign_in" ? "Sign in" : "Create account"}
          </PrimaryButton>
        </Card>

        <Text
          className="mt-5 text-sm text-slate-400"
          onPress={() => {
            setMode(mode === "sign_in" ? "sign_up" : "sign_in");
            setError(null);
          }}
        >
          {mode === "sign_in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
