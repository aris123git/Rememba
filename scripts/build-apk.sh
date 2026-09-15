#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
export PATH="/opt/flutter/bin:$ANDROID_HOME/platform-tools:$PATH"
cd "$ROOT/apps/mobile"
flutter pub get
flutter test
flutter build apk --release
echo "APK: $ROOT/apps/mobile/build/app/outputs/flutter-apk/app-release.apk"
