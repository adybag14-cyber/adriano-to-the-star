# 🔋 ThrottleStop: Removing Power Limits Guide

## ⚠️ WARNING

**Removing power limits will:**
- Increase CPU heat significantly
- Reduce battery life dramatically
- May cause thermal throttling
- Can damage hardware if cooling is insufficient
- Should only be done when laptop is plugged into AC power

**Monitor temperatures constantly!**

---

## 📋 Step-by-Step: Remove Power Limits in ThrottleStop

### Step 1: Open ThrottleStop

1. **Download ThrottleStop** (if not already):
   - Visit: https://www.techpowerup.com/download/techpowerup-throttlestop/
   - Download latest version
   - Extract ZIP file

2. **Run as Administrator:**
   - Right-click `ThrottleStop.exe`
   - Select **"Run as administrator"**
   - **Required** for power limit control

3. **Launch ThrottleStop:**
   - You'll see the main window with CPU information

---

### Step 2: Access TPL (Turbo Power Limits) Window

1. **Click "TPL" Button:**
   - Located in the main ThrottleStop window
   - Opens "Turbo Power Limits" window

2. **You'll see:**
   - Long Power PL1 (sustained power limit)
   - Short Power PL2 (boost power limit)
   - Time Limit (how long PL2 can be used)

---

### Step 3: Enable Power Limit Controls

1. **Uncheck "Disable Controls":**
   - This enables editing of power limits
   - If grayed out, your laptop doesn't allow power limit changes

2. **Check "Lock" (Optional):**
   - Prevents Windows from changing your settings
   - Recommended to keep your settings

---

### Step 4: Adjust Power Limits

#### **Long Power PL1 (Sustained Power Limit)**

**What it does:**
- Maximum power CPU can use continuously
- Your i7-10810U default: ~15W (TDP)
- This is the "long-term" power limit

**How to increase:**
1. **Find "Long Power PL1" field**
2. **Increase gradually:**
   - Start with: **20W** (from 15W)
   - Test stability
   - If stable, try: **25W**
   - Maximum recommended: **30W** (for your CPU)
3. **Click "Apply"**

**Recommended values for i7-10810U:**
- Conservative: 20-25W
- Moderate: 25-30W
- Aggressive: 30-35W (monitor temps closely!)

#### **Short Power PL2 (Boost Power Limit)**

**What it does:**
- Maximum power during short bursts (turbo boost)
- Higher than PL1 for short periods
- Your i7-10810U default: ~25W
- Used when CPU needs maximum performance briefly

**How to increase:**
1. **Find "Short Power PL2" field**
2. **Increase gradually:**
   - Start with: **30W** (from 25W)
   - Test stability
   - If stable, try: **35W**
   - Maximum recommended: **40W** (for your CPU)
3. **Click "Apply"**

**Recommended values for i7-10810U:**
- Conservative: 30-35W
- Moderate: 35-40W
- Aggressive: 40-45W (very hot, monitor closely!)

#### **Time Limit (PL2 Duration)**

**What it does:**
- How long CPU can use PL2 power
- Default: Usually 28-56 seconds
- After this time, CPU drops to PL1

**How to adjust:**
1. **Find "Time Limit" field**
2. **Increase if you want longer boost:**
   - Default: 28 seconds
   - Increase to: **56 seconds** (double)
   - Maximum: **128 seconds** (if supported)
3. **Click "Apply"**

---

### Step 5: Apply Settings

1. **Click "Apply" in TPL window:**
   - Settings are applied immediately
   - CPU can now use more power

2. **Click "OK" to close TPL window:**
   - Settings are saved to ThrottleStop.ini

3. **Check main ThrottleStop window:**
   - You should see "TPL" button highlighted
   - Indicates power limits are active

---

### Step 6: Test and Monitor

1. **Monitor Temperatures:**
   - Keep HWMonitor or Core Temp open
   - Watch CPU temperatures
   - **Critical:** Stay below 90°C

2. **Run Stress Test:**
   - Launch Prime95 or Cinebench
   - Run for 10-15 minutes
   - Monitor for:
     - High temperatures (>90°C)
     - Thermal throttling
     - System crashes

3. **Check Performance:**
   - Run Cinebench benchmark
   - Compare score to baseline
   - Should see performance improvement

4. **If Temperatures Too High:**
   - Reduce PL1 and PL2 values
   - Increase in smaller increments
   - Improve cooling (cooling pad, clean vents)

---

## 🎯 Recommended Settings for i7-10810U

### **Conservative (Safer, Lower Heat):**
- **PL1 (Long Power):** 20W
- **PL2 (Short Power):** 30W
- **Time Limit:** 28 seconds
- **Expected Temp:** 70-80°C under load

### **Moderate (Balanced):**
- **PL1 (Long Power):** 25W
- **PL2 (Short Power):** 35W
- **Time Limit:** 56 seconds
- **Expected Temp:** 75-85°C under load

### **Aggressive (Maximum Performance):**
- **PL1 (Long Power):** 30W
- **PL2 (Short Power):** 40W
- **Time Limit:** 128 seconds
- **Expected Temp:** 80-90°C under load
- **⚠️ Monitor very closely!**

---

## 🔥 Temperature Monitoring

### **Critical Temperatures:**
- **Idle:** 40-50°C (normal)
- **Light Load:** 60-75°C (acceptable)
- **Heavy Load:** 75-85°C (monitor closely)
- **Above 85°C:** Reduce power limits immediately
- **Above 90°C:** **STOP - Too hot!**

### **Signs of Overheating:**
- CPU speed drops (thermal throttling)
- Fan running at maximum constantly
- Laptop feels very hot to touch
- System becomes unstable
- ThrottleStop shows "PROCHOT" (processor hot)

---

## ⚙️ Additional ThrottleStop Settings

### **Speed Shift - EPP (Energy Performance Preference)**

**Location:** Main ThrottleStop window

**What it does:**
- Controls how aggressively CPU boosts
- Lower number = more performance
- Higher number = more power saving

**Recommended settings:**
- **Performance:** EPP = 0 (maximum performance)
- **Balanced:** EPP = 128 (default)
- **Power Saving:** EPP = 255 (maximum efficiency)

**How to set:**
1. Check "Speed Shift - EPP"
2. Set value to **0** for maximum performance
3. Click "Turn On"

### **Set Multiplier**

**Location:** Main ThrottleStop window

**What it does:**
- Locks CPU to specific multiplier
- Your i7-10810U: Base 1.10GHz, Turbo up to 4.9GHz
- Can force CPU to run at higher speed

**How to use:**
1. Check "Set Multiplier"
2. Set multiplier value (e.g., 40 = 4.0GHz)
3. **Note:** May not work if CPU is locked

---

## 🚨 Troubleshooting

### **"Disable Controls" is Grayed Out**

**Problem:** Can't edit power limits

**Solutions:**
1. **Run as Administrator:**
   - Right-click ThrottleStop → Run as administrator
   - Required for power limit control

2. **BIOS Locked:**
   - Some laptops lock power limits in BIOS
   - May not be changeable
   - Check BIOS settings (usually locked)

3. **Try Intel XTU:**
   - Some laptops work better with Intel XTU
   - Download: https://www.intel.com/content/www/us/en/download/17881/intel-extreme-tuning-utility-intel-xtu.html

### **Settings Don't Apply**

1. **Check "Lock" checkbox:**
   - Prevents Windows from overriding
   - Check this in TPL window

2. **Restart ThrottleStop:**
   - Close and reopen as administrator
   - Settings should persist

3. **Check Windows Power Plan:**
   - Set to "High Performance"
   - May override ThrottleStop settings

### **System Crashes or Becomes Unstable**

1. **Reduce Power Limits:**
   - Lower PL1 and PL2 values
   - Start with smaller increases

2. **Check Temperatures:**
   - May be overheating
   - Reduce power limits if temps too high

3. **Reset to Defaults:**
   - Set PL1 to 15W (default)
   - Set PL2 to 25W (default)
   - Click Apply

### **High Temperatures**

1. **Reduce Power Limits:**
   - Lower PL1 and PL2
   - Less power = less heat

2. **Improve Cooling:**
   - Clean laptop vents
   - Use cooling pad
   - Ensure good airflow
   - Don't use on bed/couch

3. **Reduce Time Limit:**
   - Shorter PL2 duration
   - Less sustained high power

---

## 💾 Save Settings Permanently

### **Method 1: ThrottleStop Auto-Save**

1. **In TPL window:**
   - Make your changes
   - Click "Apply"
   - Click "OK"
   - Settings saved to ThrottleStop.ini

2. **ThrottleStop will load settings on startup**

### **Method 2: Task Scheduler (Auto-Start)**

1. **Open Task Scheduler:**
   - Press Windows + R
   - Type: `taskschd.msc`
   - Press Enter

2. **Create Basic Task:**
   - Click "Create Basic Task"
   - Name: "ThrottleStop"
   - Description: "Start ThrottleStop with power limits"

3. **Set Trigger:**
   - Select "When I log on"
   - Click Next

4. **Set Action:**
   - Select "Start a program"
   - Browse to ThrottleStop.exe
   - Add arguments: (leave empty)
   - **Important:** Check "Run with highest privileges"

5. **Finish:**
   - Check "Open Properties"
   - Click Finish
   - In Properties, ensure "Run with highest privileges" is checked

6. **Test:**
   - Restart computer
   - ThrottleStop should start automatically
   - Power limits should be applied

---

## 📊 Expected Results

### **Performance Improvements:**
- **Sustained Performance:** 10-20% better (less throttling)
- **Boost Performance:** 15-25% better (higher PL2)
- **Gaming:** 5-15% FPS increase (CPU-bound games)
- **Rendering:** 10-20% faster (CPU-intensive tasks)

### **Trade-offs:**
- **Battery Life:** 30-50% reduction
- **Heat:** 10-20°C increase
- **Fan Noise:** Much louder (fans run faster)
- **Laptop Temperature:** Noticeably hotter

---

## ✅ Quick Checklist

Before Removing Power Limits:
- [ ] ThrottleStop downloaded and extracted
- [ ] Run as Administrator
- [ ] Monitoring tool installed (HWMonitor/Core Temp)
- [ ] Laptop plugged into AC power
- [ ] Laptop on hard surface (not bed/couch)
- [ ] Vents cleaned (good airflow)
- [ ] Backup important data

Removing Power Limits:
- [ ] Open ThrottleStop as Administrator
- [ ] Click "TPL" button
- [ ] Uncheck "Disable Controls"
- [ ] Increase PL1 gradually (start 20W)
- [ ] Increase PL2 gradually (start 30W)
- [ ] Click "Apply"
- [ ] Click "OK"

Testing:
- [ ] Monitor temperatures (stay below 90°C)
- [ ] Run stress test (Prime95, 10-15 min)
- [ ] Check for stability issues
- [ ] Verify performance improvement
- [ ] Set ThrottleStop to auto-start

---

## 🎯 Summary

**To remove power limits in ThrottleStop:**

1. **Run ThrottleStop as Administrator**
2. **Click "TPL" button**
3. **Uncheck "Disable Controls"**
4. **Increase PL1** (Long Power) - start with 20W
5. **Increase PL2** (Short Power) - start with 30W
6. **Click "Apply"**
7. **Monitor temperatures constantly**
8. **Test stability**

**Remember:**
- Start with small increases
- Monitor temperatures closely
- Only use when plugged into AC power
- Be prepared to reduce if too hot

**Good luck! 🔋**

