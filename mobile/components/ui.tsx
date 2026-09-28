import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      {children}
    </View>
  );
}

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

export function PrimaryButton({ children, loading, className = "", disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl bg-accent px-4 py-3 active:opacity-80 ${
        disabled || loading ? "opacity-50" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#020617" />
      ) : (
        <Text className="text-base font-semibold text-accent-dark">{children}</Text>
      )}
    </Pressable>
  );
}

export function OutlineButton({ children, loading, className = "", disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl border border-border px-4 py-3 active:opacity-70 ${
        disabled || loading ? "opacity-50" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#f8fafc" />
      ) : (
        <Text className="text-base font-medium text-slate-100">{children}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  children,
  active,
  onPress,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-accent bg-accent" : "border-border bg-slate-800/70"
      } ${className}`}
    >
      <Text className={`text-xs font-medium ${active ? "text-accent-dark" : "text-slate-200"}`}>
        {children}
      </Text>
    </Comp>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-4">
      <Text className="text-2xl font-bold text-slate-50">{title}</Text>
      {subtitle && <Text className="mt-1 text-sm text-slate-400">{subtitle}</Text>}
    </View>
  );
}
