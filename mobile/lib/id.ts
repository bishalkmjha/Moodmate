// React Native's JS runtime (Hermes) has no global `crypto.randomUUID`, so this
// generates a unique-enough id for things like storage filenames — not a
// cryptographic token.
export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
