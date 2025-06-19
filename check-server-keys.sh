#!/bin/bash
# Run these commands on your server via VS Code SSH

echo "=== Checking SSH Key Setup on Server ==="
echo ""

echo "1. Checking if .ssh directory exists:"
ls -la ~/.ssh
echo ""

echo "2. Checking authorized_keys file:"
if [ -f ~/.ssh/authorized_keys ]; then
    echo "File exists with permissions:"
    ls -la ~/.ssh/authorized_keys
    echo ""
    echo "Number of keys in file:"
    wc -l ~/.ssh/authorized_keys
    echo ""
    echo "Keys in authorized_keys:"
    cat ~/.ssh/authorized_keys | while read line; do
        if [[ $line == ssh-* ]]; then
            # Show key type and last 50 chars of the key
            key_type=$(echo $line | awk '{print $1}')
            key_end=$(echo $line | awk '{print $2}' | tail -c 50)
            comment=$(echo $line | awk '{print $3}')
            echo "  - Type: $key_type, End: ...$key_end, Comment: $comment"
        fi
    done
else
    echo "WARNING: authorized_keys file does not exist!"
    echo "This explains why SSH key authentication isn't working."
fi
echo ""

echo "3. Checking for our specific key:"
if [ -f ~/.ssh/authorized_keys ]; then
    if grep -q "adamstack@stackmap-cpanel" ~/.ssh/authorized_keys; then
        echo "✓ Found key with comment 'adamstack@stackmap-cpanel'"
    else
        echo "✗ Key with comment 'adamstack@stackmap-cpanel' NOT found"
        echo ""
        echo "Looking for any key ending with our fingerprint:"
        if grep -q "oYxhH+w==" ~/.ssh/authorized_keys; then
            echo "✓ Found a key matching our fingerprint"
        else
            echo "✗ Our key is not in authorized_keys"
        fi
    fi
fi
echo ""

echo "4. Checking SSH directory permissions:"
echo "~/.ssh should be 700, authorized_keys should be 600"
stat -c "%a %n" ~/.ssh 2>/dev/null || stat -f "%Lp %N" ~/.ssh 2>/dev/null
stat -c "%a %n" ~/.ssh/authorized_keys 2>/dev/null || stat -f "%Lp %N" ~/.ssh/authorized_keys 2>/dev/null