#!/usr/bin/env bash
# Builds the GradeCalc Trusted Web Activity.
#
#   1. Bubblewrap regenerates the Android project from twa-manifest.json
#      (the generated project is NOT committed; twa-manifest.json is the source of truth),
#      then patch-project.js applies the target SDK / build tool overrides.
#   2. Gradle builds a release AAB (for Play) and APK (for sideloading/testing).
#
# Signing (optional — without it you get unsigned artifacts, useful for CI checks):
#   UPLOAD_KEYSTORE_PATH       path to the upload keystore
#   UPLOAD_KEYSTORE_PASSWORD   keystore password
#   UPLOAD_KEY_ALIAS           key alias
#   UPLOAD_KEY_PASSWORD        key password (defaults to the keystore password)
# If those aren't set and ~/.android/gradecalc-signing.properties exists, it's used.
#
# Output: android/out/gradecalc-<versionName>-<versionCode>.{aab,apk}
set -euo pipefail
cd "$(dirname "$0")"

# ---- Toolchain ---------------------------------------------------------------
if [[ -z "${JAVA_HOME:-}" && -d /opt/homebrew/opt/openjdk@17 ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
fi
if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Library/Android/sdk" ]]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
: "${JAVA_HOME:?Set JAVA_HOME to a JDK 17 install}"
: "${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK}"

# Bubblewrap refuses to run (it prompts) without a config file.
if [[ ! -s "$HOME/.bubblewrap/config.json" ]] || grep -q '"jdkPath":""' "$HOME/.bubblewrap/config.json"; then
  mkdir -p "$HOME/.bubblewrap"
  printf '{"jdkPath":"%s","androidSdkPath":"%s"}\n' "$JAVA_HOME" "$ANDROID_HOME" > "$HOME/.bubblewrap/config.json"
fi

# ---- 1. Generate the Android project -----------------------------------------
npx --no-install bubblewrap update --skipVersionUpgrade </dev/null
node patch-project.js   # target SDK / AGP / Gradle overrides, see that file
echo "sdk.dir=$ANDROID_HOME" > local.properties

# ---- 2. Build ----------------------------------------------------------------
LOCAL_PROPS="$HOME/.android/gradecalc-signing.properties"
if [[ -z "${UPLOAD_KEYSTORE_PASSWORD:-}" && -f "$LOCAL_PROPS" ]]; then
  UPLOAD_KEYSTORE_PATH=$(sed -n 's/^keystore=//p' "$LOCAL_PROPS")
  UPLOAD_KEYSTORE_PASSWORD=$(sed -n 's/^password=//p' "$LOCAL_PROPS")
  UPLOAD_KEY_ALIAS=$(sed -n 's/^alias=//p' "$LOCAL_PROPS")
  UPLOAD_KEY_PASSWORD=$(sed -n 's/^keyPassword=//p' "$LOCAL_PROPS")
fi

GRADLE_ARGS=(--no-daemon bundleRelease assembleRelease)
if [[ -n "${UPLOAD_KEYSTORE_PASSWORD:-}" ]]; then
  echo "Signing with upload key: ${UPLOAD_KEYSTORE_PATH}"
  GRADLE_ARGS+=(
    "-Pandroid.injected.signing.store.file=$(cd "$(dirname "$UPLOAD_KEYSTORE_PATH")" && pwd)/$(basename "$UPLOAD_KEYSTORE_PATH")"
    "-Pandroid.injected.signing.store.password=$UPLOAD_KEYSTORE_PASSWORD"
    "-Pandroid.injected.signing.key.alias=${UPLOAD_KEY_ALIAS:?Set UPLOAD_KEY_ALIAS}"
    "-Pandroid.injected.signing.key.password=${UPLOAD_KEY_PASSWORD:-$UPLOAD_KEYSTORE_PASSWORD}"
  )
  SUFFIX=""
else
  echo "No signing key configured: building UNSIGNED artifacts."
  SUFFIX="-unsigned"
fi
./gradlew "${GRADLE_ARGS[@]}"

# ---- Collect outputs ---------------------------------------------------------
VERSION_NAME=$(node -p 'require("./twa-manifest.json").appVersionName')
VERSION_CODE=$(node -p 'require("./twa-manifest.json").appVersionCode')
NAME="gradecalc-${VERSION_NAME}-${VERSION_CODE}${SUFFIX}"
mkdir -p out
cp app/build/outputs/bundle/release/app-release.aab "out/${NAME}.aab"
cp "$(ls app/build/outputs/apk/release/*.apk | head -1)" "out/${NAME}.apk"
echo "Built:"; ls -la out/"${NAME}".*
