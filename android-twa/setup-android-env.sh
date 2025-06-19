#!/bin/bash

# Android SDK Environment Setup
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Java Home (from Homebrew)
export JAVA_HOME="/opt/homebrew/Cellar/openjdk/24.0.1/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH

echo "Android environment configured!"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "JAVA_HOME: $JAVA_HOME"