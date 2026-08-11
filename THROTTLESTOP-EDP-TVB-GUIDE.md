# 🔍 ThrottleStop: EDP Other & TVB Explained

## 📖 Overview

**EDP Other** and **TVB** are throttling mechanisms that ThrottleStop can monitor and control. Understanding these helps you diagnose why your CPU might be throttling.

---

## ⚡ EDP Other (Electrical Design Point - Other)

### **What is EDP Other?**

**EDP Other** stands for **"Electrical Design Point - Other"**

It's a throttling mechanism that limits CPU performance when the system detects that other components (besides the CPU cores) are drawing too much power or exceeding electrical limits.

### **What Triggers EDP Other?**

**EDP Other throttling occurs when:**

1. **Integrated Graphics (iGPU) Power:**
   - Your CPU has integrated graphics (most Intel CPUs do)
   - iGPU is using too much power
   - System throttles CPU to stay within total power budget

2. **Uncore/System Agent Power:**
   - Memory controller power
   - PCIe controller power
   - Other CPU subsystems using power
   - Total system power exceeds limits

3. **Package Power Limit:**
   - Total CPU package (CPU + iGPU + uncore) exceeds limit
   - System throttles to protect components

4. **Platform Power Limit:**
   - Entire laptop platform power limit
   - Includes CPU, GPU, RAM, storage, etc.
   - Laptop manufacturer sets this limit

### **How to See EDP Other in ThrottleStop**

1. **Open ThrottleStop**
2. **Click "Limits" button**
3. **Look for "EDP OTHER" indicator:**
   - If lit up (red/yellow), EDP Other throttling is active
   - Shows when CPU is being throttled due to other components

### **How to Fix EDP Other Throttling**

**Option 1: Reduce iGPU Power (If Using iGPU)**
- Lower iGPU frequency/voltage
- Reduce graphics workload
- Use dedicated GPU instead (if available)

**Option 2: Reduce CPU Power Limits**
- Lower PL1 and PL2 in TPL window
- Less CPU power = more headroom for other components
- Trade-off: Less CPU performance

**Option 3: Increase Package Power Limit (If Supported)**
- Some laptops allow increasing package power limit
- Check TPL window for "Package Power Limit"
- **Warning:** May cause overheating

**Option 4: Disable iGPU (If Using Dedicated GPU)**
- Disable integrated graphics in BIOS
- Frees up power budget for CPU
- Only if you have dedicated GPU

### **EDP Other vs EDP Core**

- **EDP Core:** CPU cores exceeding power limit
- **EDP Other:** Other components (iGPU, uncore) exceeding power limit
- Both can cause throttling
- EDP Other is less common but can be problematic

---

## 🌡️ TVB (Thermal Velocity Boost)

### **What is TVB?**

**TVB** stands for **"Thermal Velocity Boost"**

It's an Intel technology that allows the CPU to boost to **higher frequencies** when:
- CPU temperature is **below a certain threshold** (usually 70°C)
- There's **thermal headroom** available
- CPU can safely run faster

### **How TVB Works**

**Normal Turbo Boost:**
- CPU boosts to rated turbo frequency
- Example: i7-10810U boosts to 4.9GHz

**TVB (Thermal Velocity Boost):**
- CPU can boost **even higher** if temperature allows
- Example: i7-10810U might boost to 5.0GHz+ if cool enough
- Only works when CPU is below temperature threshold

**Temperature Threshold:**
- Usually around **70°C**
- If CPU temp < 70°C: TVB can activate
- If CPU temp > 70°C: TVB disabled, normal turbo only

### **TVB in ThrottleStop**

**ThrottleStop can:**
- **Enable/Disable TVB:**
  - Check/uncheck "Disable TVB" in Options
  - Disabling TVB prevents extra boost
  - May help with stability

- **Monitor TVB:**
  - TVB status shown in ThrottleStop
  - Shows if TVB is active

### **Should You Enable or Disable TVB?**

**Enable TVB (Default):**
- ✅ Higher performance when CPU is cool
- ✅ Better single-core performance
- ✅ Automatic (only when safe)
- ❌ May cause instability if CPU gets hot quickly
- ❌ Can cause higher temperatures

**Disable TVB:**
- ✅ More stable performance
- ✅ More predictable behavior
- ✅ Lower peak temperatures
- ❌ Slightly less performance
- ❌ Won't get extra boost

**Recommendation:**
- **Keep TVB enabled** if your cooling is good
- **Disable TVB** if you experience instability or high temps

---

## 🔍 Understanding ThrottleStop Limits Window

### **How to Access:**

1. **Open ThrottleStop**
2. **Click "Limits" button**
3. **See all throttling indicators**

### **Common Throttling Indicators:**

| Indicator | Meaning | What It Means |
|-----------|---------|---------------|
| **PL1** | Power Limit 1 | Long-term power limit reached |
| **PL2** | Power Limit 2 | Short-term power limit reached |
| **EDP OTHER** | Electrical Design Point - Other | Other components (iGPU, uncore) using too much power |
| **EDP CORE** | Electrical Design Point - Core | CPU cores using too much power |
| **THERMAL** | Thermal Throttling | CPU too hot (usually >90-100°C) |
| **PROCHOT** | Processor Hot | CPU temperature limit reached |
| **BD PROCHOT** | Bi-Directional PROCHOT | External component reporting CPU is hot |
| **RING** | Ring/Uncore Throttling | CPU uncore throttling |

### **What to Look For:**

**If EDP OTHER is lit:**
- Other components (iGPU, uncore) are using too much power
- CPU is being throttled to stay within power budget
- Solution: Reduce iGPU usage or lower CPU power limits

**If TVB is disabled:**
- CPU won't get extra boost when cool
- May want to enable if cooling is good
- Check Options window for "Disable TVB" setting

---

## 🛠️ Practical Examples

### **Example 1: EDP Other Throttling**

**Symptom:**
- CPU performance drops during gaming
- ThrottleStop shows "EDP OTHER" lit up
- CPU isn't hot, but still throttling

**Cause:**
- Integrated graphics using too much power
- Total package power exceeds limit
- System throttles CPU to protect components

**Solution:**
1. Check if using iGPU
2. If using dedicated GPU, disable iGPU in BIOS
3. Or reduce CPU power limits (PL1/PL2)
4. Or reduce graphics settings (if using iGPU)

### **Example 2: TVB Not Working**

**Symptom:**
- CPU never boosts above rated turbo
- Should get extra boost but doesn't

**Cause:**
- TVB might be disabled
- CPU temperature too high (>70°C)
- BIOS might have disabled TVB

**Solution:**
1. Check ThrottleStop Options → "Disable TVB" (should be unchecked)
2. Improve cooling (lower temps below 70°C)
3. Check BIOS for TVB settings

### **Example 3: Multiple Throttling**

**Symptom:**
- Multiple indicators lit in Limits window
- EDP OTHER + PL1 + THERMAL all active

**Cause:**
- Multiple throttling mechanisms active
- System is heavily constrained

**Solution:**
1. Address thermal throttling first (improve cooling)
2. Then address power limits (increase if possible)
3. Finally address EDP OTHER (reduce iGPU/uncore power)

---

## ⚙️ ThrottleStop Settings for EDP Other & TVB

### **To Monitor EDP Other:**

1. **Open ThrottleStop**
2. **Click "Limits" button**
3. **Watch for "EDP OTHER" indicator**
4. **If lit, other components are causing throttling**

### **To Control TVB:**

1. **Open ThrottleStop**
2. **Click "Options" button**
3. **Find "Disable TVB" checkbox:**
   - **Unchecked** = TVB enabled (can get extra boost)
   - **Checked** = TVB disabled (no extra boost)
4. **Click OK**

### **Recommended Settings:**

**For Maximum Performance:**
- TVB: **Enabled** (unchecked "Disable TVB")
- Monitor EDP OTHER in Limits window
- If EDP OTHER active, reduce iGPU usage or lower CPU power

**For Stability:**
- TVB: **Disabled** (checked "Disable TVB")
- More predictable performance
- Less aggressive boosting

**For Battery Life:**
- TVB: **Disabled**
- Less aggressive boosting = less power
- Better battery life

---

## 📊 EDP Other vs Other Throttling Types

### **EDP Other vs EDP Core:**

| Type | What's Throttling | Cause |
|------|-------------------|-------|
| **EDP CORE** | CPU cores | CPU cores using too much power |
| **EDP OTHER** | Other components | iGPU, uncore, memory controller using too much power |

### **EDP Other vs Thermal Throttling:**

| Type | Trigger | Solution |
|------|---------|----------|
| **EDP OTHER** | Power limit (other components) | Reduce iGPU/uncore power, lower CPU power |
| **THERMAL** | Temperature too high | Improve cooling, reduce overclock/power |

### **EDP Other vs Power Limit Throttling:**

| Type | What's Limited | Solution |
|------|----------------|----------|
| **PL1/PL2** | CPU power directly | Increase power limits (if possible) |
| **EDP OTHER** | Total package power (CPU + other) | Reduce other components' power usage |

---

## 🎯 Quick Reference

### **EDP Other:**
- **What:** Throttling due to other components (iGPU, uncore) using too much power
- **See it:** Limits window → "EDP OTHER" indicator
- **Fix it:** Reduce iGPU usage, disable iGPU, or lower CPU power limits

### **TVB:**
- **What:** Extra CPU boost when temperature is low (<70°C)
- **Control it:** Options window → "Disable TVB" checkbox
- **Enable:** Uncheck "Disable TVB" (get extra boost when cool)
- **Disable:** Check "Disable TVB" (more stable, no extra boost)

---

## ✅ Summary

**EDP Other:**
- Throttling caused by other components (iGPU, uncore) using too much power
- Shown in ThrottleStop Limits window
- Fix by reducing iGPU usage or lowering CPU power limits

**TVB (Thermal Velocity Boost):**
- Extra CPU boost when temperature is below threshold (~70°C)
- Can enable/disable in ThrottleStop Options
- Enable for maximum performance (if cooling is good)
- Disable for stability or battery life

**Both are important to understand when diagnosing CPU throttling issues!**

---

**Now you understand EDP Other and TVB! 🔍⚡**

