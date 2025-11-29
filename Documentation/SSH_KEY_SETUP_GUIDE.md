# SSH Key Setup Guide for GitHub Actions

## 🔑 How to Properly Add Your EC2 SSH Key

### Option 1: Direct Key (Recommended for Simplicity)

1. **Get your SSH key content**:
   ```bash
   # In Git Bash
   cat /path/to/your-key.pem
   
   # Or in PowerShell
   Get-Content C:\path\to\your-key.pem -Raw
   ```

2. **Copy the ENTIRE output** including:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   (many lines of key data)
   ...
   -----END RSA PRIVATE KEY-----
   ```

3. **Add to GitHub**:
   - Go to: https://github.com/Genessence/Kaizen-Amber/settings/secrets/actions
   - Click `EC2_SSH_KEY` → Remove → New repository secret
   - Name: `EC2_SSH_KEY`
   - Value: Paste the entire key content
   - Click "Add secret"

### Option 2: Base64 Encoded (More Reliable)

If Option 1 doesn't work, use base64 encoding:

1. **Encode your key**:
   ```bash
   # In Git Bash
   cat /path/to/your-key.pem | base64 -w 0
   
   # Or in PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\your-key.pem"))
   ```

2. **Update GitHub Secret**:
   - Use the base64 string as the secret value

3. **Update workflow** to decode:
   ```yaml
   echo "$SSH_KEY" | base64 -d > ~/.ssh/deploy_key
   ```

## ⚠️ Common Issues

### Issue: "error in libcrypto"
**Cause**: Key has wrong line endings or extra spaces
**Fix**: Make sure you copy the ENTIRE key with no modifications

### Issue: "Permission denied (publickey)"
**Causes**:
1. Wrong key (need PRIVATE key, not public)
2. Key doesn't match EC2 instance
3. Wrong EC2_USER (should be `ubuntu` or `ec2-user`)

**Fix**: Verify:
```bash
# Test your key locally first
ssh -i /path/to/key.pem ubuntu@your-ec2-host
```

### Issue: "Invalid format"
**Cause**: Key is missing header/footer
**Fix**: Ensure key starts with `-----BEGIN` and ends with `-----END`

## ✅ Verification Checklist

- [ ] SSH key file exists on your local machine
- [ ] You can SSH to EC2 with this key locally
- [ ] Copied ENTIRE key including BEGIN/END lines
- [ ] No extra spaces before/after the key
- [ ] `EC2_HOST` is correct IP or domain
- [ ] `EC2_USER` is correct (usually `ubuntu`)
- [ ] All 3 secrets are set in GitHub

## 🚀 Test Connection

After setting up, the workflow should show:
```
✓ Setup SSH
  mkdir -p ~/.ssh
  echo "***" > ~/.ssh/deploy_key
  chmod 600 ~/.ssh/deploy_key
  ssh-keyscan -H xxx.xxx.xxx.xxx >> ~/.ssh/known_hosts
```

## 📝 Current Workflow Setup

The workflow now uses an environment variable approach:
```yaml
- name: Setup SSH
  env:
    SSH_KEY: ${{ secrets.EC2_SSH_KEY }}
  run: |
    mkdir -p ~/.ssh
    echo "$SSH_KEY" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
```

This is more reliable than direct substitution.

