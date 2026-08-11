# 🌡️ PROCHOT (Processor Hot) - Complete Guide

## 📖 What is PROCHOT?

**PROCHOT** stands for **"Processor Hot"**

It's Intel's thermal protection mechanism that activates when the CPU reaches a critical temperature threshold to prevent permanent damage.

---

## 🔥 PROCHOT Temperature Thresholds

### **Standard PROCHOT Threshold:**

**Most Intel CPUs:**
- **PROCHOT activates at: 100°C (212°F)**
- This is the **maximum safe operating temperature**
- CPU will throttle aggressively to prevent exceeding this

### **Your Situation (98°C):**

**At 98°C:**
- ✅ You're **2°C below** the PROCHOT threshold
- ⚠️ **Very close to critical temperature**
- CPU may already be throttling to prevent reaching 100°C
- System is in **danger zone**

**At 99°C:**
- ⚠️ **1°C away from PROCHOT activation**
- CPU will throttle **very aggressively**
- Performance will drop significantly
- System trying desperately to cool down

**At 100°C (PROCHOT Activated):**
- 🚨 **CRITICAL TEMPERATURE**
- CPU throttles to **minimum frequency** (usually base clock or lower)
- Performance drops to **near-zero**
- System may become **unresponsive**
- Risk of **thermal shutdown**

---

## ⚠️ What Happens at Different Temperatures

### **90-95°C: Warning Zone**
- CPU starts throttling moderately
- Performance begins to degrade
- Fan runs at maximum speed
- System still functional but slower

### **95-98°C: Danger Zone** ⚠️
- **You are here!**
- Aggressive throttling begins
- CPU frequency drops significantly
- Performance severely impacted
- Risk of reaching PROCHOT threshold

### **98-99°C: Critical Zone** 🚨
- **Extreme throttling**
- CPU drops to very low frequencies
- System may become laggy/unresponsive
- **1-2°C away from PROCHOT activation**
- **IMMEDIATE ACTION REQUIRED**

### **100°C: PROCHOT Activated** 🔥
- **Maximum thermal protection activated**
- CPU throttles to **minimum possible speed**
- Performance drops to **near-zero**
- System may freeze or become unresponsive
- Risk of **automatic shutdown**

### **Above 100°C: Emergency Shutdown** 💥
- **THERMAL SHUTDOWN** may occur
- System automatically powers off
- Prevents permanent CPU damage
- BIOS/UEFI may prevent boot until cooled

---

## 🛡️ PROCHOT Protection Mechanisms

### **What PROCHOT Does:**

1. **Aggressive Frequency Reduction:**
   - CPU drops to base clock or lower
   - Multiplier reduced to minimum
   - All cores throttled simultaneously

2. **Voltage Reduction:**
   - CPU voltage reduced automatically
   - Less power = less heat
   - Helps cool down faster

3. **Core Parking:**
   - Some cores may be disabled temporarily
   - Reduces total heat generation
   - System runs on fewer cores

4. **Thermal Shutdown (If PROCHOT Fails):**
   - If temperature continues rising
   - System automatically shuts down
   - Prevents permanent damage

---

## 🚨 Immediate Actions at 98-99°C

### **If You're at 98°C RIGHT NOW:**

1. **STOP ALL INTENSIVE TASKS:**
   - Close all CPU-intensive programs
   - Stop gaming, rendering, stress tests
   - Let CPU cool down

2. **Improve Cooling IMMEDIATELY:**
   - Clean laptop vents (may be blocked)
   - Use cooling pad
   - Ensure laptop is on hard surface (not bed/couch)
   - Point fan directly at laptop

3. **Reduce Power Limits:**
   - Open ThrottleStop
   - Lower PL1 and PL2 immediately
   - Set PL1 to 15W (default)
   - Set PL2 to 20W
   - This will reduce heat generation

4. **Reduce EPP:**
   - Set EPP to 128 or higher (less aggressive boosting)
   - Less boosting = less heat

5. **Undervolt (If Not Already):**
   - Reduce CPU voltage
   - Lower voltage = less heat
   - Use ThrottleStop FIVR window

6. **Monitor Temperature:**
   - Keep HWMonitor or Core Temp open
   - Watch temperature drop
   - Don't resume intensive tasks until <85°C

---

## 🔧 Long-Term Solutions

### **1. Improve Cooling:**

**Physical Cooling:**
- Clean laptop vents (compressed air)
- Replace thermal paste (if comfortable doing so)
- Use cooling pad
- Ensure good airflow

**Software Cooling:**
- Reduce power limits
- Undervolt CPU
- Set EPP higher (less aggressive)
- Disable turbo boost (if needed)

### **2. Reduce Power Limits:**

**In ThrottleStop TPL Window:**
- Set PL1 to 15-20W (from 25-30W)
- Set PL2 to 20-25W (from 35-40W)
- Less power = less heat

### **3. Undervolt:**

**In ThrottleStop FIVR Window:**
- Reduce core voltage offset
- Start with -50mV
- Test stability
- Lower voltage = less heat

### **4. Adjust EPP:**

**In ThrottleStop:**
- Set EPP to 128-192 (less aggressive boosting)
- Less boosting = less heat
- Better for battery life too

---

## 📊 Temperature Safety Guidelines

### **Safe Operating Temperatures:**

| Temperature | Status | Action |
|-------------|--------|--------|
| **<70°C** | ✅ Safe | Normal operation |
| **70-80°C** | ✅ Acceptable | Monitor, but OK |
| **80-85°C** | ⚠️ Warm | Monitor closely |
| **85-90°C** | ⚠️ Hot | Reduce workload |
| **90-95°C** | 🚨 Very Hot | **Reduce power/stop intensive tasks** |
| **95-98°C** | 🔥 Critical | **IMMEDIATE ACTION REQUIRED** |
| **98-99°C** | 💥 Extreme | **STOP EVERYTHING, COOL DOWN** |
| **100°C+** | 💀 PROCHOT | **THERMAL SHUTDOWN RISK** |

### **For Your i7-10810U:**

**Recommended Maximum:**
- **Idle:** 40-50°C
- **Light Load:** 60-75°C
- **Heavy Load:** 75-85°C (maximum safe)
- **Above 85°C:** Reduce power/workload
- **Above 90°C:** **STOP - Too hot!**

---

## 🔍 Understanding PROCHOT in ThrottleStop

### **How to See PROCHOT:**

1. **Open ThrottleStop**
2. **Click "Limits" button**
3. **Look for "PROCHOT" indicator:**
   - If lit up (red), PROCHOT is active
   - CPU is at or near 100°C
   - Extreme throttling is happening

### **PROCHOT vs Other Throttling:**

| Indicator | Meaning | Temperature |
|-----------|---------|-------------|
| **PL1/PL2** | Power limit throttling | Any temp |
| **THERMAL** | Thermal throttling | 90-100°C |
| **PROCHOT** | Processor hot (critical) | 100°C |
| **BD PROCHOT** | External component reporting hot | Varies |

### **What to Do if PROCHOT is Active:**

1. **STOP ALL TASKS IMMEDIATELY**
2. **Let CPU cool down**
3. **Check cooling system**
4. **Reduce power limits**
5. **Don't resume until <85°C**

---

## ⚙️ ThrottleStop Settings to Prevent PROCHOT

### **Emergency Cooling Settings:**

**TPL Window (Power Limits):**
- PL1: **15W** (default, minimum)
- PL2: **20W** (low boost)
- Time Limit: **28 seconds** (short boost)

**FIVR Window (Voltage):**
- Core Voltage Offset: **-100mV** (if stable)
- Cache Voltage Offset: **-100mV** (if stable)
- Lower voltage = less heat

**Main Window (EPP):**
- EPP: **192-255** (maximum efficiency)
- Less aggressive boosting
- Less heat generation

**Options Window:**
- Check "Disable Turbo" (if needed)
- Prevents high-frequency boosting
- Reduces heat significantly

---

## 🚨 Warning Signs

### **If You See These, Take Action:**

1. **Temperature >90°C:**
   - Reduce power limits immediately
   - Stop intensive tasks

2. **PROCHOT Indicator Lit:**
   - CPU at 100°C
   - Extreme throttling active
   - **STOP EVERYTHING**

3. **System Becomes Unresponsive:**
   - CPU throttled to minimum
   - May be near thermal shutdown
   - Let system cool down

4. **Fan Running at Maximum Constantly:**
   - Cooling system overwhelmed
   - Temperature too high
   - Reduce workload

5. **Laptop Feels Very Hot to Touch:**
   - External temperature high
   - Internal temperature even higher
   - **DANGER - Cool down immediately**

---

## 💡 Prevention Tips

### **To Avoid Reaching 98-99°C:**

1. **Monitor Temperatures:**
   - Keep HWMonitor or Core Temp open
   - Watch temperatures constantly
   - Set alarms at 85°C

2. **Set Conservative Power Limits:**
   - Don't push power limits too high
   - Start conservative, increase gradually
   - Monitor temperatures at each step

3. **Improve Cooling:**
   - Clean vents regularly
   - Use cooling pad
   - Ensure good airflow

4. **Undervolt:**
   - Lower voltage = less heat
   - Can reduce temps by 5-15°C
   - Very effective

5. **Adjust EPP:**
   - Higher EPP = less aggressive boosting
   - Less heat generation
   - Better for sustained workloads

---

## 📊 What Happens at 99°C vs 100°C

### **At 99°C:**
- ⚠️ **1°C from PROCHOT**
- Extreme throttling
- CPU frequency drops significantly
- Performance severely impacted
- System trying to cool down
- **Still functional but barely**

### **At 100°C (PROCHOT Activated):**
- 🚨 **CRITICAL THRESHOLD**
- CPU throttles to **minimum frequency**
- Performance drops to **near-zero**
- System may become **unresponsive**
- Risk of **thermal shutdown**
- **CPU protection fully active**

### **Above 100°C:**
- 💥 **THERMAL SHUTDOWN**
- System automatically powers off
- Prevents permanent damage
- Must cool down before restart
- BIOS may prevent boot until cooled

---

## ✅ Summary

**At 98°C:**
- ⚠️ **Very close to PROCHOT (100°C)**
- **IMMEDIATE ACTION REQUIRED**
- Reduce power limits, improve cooling
- Stop intensive tasks

**At 99°C:**
- 🚨 **1°C from PROCHOT activation**
- Extreme throttling
- **STOP EVERYTHING**
- Cool down immediately

**At 100°C:**
- 💥 **PROCHOT ACTIVATED**
- CPU throttles to minimum
- Performance near-zero
- Risk of thermal shutdown

**Action Plan:**
1. **Reduce power limits NOW** (PL1: 15W, PL2: 20W)
2. **Improve cooling** (clean vents, cooling pad)
3. **Undervolt** (reduce voltage)
4. **Set EPP higher** (less aggressive)
5. **Monitor temperatures** constantly
6. **Don't exceed 85°C** for sustained workloads

**Your laptop is running dangerously hot at 98°C. Take immediate action to reduce temperatures!**

---

**Stay safe and keep your CPU cool! 🌡️❄️**

