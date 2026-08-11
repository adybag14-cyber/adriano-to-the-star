# 🔌 ThrottleStop: Automatic EPP Switching (AC vs Battery)

## 🎯 Goal

Automatically switch ThrottleStop EPP settings based on power source:
- **Plugged into AC:** EPP = 0 (Maximum Performance)
- **On Battery:** EPP = 192-255 (Energy Efficiency)

---

## 📋 Method 1: ThrottleStop Built-in Profile Switching (Recommended)

### Step 1: Create Two Profiles in ThrottleStop

1. **Open ThrottleStop as Administrator**

2. **Create "AC Power" Profile:**
   - Click "Options" button
   - In "Profile Name" field, type: **"AC Power"**
   - Set EPP to **0** (Maximum Performance)
   - Set Power Limits (PL1/PL2) to your desired values
   - Click "Save" button
   - Profile is saved

3. **Create "Battery" Profile:**
   - Click "Options" button
   - In "Profile Name" field, type: **"Battery"**
   - Set EPP to **192** or **255** (Energy Efficiency)
   - Set Power Limits lower (PL1: 15W, PL2: 20W)
   - Click "Save" button
   - Profile is saved

### Step 2: Use Windows Task Scheduler (Automatic Switching)

**This method uses Windows Task Scheduler to detect AC/battery changes and switch profiles.**

#### **Create AC Power Task:**

1. **Open Task Scheduler:**
   - Press `Windows + R`
   - Type: `taskschd.msc`
   - Press Enter

2. **Create Basic Task:**
   - Click "Create Basic Task" (right side)
   - Name: **"ThrottleStop AC Power"**
   - Description: "Switch to AC Power profile"
   - Click Next

3. **Set Trigger:**
   - Select "When an event is logged"
   - Click Next
   - Log: **Microsoft-Windows-Kernel-Power**
   - Source: **Kernel-Power**
   - Event ID: **105** (AC power connected)
   - Click Next

4. **Set Action:**
   - Select "Start a program"
   - Click Next
   - Program/script: Browse to **ThrottleStop.exe**
   - Add arguments: **-profile "AC Power"**
   - **Important:** Check "Run with highest privileges"
   - Click Next

5. **Finish:**
   - Check "Open Properties"
   - Click Finish
   - In Properties:
     - General tab: Check "Run with highest privileges"
     - Conditions tab: Uncheck "Start only if on AC power" (if checked)
   - Click OK

#### **Create Battery Power Task:**

1. **Create Basic Task:**
   - Click "Create Basic Task"
   - Name: **"ThrottleStop Battery Power"**
   - Description: "Switch to Battery profile"
   - Click Next

2. **Set Trigger:**
   - Select "When an event is logged"
   - Click Next
   - Log: **Microsoft-Windows-Kernel-Power**
   - Source: **Kernel-Power**
   - Event ID: **106** (AC power disconnected)
   - Click Next

3. **Set Action:**
   - Select "Start a program"
   - Click Next
   - Program/script: Browse to **ThrottleStop.exe**
   - Add arguments: **-profile "Battery"**
   - **Important:** Check "Run with highest privileges"
   - Click Next

4. **Finish:**
   - Check "Open Properties"
   - Click Finish
   - In Properties:
     - General tab: Check "Run with highest privileges"
   - Click OK

### Step 3: Test Automatic Switching

1. **Plug in AC adapter:**
   - Task should trigger
   - ThrottleStop should switch to "AC Power" profile
   - Check EPP value (should be 0)

2. **Unplug AC adapter:**
   - Task should trigger
   - ThrottleStop should switch to "Battery" profile
   - Check EPP value (should be 192-255)

---

## 📋 Method 2: PowerShell Script (More Reliable)

### Step 1: Create PowerShell Script

1. **Open Notepad**
2. **Copy and paste this script:**

```powershell
# ThrottleStop Auto EPP Switcher
# Switches EPP based on AC/Battery power

$throttleStopPath = "C:\Path\To\ThrottleStop.exe"  # CHANGE THIS PATH
$logFile = "$env:USERPROFILE\ThrottleStop_EPP_Log.txt"

function Write-Log {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $logFile -Append
}

function Get-PowerStatus {
    $battery = Get-WmiObject -Class Win32_Battery
    if ($battery) {
        if ($battery.BatteryStatus -eq 2) {
            return "AC"
        } else {
            return "Battery"
        }
    } else {
        # Desktop or no battery detected
        return "AC"
    }
}

function Set-ThrottleStopProfile {
    param($profileName)
    
    if (Test-Path $throttleStopPath) {
        Start-Process -FilePath $throttleStopPath -ArgumentList "-profile", "`"$profileName`"" -Verb RunAs
        Write-Log "Switched to profile: $profileName"
    } else {
        Write-Log "ERROR: ThrottleStop not found at $throttleStopPath"
    }
}

# Main loop
while ($true) {
    $powerStatus = Get-PowerStatus
    
    if ($powerStatus -eq "AC") {
        Set-ThrottleStopProfile "AC Power"
        Write-Log "AC Power detected - Performance mode"
    } else {
        Set-ThrottleStopProfile "Battery"
        Write-Log "Battery power detected - Efficiency mode"
    }
    
    # Wait 5 seconds before checking again
    Start-Sleep -Seconds 5
}
```

3. **Edit the script:**
   - Change `$throttleStopPath` to your actual ThrottleStop.exe path
   - Example: `"C:\Users\YourName\Downloads\ThrottleStop\ThrottleStop.exe"`

4. **Save as:**
   - File name: `ThrottleStop_Auto_EPP.ps1`
   - Save location: `C:\Scripts\` (create folder if needed)

### Step 2: Create Task Scheduler Entry

1. **Open Task Scheduler**

2. **Create Basic Task:**
   - Name: **"ThrottleStop Auto EPP"**
   - Description: "Automatically switch EPP based on power source"
   - Click Next

3. **Set Trigger:**
   - Select "When the computer starts"
   - Click Next

4. **Set Action:**
   - Select "Start a program"
   - Click Next
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "C:\Scripts\ThrottleStop_Auto_EPP.ps1"`
   - **Important:** Check "Run with highest privileges"
   - Click Next

5. **Finish:**
   - Check "Open Properties"
   - Click Finish
   - In Properties:
     - General tab: Check "Run with highest privileges"
     - Settings tab: Check "Allow task to be run on demand"
   - Click OK

### Step 3: Test Script

1. **Run script manually first:**
   - Right-click `ThrottleStop_Auto_EPP.ps1`
   - Select "Run with PowerShell"
   - Check if it works

2. **Check log file:**
   - Location: `C:\Users\YourName\ThrottleStop_EPP_Log.txt`
   - Should show power status changes

---

## 📋 Method 3: Simple Batch Script (Easiest)

### Step 1: Create Batch Script

1. **Open Notepad**

2. **Copy and paste:**

```batch
@echo off
:loop
powercfg /batteryreport /output "%TEMP%\battery_report.html" >nul 2>&1

REM Check if AC is connected
powercfg /batteryreport /output "%TEMP%\battery_report.html" >nul 2>&1
findstr /C:"AC Power" "%TEMP%\battery_report.html" >nul

if %errorlevel% == 0 (
    REM AC Power - Set to Performance
    "C:\Path\To\ThrottleStop.exe" -profile "AC Power"
) else (
    REM Battery - Set to Efficiency
    "C:\Path\To\ThrottleStop.exe" -profile "Battery"
)

timeout /t 10 /nobreak >nul
goto loop
```

3. **Edit the script:**
   - Change `"C:\Path\To\ThrottleStop.exe"` to your actual path

4. **Save as:**
   - File name: `ThrottleStop_Auto_Switch.bat`
   - Save location: `C:\Scripts\`

### Step 2: Create Task Scheduler Entry

1. **Open Task Scheduler**

2. **Create Basic Task:**
   - Name: **"ThrottleStop Auto Switch"**
   - Click Next

3. **Set Trigger:**
   - Select "When the computer starts"
   - Click Next

4. **Set Action:**
   - Select "Start a program"
   - Program: `C:\Scripts\ThrottleStop_Auto_Switch.bat`
   - **Important:** Check "Run with highest privileges"
   - Click Finish

---

## 📋 Method 4: ThrottleStop Options (Simplest - Manual)

If automatic switching doesn't work, you can manually switch:

1. **Open ThrottleStop**

2. **Click "Options" button**

3. **Select Profile:**
   - Dropdown menu shows saved profiles
   - Select "AC Power" when plugged in
   - Select "Battery" when on battery

4. **Click "Turn On"** to apply

**Tip:** Create desktop shortcuts:
- Shortcut 1: `ThrottleStop.exe -profile "AC Power"`
- Shortcut 2: `ThrottleStop.exe -profile "Battery"`

---

## ⚙️ Recommended Profile Settings

### **AC Power Profile (Performance):**
- **EPP:** 0 (Maximum Performance)
- **PL1 (Long Power):** 25-30W
- **PL2 (Short Power):** 35-40W
- **Time Limit:** 56-128 seconds
- **Speed Shift:** Enabled

### **Battery Profile (Efficiency):**
- **EPP:** 192-255 (Maximum Efficiency)
- **PL1 (Long Power):** 15W (default)
- **PL2 (Short Power):** 20-25W
- **Time Limit:** 28 seconds
- **Speed Shift:** Enabled

---

## 🔧 Troubleshooting

### **Profile Switching Not Working**

1. **Check ThrottleStop Path:**
   - Ensure path in script/task is correct
   - Use full path: `C:\Full\Path\To\ThrottleStop.exe`

2. **Run as Administrator:**
   - All scripts/tasks must run as administrator
   - Check "Run with highest privileges" in Task Scheduler

3. **Check Profile Names:**
   - Profile names must match exactly
   - Case-sensitive: "AC Power" vs "ac power"

4. **Test Manually:**
   - Run ThrottleStop command manually:
   - `ThrottleStop.exe -profile "AC Power"`
   - If this works, script should work

### **Task Scheduler Not Triggering**

1. **Check Event IDs:**
   - Event ID 105 = AC connected
   - Event ID 106 = AC disconnected
   - Verify these in Event Viewer

2. **Alternative Trigger:**
   - Use "On an event" trigger
   - Log: Microsoft-Windows-Kernel-Power
   - Source: Kernel-Power
   - Event ID: 105 or 106

3. **Use PowerShell Script:**
   - More reliable than event-based triggers
   - Checks power status every few seconds

### **Script Errors**

1. **PowerShell Execution Policy:**
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - Allows scripts to run

2. **Check Log File:**
   - Script creates log file
   - Check for error messages

3. **Test Script Manually:**
   - Run PowerShell script directly
   - See if errors appear

---

## ✅ Verification Checklist

After Setup:
- [ ] Two profiles created in ThrottleStop (AC Power, Battery)
- [ ] Task Scheduler tasks created (or script running)
- [ ] Test: Plug in AC → Check EPP (should be 0)
- [ ] Test: Unplug AC → Check EPP (should be 192-255)
- [ ] Verify ThrottleStop is running
- [ ] Check log file (if using script)
- [ ] Test multiple times (plug/unplug)

---

## 🎯 Quick Setup Summary

**Easiest Method (Recommended):**

1. **Create two profiles in ThrottleStop:**
   - "AC Power" (EPP = 0)
   - "Battery" (EPP = 192)

2. **Use Task Scheduler:**
   - Create task for AC connected (Event ID 105)
   - Create task for AC disconnected (Event ID 106)
   - Both run: `ThrottleStop.exe -profile "ProfileName"`

3. **Test:**
   - Plug/unplug AC adapter
   - Verify EPP changes automatically

---

## 📚 Additional Tips

### **Combine with Power Limits:**

**AC Power Profile:**
- EPP = 0
- PL1 = 25W
- PL2 = 35W

**Battery Profile:**
- EPP = 255
- PL1 = 15W (default)
- PL2 = 20W

### **Monitor Switching:**

- Keep ThrottleStop window open
- Watch EPP value change when plugging/unplugging
- Check Task Scheduler history for task execution

### **Manual Override:**

- You can always manually change profile in ThrottleStop
- Automatic switching will override on next power change

---

**Now your laptop will automatically switch to energy efficiency when unplugged! 🔌🔋**

