# 🚀 ThrottleStop Auto EPP Script - Setup Guide

## 📋 Quick Setup Instructions

### Step 1: Edit the Script

1. **Open `ThrottleStop_Auto_EPP.ps1` in Notepad or any text editor**

2. **Find this line (around line 10):**
   ```powershell
   $ThrottleStopPath = "C:\Path\To\ThrottleStop.exe"
   ```

3. **Change it to your actual ThrottleStop path:**
   ```powershell
   $ThrottleStopPath = "C:\Users\YourName\Downloads\ThrottleStop\ThrottleStop.exe"
   ```
   - Replace with your actual ThrottleStop.exe location
   - Use full path (not relative)

4. **Save the file**

### Step 2: Set Up ThrottleStop Profiles (Recommended)

**For best results, create two profiles in ThrottleStop:**

1. **Open ThrottleStop as Administrator**

2. **Create "AC Power" Profile:**
   - Click "Options" button
   - In "Profile Name" field, type: **"AC Power"**
   - Set EPP to **0** (Maximum Performance)
   - Set your desired power limits (PL1/PL2)
   - Click "Save"

3. **Create "Battery" Profile:**
   - Click "Options" button
   - In "Profile Name" field, type: **"Battery"**
   - Set EPP to **255** (Maximum Efficiency)
   - Set lower power limits (PL1: 15W, PL2: 20W)
   - Click "Save"

### Step 3: Test the Script

1. **Open PowerShell as Administrator:**
   - Press `Windows + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Navigate to script location:**
   ```powershell
   cd C:\Path\To\Your\Script
   ```

3. **Run the script:**
   ```powershell
   .\ThrottleStop_Auto_EPP.ps1
   ```

4. **Test:**
   - Plug in AC adapter → Should see "AC Power" message, EPP = 0
   - Unplug AC adapter → Should see "Battery" message, EPP = 255

### Step 4: Set Up Auto-Start (Optional)

**To run the script automatically on Windows startup:**

1. **Open Task Scheduler:**
   - Press `Windows + R`
   - Type: `taskschd.msc`
   - Press Enter

2. **Create Basic Task:**
   - Click "Create Basic Task" (right side)
   - Name: **"ThrottleStop Auto EPP"**
   - Description: "Automatically switch EPP based on power source"
   - Click Next

3. **Set Trigger:**
   - Select "When I log on"
   - Click Next

4. **Set Action:**
   - Select "Start a program"
   - Click Next
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Path\To\ThrottleStop_Auto_EPP.ps1"`
   - **Important:** Check "Run with highest privileges"
   - Click Next

5. **Finish:**
   - Check "Open Properties"
   - Click Finish
   - In Properties:
     - General tab: Check "Run with highest privileges"
     - Settings tab: Check "Allow task to be run on demand"
   - Click OK

## ⚙️ Configuration Options

### EPP Settings (Already Set)

The script is pre-configured with:
- **AC Power:** EPP = 0 (Maximum Performance)
- **Battery:** EPP = 255 (Maximum Efficiency)

To change these, edit these lines in the script:
```powershell
$EPP_AC = 0          # Change this for AC power EPP
$EPP_Battery = 255   # Change this for battery EPP
```

### Check Interval

How often the script checks power status (default: 5 seconds):
```powershell
$CheckInterval = 5   # Change this to check more/less frequently
```

## 📊 What the Script Does

1. **Monitors Power Status:**
   - Checks every 5 seconds (configurable)
   - Detects AC vs Battery power

2. **Applies EPP Settings:**
   - AC Power: Sets EPP to 0 (Maximum Performance)
   - Battery: Sets EPP to 255 (Maximum Efficiency)

3. **Logs Activity:**
   - Creates log file: `C:\Users\YourName\ThrottleStop_EPP_Log.txt`
   - Logs all power state changes and EPP applications

4. **Runs Continuously:**
   - Monitors in background
   - Automatically switches when power state changes

## 🔧 Troubleshooting

### Script Won't Run

**Error: "Execution Policy"**
- Solution: Run PowerShell as Administrator and execute:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### ThrottleStop Not Found

**Error: "ThrottleStop.exe not found"**
- Solution: Edit script and set correct path to ThrottleStop.exe
- Use full path, not relative path

### EPP Not Changing

**EPP value not updating in ThrottleStop:**
- Solution 1: Make sure ThrottleStop is running
- Solution 2: Use ThrottleStop profiles instead (see Step 2)
- Solution 3: Manually set EPP in ThrottleStop and verify it works

### Script Stops Working

**Script stops after a while:**
- Check log file for errors: `C:\Users\YourName\ThrottleStop_EPP_Log.txt`
- Make sure ThrottleStop is still running
- Restart the script

## 📝 Log File Location

Log file is saved at:
```
C:\Users\YourName\ThrottleStop_EPP_Log.txt
```

The log shows:
- When script starts
- Power state changes
- EPP value changes
- Any errors

## ✅ Verification

After setup, verify it's working:

1. **Check Log File:**
   - Open: `C:\Users\YourName\ThrottleStop_EPP_Log.txt`
   - Should see power state changes

2. **Test Manually:**
   - Plug in AC → Check ThrottleStop EPP (should be 0)
   - Unplug AC → Check ThrottleStop EPP (should be 255)

3. **Monitor ThrottleStop:**
   - Keep ThrottleStop window open
   - Watch EPP value change when plugging/unplugging

## 🎯 Summary

**The script automatically:**
- ✅ Detects AC vs Battery power
- ✅ Sets EPP to 0 when on AC (Maximum Performance)
- ✅ Sets EPP to 255 when on battery (Maximum Efficiency)
- ✅ Logs all changes
- ✅ Runs continuously in background

**Just edit the ThrottleStop path and run!**

