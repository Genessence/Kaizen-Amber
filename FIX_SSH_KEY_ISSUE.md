# Fix SSH Key "error in libcrypto" Issue

## 🎯 The Problem

The error `Load key: error in libcrypto` means the SSH key is not formatted correctly in GitHub Secrets. GitHub Secrets need special formatting for multiline content.

## ✅ Solution: Format Your Key Correctly

### **Option 1: Use the Helper Script (Easiest)**

#### **For PowerShell (Windows):**

```powershell
# Run this in PowerShell
.\Format-SSHKey-For-GitHub.ps1 -KeyPath "C:\path\to\your-key.pem"
```

This will:
- ✅ Format the key correctly
- ✅ Copy it to your clipboard
- ✅ Show you what to paste

#### **For Git Bash (Linux/Mac):**

```bash
# Run this in Git Bash
bash format-ssh-key-for-github.sh /path/to/your-key.pem
```

### **Option 2: Manual Formatting**

If you don't want to use the script:

1. **Open your key file** in a text editor
2. **Replace all newlines** with the literal string `\n`
3. The result should be **ONE long line** that looks like:

```
-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n...\n-----END RSA PRIVATE KEY-----\n
```

## 📋 Add to GitHub Secrets

1. Go to: https://github.com/Genessence/Kaizen-Amber/settings/secrets/actions
2. Find `EC2_SSH_KEY` and click "Update" (or Remove and create new)
3. Paste the formatted key (ONE line with `\n` in it)
4. Click "Update secret" or "Add secret"

## 🔄 After Updating the Secret

1. **Commit the workflow changes**:
   ```bash
   git add .github/workflows/deploy.yml
   git add Format-SSHKey-For-GitHub.ps1
   git add format-ssh-key-for-github.sh
   git commit -m "fix: improve SSH key handling and add formatting scripts"
   git push origin test
   ```

2. **Re-run the GitHub Actions workflow**

3. **Check the "Verify SSH Key Format" step** - it will show:
   ```
   First line of key:
   -----BEGIN RSA PRIVATE KEY-----
   Last line of key:
   -----END RSA PRIVATE KEY-----
   Key file size:
   1234
   ```

## 🐛 Debug Steps

If it still fails, check the "Verify SSH Key Format" output:

### ✅ **Good Output:**
```
First line of key:
-----BEGIN RSA PRIVATE KEY-----
Last line of key:
-----END RSA PRIVATE KEY-----
```

### ❌ **Bad Output:**
```
First line of key:
-----BEGIN RSA PRIVATE KEY-----\n
Last line of key:
-----END RSA PRIVATE KEY-----\n
```
(If you see literal `\n` at the end of lines, the key wasn't formatted correctly)

## 🔑 Key Format Examples

### **Correct Format for GitHub Secret:**
```
-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAxxx...\nyyy...\nzzz...\n-----END RSA PRIVATE KEY-----\n
```

### **Incorrect Formats:**

❌ Multiple lines (like in the original file):
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxxx...
-----END RSA PRIVATE KEY-----
```

❌ With extra spaces:
```
  -----BEGIN RSA PRIVATE KEY-----\n...
```

## 🚀 Quick Test

After setup, test your key locally first:

```bash
# Use the same key to SSH to your EC2
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip

# If this works, the key itself is valid
# If this fails, the problem is with the key or EC2 configuration
```

## 📝 Workflow Changes Made

The workflow now uses `printf "%b"` which correctly interprets `\n` as newlines:

```yaml
- name: Setup SSH Key
  run: |
    mkdir -p ~/.ssh
    printf "%b" "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
```

This is the most reliable method for handling multiline secrets in GitHub Actions.

## ✅ Success Checklist

- [ ] Used helper script to format key OR manually formatted with `\n`
- [ ] Key is ONE line with `\n` characters in it
- [ ] Updated EC2_SSH_KEY secret in GitHub
- [ ] Committed and pushed workflow changes
- [ ] Re-ran GitHub Actions workflow
- [ ] "Verify SSH Key Format" step shows correct BEGIN/END lines
- [ ] SSH connection succeeds

---

**Still having issues?** Check that:
1. The key works locally (`ssh -i key.pem user@host`)
2. `EC2_USER` is correct (usually `ubuntu` or `ec2-user`)
3. `EC2_HOST` is correct (IP or domain name)
4. The key matches your EC2 instance's authorized key

