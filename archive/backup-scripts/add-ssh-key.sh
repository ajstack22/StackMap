#!/bin/bash

echo "Adding SSH key to cPanel server..."
echo "You'll need to enter your password one time:"

ssh-copy-id -i ~/.ssh/id_rsa_cpanel.pub -p 21098 stachblx@199.188.200.57

echo ""
echo "If successful, test the connection with:"
echo "ssh stackmap-cpanel"