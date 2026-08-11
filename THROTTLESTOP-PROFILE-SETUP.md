# 🎯 ThrottleStop Profile Setup for Auto Switching

## 📋 Quick Setup: Create Profiles for Reliable Auto-Switching

For the most reliable automatic switching of both EPP and power limits, create two profiles in ThrottleStop:

### **Step 1: Create "AC Power" Profile**

1. **Open ThrottleStop as Administrator**

2. **Set up AC Power settings:**
   - **EPP:** Set to **0** (Maximum Performance)
   - Click "TPL" button
   - Uncheck "Disable Controls"
   - Set **PL1 (Long Power):** **25W**
   - Set **PL2 (Short Power):** 30-35W (optional)
   - Click "Apply" then "OK"

3. **Save as Profile:**
   - Click "Options" button
   - In "Profile Name" field, type: **"AC Power"**
   - Click "Save"
   - Profile saved!

### **Step 2: Create "Battery" Profile**

1. **In ThrottleStop, set up Battery settings:**
   - **EPP:** Set to **255** (Maximum Efficiency)
   - Click "TPL" button
   - Uncheck "Disable Controls"
   - Set **PL1 (Long Power):** **10W**
   - Set **PL2 (Short Power):** 15W (optional)
   - Click "Apply" then "OK"

2. **Save as Profile:**
   - Click "Options" button
   - In "Profile Name" field, type: **"Battery"**
   - Click "Save"
   - Profile saved!

### **Step 3: Update PowerShell Script to Use Profiles**

The script will try to update ThrottleStop.ini, but using profiles is more reliable. You can manually switch profiles, or the script will attempt to update the INI file.

---

## ✅ Current Script Configuration

**The script is configured with:**
- **AC Power:** EPP = 0, PL1 = 25W
- **Battery:** EPP = 255, PL1 = 10W

**The script will:**
- Automatically detect AC vs Battery
- Update ThrottleStop.ini with EPP and PL1 values
- ThrottleStop should pick up the changes

---

## 🔧 Alternative: Manual Profile Switching

If automatic INI updates don't work reliably, you can:

1. **Create the two profiles** (as described above)
2. **Manually switch** when plugging/unplugging:
   - Open ThrottleStop
   - Click "Options"
   - Select "AC Power" when plugged in
   - Select "Battery" when on battery
   - Click "Turn On"

---

## 📊 Expected Behavior

**When Plugged into AC:**
- EPP: 0 (Maximum Performance)
- PL1: 25W
- CPU can boost aggressively
- Better performance

**When on Battery:**
- EPP: 255 (Maximum Efficiency)
- PL1: 10W
- CPU conserves power
- Longer battery life

---

**The script is updated and running! It will automatically switch both EPP and PL1 based on power source.**

