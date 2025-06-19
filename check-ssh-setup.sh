#!/bin/bash

echo "SSH Key Troubleshooting Script"
echo "=============================="
echo ""

echo "1. Your SSH public key is:"
echo "-------------------------"
cat ~/.ssh/id_rsa_cpanel.pub
echo ""

echo "2. Testing SSH connection with verbose output:"
echo "---------------------------------------------"
echo "Running: ssh -vv stackmap-cpanel 'echo Connected successfully'"
echo ""
echo "Look for these key lines in the output:"
echo "- Offering public key: /Users/adamstack/.ssh/id_rsa_cpanel"
echo "- Server accepts key: ..."
echo "- Authentication succeeded (publickey)"
echo ""
echo "Press Enter to run the test..."
read

ssh -vv stackmap-cpanel 'echo Connected successfully'