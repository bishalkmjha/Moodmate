# OneAtom — mobile app

A native Android/iOS app (Expo + React Native) for the same adaptive full-body
workout product as the web app in the repo root: onboarding that captures body
metrics and goals, a BMI/level/equipment/performance-aware adaptive engine, a
50-exercise library, a daily session runner, Atomic Habits habit building, and
a 5AM Club 20/20/20 morning routine tracker. It talks to the **same Supabase
project** as the web app, so an account and workout data are shared between
both.

## Stack

- Expo SDK 57, Expo Router (file-based navigation), TypeScript
- NativeWind (Tailwind CSS for React Native) for styling
- `@supabase/supabase-js` with AsyncStorage-backed session persistence

## Run it locally

```bash
cd mobile
npm install
npm run android   # or: npm run ios / npm run web
```

`.env` already has this project's Supabase URL and anon key (same values as
the web app's `.env.local`), so sign-up/login/onboarding work immediately —
**once the database migrations in `../supabase/migrations` have been applied**
to that Supabase project (see the root README/PR notes; this hasn't been
pushed to the live database automatically).

You'll need either:
- **Expo Go** (fastest): scan the QR code from `npm start` — note Expo Go
  supports most but not all native modules used here (gesture-handler,
  reanimated/worklets, secure-store are all Expo Go-compatible), or
- **A dev build**: `npx expo run:android` (requires Android Studio) or an EAS
  development build (see below) for full native module support.

## Building an Android app to install/test (no Play Store yet)

This produces an installable `.apk` you can side-load onto a device or share,
using Expo's free cloud build service (EAS Build) instead of a local Android
SDK setup:

```bash
npm install -g eas-cli
eas login                 # your own Expo account (free)
eas build:configure       # links this project to your Expo account, writes a projectId into app.json
eas build --platform android --profile preview
```

EAS will build in the cloud and give you a download link for the `.apk`.

## Publishing to Google Play

This needs **your own** Google Play Developer account — it's a real published
app under your name/company, so it can't be created on your behalf:

1. **Create a Google Play Developer account**: https://play.google.com/console/signup
   ($25 one-time registration fee)
2. **Create the app** in Play Console (App name, default language, app/game,
   free/paid).
3. **Build a release bundle**:
   ```bash
   eas build --platform android --profile production
   ```
   This produces a signed `.aab` (Android App Bundle) — EAS generates and
   manages the upload keystore for you automatically the first time.
4. **Submit it**, either via the Play Console UI (upload the `.aab` under
   Production → Create release) or directly from the CLI:
   ```bash
   eas submit --platform android --latest
   ```
   (`eas submit` needs a Google Play service account JSON key — Play Console
   → Setup → API access → create service account — the CLI walks you through
   linking it.)
5. **Fill in the Play Console listing**: screenshots, feature graphic, short/
   full description, privacy policy URL (required — you'll need to host one,
   since this app collects account/health-adjacent data), content rating
   questionnaire, and data safety form (declare: account info, health/fitness
   data, stored via Supabase).
6. **Submit for review.** Google's review typically takes a few hours to a
   few days for a new app.

### Before your first production submission

- Replace the placeholder icons/splash in `assets/` (currently Expo defaults)
  with real branding.
- Double check `app.json`'s `android.package` (`com.moodmate.oneatom`) is
  the identifier you want — it **cannot be changed** after your first Play
  Store upload.
- Apply the Supabase migrations in `../supabase/migrations` to your project's
  database if you haven't already (both apps depend on them).
