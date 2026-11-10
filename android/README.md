# GradeCalc Android app (Trusted Web Activity)

The Play Store app `org.mauriciabad.app.gradecalc` is a thin [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity)
that opens <https://gradecalc.mauri.app> full screen in Chrome. All the app logic lives in the PWA.

| File                | What it is                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `twa-manifest.json` | **Source of truth**: package id, colors, icons, version, Digital Asset Links fingerprints.                |
| `package.json`      | Pins [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap), which sets target SDK and dependencies. |
| `build.sh`          | Regenerates the Android project with Bubblewrap, then builds a signed AAB + APK with Gradle.              |
| `patch-project.js`  | Overrides target SDK / Android Gradle Plugin / Gradle versions in the generated project.                  |
| `bump.js`           | Bumps `appVersionCode` / `appVersionName` (`npm run bump`).                                               |

The Gradle project is generated on every build and is **not** committed (see `.gitignore`).

## Release a new version

1. `cd android && npm run bump` (or `npm run bump -- 5.0.0`). Play rejects a version code it has already seen.
2. Commit and push to `main`.
3. GitHub → Actions → **Android (TWA)** → *Run workflow* → choose a track (`internal` by default).
   Without a Play service account it builds the signed AAB and attaches it to the run, so you can upload it by hand in Play Console.
4. In Play Console, check the release and promote it to production.

## Yearly target SDK update

Google Play requires a newer `targetSdk` every year, usually by **August 31st**. The minimum is API 36 since Aug 2026;
this app already targets **API 37** (Android 17), so it's covered until roughly Aug 2028.

The target SDK is set in `patch-project.js` (`TARGET_SDK`), because Bubblewrap's template lags behind
(Bubblewrap 1.27 generates API 36 with AGP 8.9). To move to a new API level:

1. Set `TARGET_SDK`, and if needed `AGP_VERSION` / `GRADLE_VERSION`, using
   [the minimum AGP per API level](https://developer.android.com/build/releases/about-agp) and
   [the Gradle version AGP requires](https://developer.android.com/build/releases/gradle-plugin).
2. `npm run build` and try the APK on an emulator with that Android version.
3. Follow **Release a new version**.

Dependabot opens a PR when Bubblewrap is released, and the workflow builds it. If a template change breaks one of the
patches, `patch-project.js` fails and names the pattern. Once Bubblewrap's template catches up, delete the patches it no longer needs.

## Local build

Requirements: Node, JDK 17 (`brew install openjdk@17`, Bubblewrap requires exactly 17), Android SDK (`~/Library/Android/sdk`).

```bash
cd android
npm ci
npm run build                     # -> out/gradecalc-<version>-<code>.aab / .apk
adb install out/gradecalc-*.apk   # try it on a phone/emulator
```

`build.sh` signs with the upload key described in `~/.android/gradecalc-signing.properties` if that file exists
(`keystore=`, `alias=`, `password=`, `keyPassword=`). Otherwise it produces unsigned files.

## Signing

- **App signing key:** held by Google (Play App Signing). It never leaves Play.
- **Upload key:** `~/.android/gradecalc-signing.keystore` (alias `gradecalc-keystore-2`, made with PWABuilder in 2024,
  SHA-256 `9D:1D:24:…:21:B4`). Passwords are in `~/.android/gradecalc-signing-key-info.txt`. **Keep both in a password
  manager.** If they're lost, request an upload key reset in Play Console → Protected with Play → Manage Play app signing.

GitHub Actions secrets:

| Secret                      | Value                                                                    |
| --------------------------- | ------------------------------------------------------------------------ |
| `UPLOAD_KEYSTORE_BASE64`    | `base64 -i ~/.android/gradecalc-signing.keystore`                        |
| `UPLOAD_KEYSTORE_PASSWORD`  | key store password                                                       |
| `UPLOAD_KEY_PASSWORD`       | key password                                                             |
| `PLAY_SERVICE_ACCOUNT_JSON` | JSON key of the Play publishing service account (see below)             |

## Digital Asset Links

`static/.well-known/assetlinks.json` (served at <https://gradecalc.mauri.app/.well-known/assetlinks.json>) must list
the SHA-256 fingerprints in `twa-manifest.json` → `fingerprints`. If it doesn't, the app shows a browser URL bar.
Play Console shows the expected JSON under Protected with Play → Manage Play app signing.

## Publishing from GitHub Actions

The workflow uploads with the service account `play-publisher@gradecalc-2018.iam.gserviceaccount.com`
(Google Cloud project `gradecalc-2018`, Google Play Android Developer API enabled). It has no Cloud IAM roles. In
Play Console → Users and permissions it can only release GradeCalc to production and testing tracks.
To rotate its key: `gcloud iam service-accounts keys create key.json --iam-account play-publisher@gradecalc-2018.iam.gserviceaccount.com`,
then `gh secret set PLAY_SERVICE_ACCOUNT_JSON < key.json`, `rm key.json`, and delete the old key in Cloud Console.
