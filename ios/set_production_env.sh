#!/bin/bash

# This script sets NODE_ENV=production for iOS release builds
# It should be added as a Build Phase in Xcode

echo "Setting NODE_ENV based on configuration..."

if [ "${CONFIGURATION}" == "Release" ]; then
    export NODE_ENV=production
    echo "export NODE_ENV=production" > "${SRCROOT}/../node_modules/react-native/scripts/.packager.env"
    echo "NODE_ENV set to production for Release build"
else
    export NODE_ENV=development
    echo "export NODE_ENV=development" > "${SRCROOT}/../node_modules/react-native/scripts/.packager.env"
    echo "NODE_ENV set to development for Debug build"
fi