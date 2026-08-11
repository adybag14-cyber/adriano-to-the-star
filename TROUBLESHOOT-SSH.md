# SSH Connection Troubleshooting Guide

## Issue: SSH Connection Hanging/Not Working

The SSH connection test keeps hanging. Here are the most common causes and solutions:

---

## ✅ Step 1: Verify Public Key in GitLab

**Your Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGBjJ4ytHp2QC4Oeu1OflRRJ5vviOcTQ/hXt2OAIPJ87 adybag14@gmail.com
```

**Check in GitLab:**
1. Go to: https://gitlab.com/-/profile/keys
2. Verify the key is listed there
3. **Important**: Make sure:
   - The key starts with `ssh-ed25519`
   - The entire key is on ONE line (no line breaks)
   - There are no extra spaces before/after
   - The email `adybag14@gmail.com` matches

---

## 🔍 Step 2: Common Issues

### Issue A: Key Format Problem in GitLab
- **Problem**: Extra spaces, line breaks, or missing parts
- **Solution**: Delete the key in GitLab and re-add it (copy the exact key above)

### Issue B: Wrong Account
- **Problem**: Key added to wrong GitLab account
- **Solution**: Make sure you're logged into `adybag14@gmail.com` account when adding the key

### Issue C: SSH Client Hanging
- **Problem**: SSH waiting for interactive input
- **Solution**: Use non-interactive flags (already in config)

---

## 🧪 Step 3: Test Different Methods

### Method 1: Test with Direct Git Command
Instead of `ssh -T`, try cloning a test repo:
```powershell
# First, create a test repository on GitLab with adybag14 account
# Then try:
git clone git@gitlab-adybag14:username/test-repo.git
```

### Method 2: Use HTTPS Instead (Temporary)
```powershell
# Generate Personal Access Token on GitLab
# Settings → Access Tokens → Create with `write_repository` scope
git clone https://oauth2:YOUR_TOKEN@gitlab.com/username/repo.git
```

### Method 3: Check SSH Agent (Windows)
```powershell
# Start SSH agent
Start-Service ssh-agent

# Add key to agent
ssh-add C:\Users\adyba\.ssh\id_ed25519_adybag14

# Test
ssh -T git@gitlab-adybag14
```

---

## 🔧 Step 4: Alternative - Re-Generate Key

If nothing works, let's re-generate the key:

```powershell
# Delete old key
Remove-Item C:\Users\adyba\.ssh\id_ed25519_adybag14
Remove-Item C:\Users\adyba\.ssh\id_ed25519_adybag14.pub

# Generate new one
ssh-keygen -t ed25519 -C "adybag14@gmail.com" -f C:\Users\adyba\.ssh\id_ed25519_adybag14 -N '""'

# Display new public key
Get-Content C:\Users\adyba\.ssh\id_ed25519_adybag14.pub
```

Then add the NEW key to GitLab.

---

## 📋 Quick Checklist

- [ ] Public key added to GitLab (adybag14@gmail.com account)
- [ ] Key is on ONE line in GitLab (no breaks)
- [ ] Key format matches exactly: starts with `ssh-ed25519`
- [ ] SSH config file exists at `C:\Users\adyba\.ssh\config`
- [ ] Private key file exists: `C:\Users\adyba\.ssh\id_ed25519_adybag14`
- [ ] No extra spaces in the public key in GitLab

---

## 💡 Quick Test Commands

**Display your public key:**
```powershell
Get-Content C:\Users\adyba\.ssh\id_ed25519_adybag14.pub
```

**Test with verbose output (see what's happening):**
```powershell
ssh -vvv -i C:\Users\adyba\.ssh\id_ed25519_adybag14 -T git@gitlab.com 2>&1 | Select-Object -First 50
```

**Test using SSH config alias:**
```powershell
ssh -T git@gitlab-adybag14
```

---

## 🆘 If Still Not Working

1. **Try HTTPS instead** (easiest workaround)
   - Create Personal Access Token on GitLab
   - Use HTTPS URLs instead of SSH

2. **Check GitLab Status**
   - https://status.gitlab.com/
   - Make sure GitLab isn't having issues

3. **Contact Support**
   - GitLab Support: https://about.gitlab.com/support/
   - Or check GitLab forums/community

---

## Alternative: Use HTTPS with Personal Access Token

If SSH continues to fail, use HTTPS instead:

1. **Create Personal Access Token:**
   - Go to: https://gitlab.com/-/profile/personal_access_tokens
   - Name: "Windows PC"
   - Scopes: `write_repository`, `read_repository`
   - Click "Create personal access token"
   - **Copy the token** (you'll only see it once!)

2. **Use HTTPS URLs:**
   ```powershell
   # Clone
   git clone https://oauth2:YOUR_TOKEN@gitlab.com/username/repo.git
   
   # Update remote
   git remote set-url origin https://oauth2:YOUR_TOKEN@gitlab.com/username/repo.git
   ```

3. **Store token securely (optional):**
   ```powershell
   # Use Git Credential Manager
   git config --global credential.helper manager-core
   ```

