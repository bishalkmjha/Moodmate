import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import { PrimaryButton, Card } from "@/components/ui";

type Mode = "sign_in" | "sign_up" | "verify_otp";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendVerificationCode(targetEmail: string) {
    await supabase.auth.resend({ type: "signup", email: targetEmail });
    setPendingEmail(targetEmail);
    setOtp("");
    setMode("verify_otp");
    setInfo("We sent a 6-digit code to your email. Enter it below to verify your account.");
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === "verify_otp") {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: "signup",
      });
      setLoading(false);
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      router.replace("/onboarding");
      return;
    }

    if (mode === "sign_up") {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setPendingEmail(email);
        setOtp("");
        setMode("verify_otp");
        setInfo("Account created. We sent a 6-digit code to your email — enter it below to verify.");
        return;
      }
      router.replace("/onboarding");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        await sendVerificationCode(email);
        return;
      }
      setError(signInError.message);
      return;
    }
    router.replace("/");
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setInfo("Sent a new code.");
  }

  if (mode === "verify_otp") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-base"
      >
        <ScrollView contentContainerClassName="flex-1 items-center justify-center px-6">
          <View className="mb-8 items-center">
            <Text className="text-2xl font-bold text-slate-50">Check your email</Text>
            <Text className="mt-2 text-center text-sm text-slate-400">
              Enter the 6-digit code we sent to {pendingEmail}.
            </Text>
          </View>

          <Card className="w-full gap-4">
            <View>
              <Text className="mb-1 text-sm font-medium text-slate-200">Verification code</Text>
              <TextInput
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="sms-otp"
                placeholder="000000"
                placeholderTextColor="#64748b"
                className="rounded-lg border border-border bg-base px-3 py-2.5 text-center text-lg tracking-[8px] text-slate-100"
              />
            </View>

            {error && <Text className="text-sm text-rose-400">{error}</Text>}
            {info && <Text className="text-sm text-emerald-400">{info}</Text>}

            <PrimaryButton onPress={handleSubmit} loading={loading} disabled={otp.length !== 6}>
              Verify
            </PrimaryButton>
          </Card>

          <View className="mt-5 flex-row gap-6">
            <Text className="text-sm text-slate-400" onPress={handleResend}>
              Resend code
            </Text>
            <Text
              className="text-sm text-slate-400"
              onPress={() => {
                setMode("sign_in");
                setError(null);
                setInfo(null);
              }}
            >
              Back to sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
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
            setInfo(null);
          }}
        >
          {mode === "sign_in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
