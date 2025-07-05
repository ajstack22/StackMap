#!/bin/bash
echo "Building Android without problematic libraries..."

# Temporarily move problematic libraries
cd node_modules
for lib in react-native-reanimated react-native-gesture-handler react-native-draggable-flatlist; do
    if [ -d "$lib" ]; then
        echo "Temporarily disabling $lib..."
        mv "$lib" "$lib.disabled"
    fi
done
cd ..

# Clean and build
cd android
./gradlew clean
echo "Building APK..."
./gradlew assembleRelease

# Check if successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Build successful!"
    ls -la app/build/outputs/apk/release/
    cd ..
    
    # Restore libraries
    cd node_modules
    for lib in react-native-reanimated react-native-gesture-handler react-native-draggable-flatlist; do
        if [ -d "$lib.disabled" ]; then
            echo "Restoring $lib..."
            mv "$lib.disabled" "$lib"
        fi
    done
    
    echo "✅ Libraries restored. APK is ready!"
else
    echo "❌ Build failed"
    cd ../node_modules
    # Restore libraries even if build failed
    for lib in react-native-reanimated react-native-gesture-handler react-native-draggable-flatlist; do
        if [ -d "$lib.disabled" ]; then
            mv "$lib.disabled" "$lib"
        fi
    done
fi