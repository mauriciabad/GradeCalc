// Patches the Android project that Bubblewrap generates, so it can target a newer
// API level than Bubblewrap's template supports. Run by build.sh after `bubblewrap update`.
//
// Every patch must match. If a Bubblewrap update changes the template, the build fails
// here with a clear message instead of silently building something different.
// Once Bubblewrap's template uses these versions (or newer), delete the matching patches.
const fs = require('fs');
const path = require('path');

// Google Play raises the minimum target API every August (36 since Aug 2026).
const TARGET_SDK = 37;
// API 37 requires AGP >= 9.1.1 (https://developer.android.com/build/releases/about-agp).
const AGP_VERSION = '9.5.1';
// Gradle version required by that AGP (https://developer.android.com/build/releases/gradle-plugin).
const GRADLE_VERSION = '9.9.1';

const patches = {
  'build.gradle': [
    [/com\.android\.tools\.build:gradle:[\d.]+/, `com.android.tools.build:gradle:${AGP_VERSION}`],
    // jcenter() was shut down and removed in Gradle 9.
    [/jcenter\(\)/g, 'mavenCentral()'],
    // Project.buildDir was removed in Gradle 9.
    [/rootProject\.buildDir/, 'rootProject.layout.buildDirectory'],
  ],
  'gradle/wrapper/gradle-wrapper.properties': [
    [/gradle-[\d.]+-bin\.zip/, `gradle-${GRADLE_VERSION}-bin.zip`],
  ],
  'app/build.gradle': [
    [/compileSdkVersion \d+/, `compileSdkVersion ${TARGET_SDK}`],
    [/targetSdkVersion \d+/, `targetSdkVersion ${TARGET_SDK}`],
    // lintOptions was removed in AGP 9.
    [/lintOptions \{/, 'lint {'],
    // AGP 9 no longer accepts Java 8 bytecode targets without warnings; JDK 17 is required anyway.
    [/JavaVersion\.VERSION_1_8/g, 'JavaVersion.VERSION_17'],
  ],
  'gradle.properties': [
    // The template relies on resValue, which AGP 9 disables by default.
    [/android\.useAndroidX=true/, 'android.useAndroidX=true\nandroid.defaults.buildfeatures.resvalues=true'],
  ],
};

for (const [file, replacements] of Object.entries(patches)) {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(content)) {
      console.error(`patch-project.js: "${pattern}" not found in ${file}. Did Bubblewrap change its template?`);
      process.exit(1);
    }
    pattern.lastIndex = 0;
    content = content.replace(pattern, replacement);
  }
  fs.writeFileSync(fullPath, content);
}
console.log(`Patched Android project: targetSdk ${TARGET_SDK}, AGP ${AGP_VERSION}, Gradle ${GRADLE_VERSION}`);
