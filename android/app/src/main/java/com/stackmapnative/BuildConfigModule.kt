package com.stackmapnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * Native module to expose BuildConfig constants to React Native JavaScript
 * This allows JavaScript to read build-time configuration like BUILD_TYPE_ENV
 */
class BuildConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BuildConfigModule"
    }

    override fun getConstants(): Map<String, Any> {
        val constants = HashMap<String, Any>()
        // Expose BUILD_TYPE_ENV from Gradle flavor configuration
        constants["BUILD_TYPE_ENV"] = BuildConfig.BUILD_TYPE_ENV
        return constants
    }
}
