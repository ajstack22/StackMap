#!/bin/bash
# Script to help modernize ES5 code to ES6+
# Requires Android 6+ (API 23+)

echo "🚀 StackMap ES6 Modernization Script"
echo "======================================"
echo "This will help convert ES5 code to modern JavaScript"
echo "Target: Android 6+ (API 23+), iOS 10+"
echo ""

# Check if we're in the refactor directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Run this script from the refactor directory"
    exit 1
fi

# Create backup
echo "📦 Creating backup..."
mkdir -p backups/es5-backup-$(date +%Y%m%d-%H%M%S)
cp -r js backups/es5-backup-$(date +%Y%m%d-%H%M%S)/

echo ""
echo "🔍 Current ES5 patterns found:"
echo "------------------------------"

# Count var declarations
VAR_COUNT=$(grep -r "var " js/*.js 2>/dev/null | grep -v "//.*var" | wc -l)
echo "var declarations: $VAR_COUNT"

# Count function expressions
FUNC_COUNT=$(grep -r "function(" js/*.js 2>/dev/null | wc -l)
echo "function expressions: $FUNC_COUNT"

# Count string concatenations
CONCAT_COUNT=$(grep -r "' + .* + '" js/*.js 2>/dev/null | wc -l)
echo "string concatenations: $CONCAT_COUNT"

# Count Array.prototype.slice.call
SLICE_COUNT=$(grep -r "Array.prototype.slice.call" js/*.js 2>/dev/null | wc -l)
echo "Array.prototype.slice.call: $SLICE_COUNT"

echo ""
echo "📝 Suggested conversions:"
echo "------------------------"
echo "1. var → const/let"
echo "2. function() {} → () => {}"
echo "3. 'text' + var + 'text' → \`text\${var}text\`"
echo "4. Array.prototype.slice.call → [...args]"
echo "5. Remove polyfills (Array.from, includes, etc.)"

echo ""
echo "🛠️  Tools to use:"
echo "----------------"
echo "1. lebab - ES5 to ES6 converter"
echo "   npm install -g lebab"
echo "   lebab js/app.js -o js/app.js --transform arrow,let,template"
echo ""
echo "2. Manual review for:"
echo "   - Classes (complex prototypes)"
echo "   - Async/await (callbacks)"
echo "   - Destructuring opportunities"
echo ""
echo "3. Test on Android 6+ device or emulator"

echo ""
echo "⚠️  Breaking changes to review:"
echo "-------------------------------"
echo "1. 'this' binding in arrow functions"
echo "2. const immutability"
echo "3. Block scope vs function scope"
echo "4. Remove Android 5 specific workarounds"

echo ""
echo "Would you like to:"
echo "1. Install lebab and run automated conversion"
echo "2. See detailed file-by-file analysis"
echo "3. Exit and convert manually"
echo ""
read -p "Choose (1-3): " choice

case $choice in
    1)
        echo "Installing lebab..."
        npm install -g lebab
        echo "Running conversions..."
        # Safe transforms that won't break anything
        for file in js/*.js; do
            echo "Converting $file..."
            lebab "$file" -o "$file" --transform let,template,arrow-return,includes,default-param
        done
        echo "✅ Basic conversions complete! Review the changes and test thoroughly."
        ;;
    2)
        echo "Generating detailed analysis..."
        for file in js/*.js; do
            echo ""
            echo "📄 $file:"
            echo "  vars: $(grep -c "var " "$file" 2>/dev/null || echo 0)"
            echo "  functions: $(grep -c "function(" "$file" 2>/dev/null || echo 0)"
            echo "  concatenations: $(grep -c "' + " "$file" 2>/dev/null || echo 0)"
        done
        ;;
    3)
        echo "Manual conversion selected. Good luck!"
        ;;
esac

echo ""
echo "📚 Next steps:"
echo "1. Update package.json browserlist to exclude Android 5"
echo "2. Remove ES5 polyfills from HTML"
echo "3. Test on real Android 6+ devices"
echo "4. Update documentation to reflect new requirements"