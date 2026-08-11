# ⚡ Speed Shift EPP Guide - Complete Explanation

## 📖 What is Speed Shift EPP?

**Speed Shift EPP** stands for **"Energy Performance Preference"**

It's a feature in modern Intel CPUs (6th generation and newer) that controls how aggressively the CPU responds to workload demands and manages power consumption.

---

## 🔍 Understanding Speed Shift Technology

### **Speed Shift (Without EPP)**
- Intel's technology that allows the CPU to change frequency very quickly
- Can adjust frequency in microseconds (much faster than older methods)
- CPU can respond instantly to workload changes

### **Speed Shift EPP (Energy Performance Preference)**
- Adds a **preference setting** to Speed Shift
- Controls the **balance** between performance and power efficiency
- You can tell the CPU: "Prioritize performance" or "Prioritize battery life"

---

## 🎯 How EPP Works

**EPP is a value from 0 to 255:**

- **0 = Maximum Performance** (CPU boosts aggressively, uses more power)
- **128 = Balanced** (Default, balanced between performance and efficiency)
- **255 = Maximum Efficiency** (CPU conserves power, less aggressive boosting)

### **What EPP Controls:**

1. **Boost Behavior:**
   - How quickly CPU boosts to higher frequencies
   - How long CPU stays at high frequencies
   - How aggressively CPU responds to workload

2. **Power Management:**
   - How CPU balances performance vs power consumption
   - When CPU drops to lower frequencies
   - How CPU manages idle states

3. **Responsiveness:**
   - How quickly CPU responds to sudden workload increases
   - How CPU handles burst workloads

---

## 📊 EPP Value Breakdown

### **Performance Range (0-84): Maximum Performance**

| EPP Value | Behavior | Use Case |
|-----------|----------|----------|
| **0** | Maximum performance, fastest boosting | Gaming, rendering, heavy workloads |
| **25** | Very high performance | High-performance tasks |
| **50** | High performance | General high-performance use |
| **84** | Performance-oriented | Balanced performance |

**Characteristics:**
- CPU boosts to maximum frequency quickly
- Stays at high frequencies longer
- More power consumption
- Better for performance-critical tasks

### **Balanced Range (85-170): Balanced**

| EPP Value | Behavior | Use Case |
|-----------|----------|----------|
| **128** | Balanced (Default) | General use, Windows default |
| **150** | Slightly efficiency-oriented | Light performance tasks |

**Characteristics:**
- Balanced between performance and efficiency
- Good for general computing
- Windows default setting

### **Efficiency Range (171-255): Maximum Efficiency**

| EPP Value | Behavior | Use Case |
|-----------|----------|----------|
| **192** | Efficiency-oriented | Light tasks, battery saving |
| **255** | Maximum efficiency | Maximum battery life, minimal performance |

**Characteristics:**
- CPU is less aggressive with boosting
- Drops to lower frequencies faster
- Less power consumption
- Better battery life
- May feel slower for demanding tasks

---

## 🛠️ Using Speed Shift EPP in ThrottleStop

### **Step 1: Enable Speed Shift**

1. **Open ThrottleStop**
2. **Check "Speed Shift - EPP"** checkbox
3. **Set EPP value** (0-255)
4. **Click "Turn On"**

### **Step 2: Choose EPP Value**

**For Maximum Performance (Gaming, Rendering):**
- Set EPP to **0**
- CPU will boost aggressively
- Best performance, higher power consumption

**For Balanced Use:**
- Set EPP to **128** (default)
- Good balance of performance and efficiency

**For Battery Saving:**
- Set EPP to **192-255**
- CPU conserves power
- Longer battery life, may feel slower

### **Step 3: Apply Settings**

1. **Click "Turn On"** in ThrottleStop
2. **Settings apply immediately**
3. **EPP value is saved** to ThrottleStop.ini

---

## 🎮 Real-World Examples

### **Example 1: Gaming**

**Scenario:** Playing a CPU-intensive game

**Recommended EPP:** 0-50

**Why:**
- Game needs consistent high performance
- CPU should boost quickly and stay boosted
- Power consumption is less important (plugged in)

**Result:**
- Higher FPS
- More consistent frame times
- Better gaming experience

### **Example 2: Web Browsing**

**Scenario:** Browsing internet, watching videos

**Recommended EPP:** 128-150

**Why:**
- Tasks are not CPU-intensive
- Don't need maximum performance
- Balanced is sufficient

**Result:**
- Smooth browsing
- Good battery life
- Quiet operation (less heat)

### **Example 3: Battery Mode**

**Scenario:** Using laptop on battery, need long battery life

**Recommended EPP:** 192-255

**Why:**
- Maximize battery life
- Performance is less critical
- CPU should conserve power

**Result:**
- Longer battery life
- Laptop runs cooler
- Quieter operation
- May feel slower for demanding tasks

---

## ⚙️ EPP vs Other Power Settings

### **EPP vs Windows Power Plans**

**Windows Power Plans:**
- High Performance: Usually sets EPP to 0
- Balanced: Usually sets EPP to 128
- Power Saver: Usually sets EPP to 255

**ThrottleStop EPP:**
- Overrides Windows power plan EPP setting
- More precise control (0-255 range)
- Can fine-tune exactly what you want

### **EPP vs CPU Multiplier**

**CPU Multiplier:**
- Locks CPU to specific frequency
- Fixed speed (e.g., always 4.0GHz)

**EPP:**
- Controls boost behavior
- CPU still varies frequency based on workload
- More flexible, adaptive

### **EPP vs Undervolting**

**Undervolting:**
- Reduces CPU voltage
- Lower temperatures
- Same performance, less power

**EPP:**
- Controls frequency behavior
- Can improve or reduce performance
- Works alongside undervolting

**Best Combination:**
- Undervolt (reduce voltage)
- Set EPP to 0 (maximum performance)
- Result: Better performance with lower temperatures

---

## 📈 Performance Impact

### **EPP = 0 (Maximum Performance)**

**Performance:**
- ✅ Fastest response to workload
- ✅ Highest sustained frequencies
- ✅ Best for CPU-intensive tasks
- ✅ 5-15% better performance in some tasks

**Trade-offs:**
- ❌ Higher power consumption
- ❌ More heat generated
- ❌ Shorter battery life
- ❌ Fan runs more often

### **EPP = 128 (Balanced)**

**Performance:**
- ✅ Good for general use
- ✅ Adequate for most tasks
- ✅ Balanced performance/efficiency

**Trade-offs:**
- ⚖️ Moderate power consumption
- ⚖️ Moderate heat
- ⚖️ Moderate battery life

### **EPP = 255 (Maximum Efficiency)**

**Performance:**
- ✅ Longest battery life
- ✅ Coolest operation
- ✅ Quietest operation
- ❌ May feel slow for demanding tasks
- ❌ 10-20% less performance in some tasks

**Trade-offs:**
- ❌ Lower performance
- ❌ May feel sluggish
- ❌ Not ideal for gaming/rendering

---

## 🔧 Advanced EPP Settings

### **Dynamic EPP (Advanced)**

Some systems support dynamic EPP that changes based on:
- AC vs Battery power
- CPU temperature
- Workload type

**ThrottleStop:**
- Can set fixed EPP value
- Overrides dynamic behavior
- Gives you full control

### **EPP with Power Limits**

**Combination:**
- Set EPP to 0 (maximum performance)
- Increase power limits (PL1/PL2)
- Result: Maximum performance with higher power limits

**Example:**
- EPP = 0
- PL1 = 25W
- PL2 = 35W
- CPU will boost aggressively and use available power

---

## 🎯 Recommended EPP Settings

### **For Your i7-10810U (Laptop)**

**Gaming/Heavy Workloads (Plugged In):**
- **EPP: 0**
- Maximum performance
- Best for CPU-intensive tasks

**General Use (Plugged In):**
- **EPP: 50-84**
- High performance
- Good balance

**General Use (Battery):**
- **EPP: 128-150**
- Balanced
- Good battery life

**Maximum Battery Life:**
- **EPP: 192-255**
- Maximum efficiency
- Longest battery life

---

## ⚠️ Important Notes

### **Compatibility**

**Speed Shift EPP requires:**
- Intel 6th generation CPU or newer (Skylake+)
- Your i7-10810U: ✅ **Supports Speed Shift EPP**
- Windows 10/11 (properly configured)

### **If EPP Doesn't Work**

1. **Check CPU Support:**
   - Your CPU must support Speed Shift
   - i7-10810U supports it

2. **Check Windows Settings:**
   - Some Windows power settings may override
   - Set Windows to "High Performance" mode

3. **BIOS Settings:**
   - Some BIOS may disable Speed Shift
   - Check BIOS for "Speed Shift" or "SpeedStep" settings

4. **ThrottleStop:**
   - Must run as Administrator
   - Check "Speed Shift - EPP" checkbox
   - Click "Turn On"

---

## 📊 EPP Value Quick Reference

| EPP Value | Performance | Power | Use Case |
|-----------|-------------|-------|----------|
| **0** | Maximum | High | Gaming, Rendering |
| **25** | Very High | High | High-performance tasks |
| **50** | High | Medium-High | Performance tasks |
| **84** | Performance | Medium | Performance-oriented |
| **128** | Balanced | Medium | General use (Default) |
| **150** | Balanced | Medium-Low | Light performance |
| **192** | Efficiency | Low | Battery saving |
| **255** | Maximum Efficiency | Very Low | Maximum battery life |

---

## ✅ Quick Setup Guide

### **For Maximum Performance:**

1. Open ThrottleStop as Administrator
2. Check "Speed Shift - EPP"
3. Set EPP value to **0**
4. Click "Turn On"
5. Done!

### **For Balanced Use:**

1. Open ThrottleStop as Administrator
2. Check "Speed Shift - EPP"
3. Set EPP value to **128** (default)
4. Click "Turn On"
5. Done!

### **For Battery Saving:**

1. Open ThrottleStop as Administrator
2. Check "Speed Shift - EPP"
3. Set EPP value to **192-255**
4. Click "Turn On"
5. Done!

---

## 🎓 Summary

**Speed Shift EPP (Energy Performance Preference):**
- Controls how aggressively CPU boosts frequency
- Value range: 0 (max performance) to 255 (max efficiency)
- Lower number = more performance, more power
- Higher number = less performance, less power
- Works alongside other settings (undervolting, power limits)

**For Your i7-10810U:**
- ✅ Supports Speed Shift EPP
- **Recommended for performance:** EPP = 0
- **Recommended for balanced:** EPP = 128
- **Recommended for battery:** EPP = 192-255

**Best Practice:**
- Set EPP to 0 when plugged in (maximum performance)
- Set EPP to 128-192 when on battery (balanced/efficiency)
- Combine with undervolting for best results

---

**Now you understand Speed Shift EPP! ⚡**

