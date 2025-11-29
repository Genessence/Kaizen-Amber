#!/bin/bash

# This script formats your SSH key for GitHub Secrets
# Usage: bash format-ssh-key-for-github.sh /path/to/your-key.pem

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the path to your SSH key file"
    echo "Usage: bash $0 /path/to/your-key.pem"
    exit 1
fi

KEY_FILE="$1"

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: File not found: $KEY_FILE"
    exit 1
fi

echo "📋 Formatting SSH key for GitHub Secrets..."
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "COPY EVERYTHING BETWEEN THE LINES BELOW (including \\n characters)"
echo "══════════════════════════════════════════════════════════════"
echo ""

# Replace actual newlines with \n string
awk '{printf "%s\\n", $0}' "$KEY_FILE"

echo ""
echo ""
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Steps to add to GitHub:"
echo "1. Copy the text above (it should be ONE long line with \\n in it)"
echo "2. Go to: https://github.com/Genessence/Kaizen-Amber/settings/secrets/actions"
echo "3. Remove existing EC2_SSH_KEY if it exists"
echo "4. Click 'New repository secret'"
echo "5. Name: EC2_SSH_KEY"
echo "6. Value: Paste the copied text"
echo "7. Click 'Add secret'"
echo ""
echo "📝 The key should look like:"
echo "-----BEGIN RSA PRIVATE KEY-----\\nMIIEp...\\n...\\n-----END RSA PRIVATE KEY-----\\n"
echo ""

