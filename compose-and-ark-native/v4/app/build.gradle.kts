plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("kotlin-parcelize")
}

android {
    namespace = "com.eivra.studio.v2"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.eivra.studio.v2"
        minSdk = 29
        targetSdk = 36
        versionCode = 41
        versionName = "0.4.1"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables { useSupportLibrary = true }
    }
    val laneRoots = listOf("ledger", "strategy", "insights", "platform").map { rootProject.file("lanes/$it") }
    sourceSets {
        getByName("main") { laneRoots.forEach { java.srcDir(it.resolve("kotlin")); assets.srcDir(it.resolve("assets")); res.srcDir(it.resolve("res")) } }
        getByName("test") { laneRoots.forEach { java.srcDir(it.resolve("test")); resources.srcDir(it.resolve("testResources")) } }
        getByName("androidTest") { laneRoots.forEach { java.srcDir(it.resolve("androidTest")); assets.srcDir(it.resolve("testAssets")) } }
    }
    buildTypes {
        debug {
            // Install the tested checkpoint without replacing I01/I02 or touching their ledgers.
            // A different debug signer cannot update v4.1. Opt into an isolated install in that case.
            applicationIdSuffix = if (providers.gradleProperty("eivraArkSideBySide").orNull == "true") ".v41.arkicon" else ".v41"
            isCrunchPngs = false // The launcher uses the exact original HarmonyOS PNG.
            versionNameSuffix = "-preview"
        }
        release {
            isCrunchPngs = false
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }
    buildFeatures { compose = true }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
}

dependencies {
    implementation(libs.androidx.core)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons)
    implementation(libs.androidx.lifecycle)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.navigation)
    implementation(libs.androidx.datastore)
    implementation(libs.quickjs.android)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
    testImplementation(libs.junit)
    testImplementation(libs.json)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso)
    androidTestImplementation(libs.uiautomator)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
}
