#!/bin/bash
# Deploy share API to both qual and prod environments

echo "Deploying StackMap Share API..."

# Files to deploy (excluding config.php)
FILES=(
    "access_share.php"
    "create_share.php"
    "database.php"
    "share_schema.sql"
    "README.md"
    "config.example.php"
)

# Check if we're in the right directory
if [[ ! -f "create_share.php" ]]; then
    echo "Error: Must run from api/sync directory"
    exit 1
fi

# Deploy to qual
echo "Deploying to qual environment..."
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  Copying $file to /public_html/qual/api/sync/"
        cp "$file" "/public_html/qual/api/sync/"
    fi
done

# Deploy to prod
echo "Deploying to prod environment..."
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  Copying $file to /public_html/api/sync/"
        cp "$file" "/public_html/api/sync/"
    fi
done

echo "Deployment complete!"
echo ""
echo "Remember to:"
echo "1. Create/update config.php in each environment with proper database credentials"
echo "2. Run share_schema.sql in each database if not already done"
echo "3. Set proper file permissions (chmod 644 *.php)"