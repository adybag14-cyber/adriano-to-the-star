# SSH Key Setup for GitLab Account (adybag14@gmail.com)

## ✅ SSH Key Generated Successfully

A new SSH key has been generated for your GitLab account:
- **Private Key**: `C:\Users\adyba\.ssh\id_ed25519_adybag14`
- **Public Key**: `C:\Users\adyba\.ssh\id_ed25519_adybag14.pub`
- **Email**: adybag14@gmail.com
- **Key Type**: ED25519 (256-bit, recommended)

---

## Step 1: Copy Your Public Key

Your public key is shown above. Copy the entire output (it starts with `ssh-ed25519` and ends with `adybag14@gmail.com`).

**Alternative**: You can also display it again with:
```powershell
Get-Content C:\Users\adyba\.ssh\id_ed25519_adybag14.pub
```

Or manually copy from:
```
C:\Users\adyba\.ssh\id_ed25519_adybag14.pub
```

---

## Step 2: Add SSH Key to GitLab

1. **Log into GitLab** with your `adybag14@gmail.com` account
2. Go to: **Settings** → **SSH Keys**
   - Direct link: https://gitlab.com/-/profile/keys
3. **Paste your public key** in the "Key" field
4. Give it a **Title** (e.g., "Windows PC - adybag14")
5. Optionally set an **Expiration date**
6. Click **"Add key"**

---

## Step 3: Configure SSH Config (For Multiple Accounts)

To use different SSH keys for different GitLab accounts, create/update your SSH config file:

### Option A: Edit Existing Config
Edit: `C:\Users\adyba\.ssh\config`

### Option B: Create New Config
If the file doesn't exist, create it.

### SSH Config Content:

```
# Default GitLab (imtherushwar account)
Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile C:/Users/adyba/.ssh/id_ed25519
    IdentitiesOnly yes

# adybag14@gmail.com GitLab account
Host gitlab-adybag14
    HostName gitlab.com
    User git
    IdentityFile C:/Users/adyba/.ssh/id_ed25519_adybag14
    IdentitiesOnly yes
```

**Note**: The `IdentitiesOnly yes` option ensures SSH only uses the specified key.

---

## Step 4: Update Repository Remote (If Needed)

If you want to use the new account for a repository:

### Method 1: Use SSH Config Host
```bash
# Instead of: git@gitlab.com:username/repo.git
# Use: git@gitlab-adybag14:username/repo.git

git remote set-url origin git@gitlab-adybag14:adybag14username/repo.git
```

### Method 2: Use Default with Correct Key
If you only use one account at a time, you can update the default:
```bash
# Update SSH config to point to the new key by default
# (Change IdentityFile in the gitlab.com Host section)
```

---

## Step 5: Test SSH Connection

### Test Default Connection:
```bash
ssh -T git@gitlab.com
```

### Test New Account Connection:
```bash
# Using SSH config host
ssh -T git@gitlab-adybag14

# Or specify key directly
ssh -i C:\Users\adyba\.ssh\id_ed25519_adybag14 -T git@gitlab.com
```

**Expected Output**: 
```
Welcome to GitLab, @username!
```

---

## Troubleshooting

### Permission Denied Error
```bash
# Check key permissions (Windows)
icacls C:\Users\adyba\.ssh\id_ed25519_adybag14

# Ensure file is readable only by you
icacls C:\Users\adyba\.ssh\id_ed25519_adybag14 /inheritance:r
icacls C:\Users\adyba\.ssh\id_ed25519_adybag14 /grant:r "%USERNAME%:(R)"
```

### Wrong Key Being Used
```bash
# Test with verbose output to see which key is used
ssh -vT git@gitlab.com

# Force specific key
ssh -i C:\Users\adyba\.ssh\id_ed25519_adybag14 -T git@gitlab.com
```

### SSH Config Not Working
1. Ensure config file is in `C:\Users\adyba\.ssh\config` (no extension)
2. Ensure file permissions are correct
3. Check for syntax errors in config file

---

## Current SSH Keys Summary

| Account | Key File | Config Host | Status |
|---------|----------|-------------|--------|
| imtherushwar | `id_ed25519` | `gitlab.com` (default) | ✅ Active |
| adybag14@gmail.com | `id_ed25519_adybag14` | `gitlab-adybag14` | ✅ Generated |

---

## Next Steps

1. ✅ **SSH Key Generated** - Done!
2. ⬜ **Add Public Key to GitLab** - Copy key from above and add to GitLab
3. ⬜ **Configure SSH Config** - Update config file (optional but recommended)
4. ⬜ **Test Connection** - Verify SSH connection works
5. ⬜ **Clone/Fork Repository** - Use new account to clone/fork your repo

---

## Quick Reference

**Display Public Key:**
```powershell
Get-Content C:\Users\adyba\.ssh\id_ed25519_adybag14.pub
```

**Test Connection:**
```bash
ssh -T git@gitlab-adybag14
```

**Clone Repository to New Account:**
```bash
git clone git@gitlab-adybag14:username/repo.git
```

