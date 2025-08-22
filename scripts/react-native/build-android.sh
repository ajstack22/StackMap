#!/bin/bash

# Set environment to production for console.log stripping
export NODE_ENV=production
echo "Building in production mode (NODE_ENV=$NODE_ENV)"

export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

echo "Using Java from: $JAVA_HOME"
java -version

cd /Users/adamstack/StackMap/StackMap/StackMapNative/android && ./gradlew "$@"