# How to Edit Existing GitLab CI/CD Variable

## 🔍 Issue: "Variables key has already been taken"

This means `USE_GEMINI_LIVE` already exists. You need to **edit** it, not create a new one.

## ✅ Solution: Edit Existing Variable

### Step-by-Step:

1. **Go to Variables List**
   - Navigate to: **Settings** → **CI/CD** → **Variables**
   - You should see `USE_GEMINI_LIVE` in the list

2. **Find the Variable**
   - Look for `USE_GEMINI_LIVE` in the variables table
   - Check its current value (might show `***` if masked, or the actual value)

3. **Edit the Variable**
   - Click the **Edit icon** (pencil/pen icon) next to `USE_GEMINI_LIVE`
   - OR click on the variable name/row

4. **Update the Settings**
   - **Value**: Change to `true` (if it's not already)
   - **Visibility**: Change to **"Visible"** (if it's currently masked and causing issues)
   - **Flags**: 
     - Uncheck **"Protect variable"** (unless you need it)
     - Leave **"Expand variable reference"** unchecked
   - **Description**: Add "Enable Gemini live models for unlimited RPM/RPD" (optional)

5. **Save Changes**
   - Click **"Update variable"** or **"Save"** button

## 🔍 Verify Current Value

If you want to check what the current value is:

1. Look at the variable in the list
2. If it shows `***`, it's masked - click Edit to see the actual value
3. If it shows the value directly, you can see it

## ⚠️ Common Scenarios

### Scenario 1: Variable exists but value is wrong
- **Action**: Edit and change Value to `true`

### Scenario 2: Variable exists but is masked (and too short)
- **Action**: Edit and change Visibility to "Visible"

### Scenario 3: Variable exists but is protected
- **Action**: Edit and uncheck "Protect variable" (unless you need it)

## ✅ After Editing

Once you've updated the variable:
- The next pipeline run will use the new value
- You should see `USE_GEMINI_LIVE=true` in the pipeline environment
- Live models will be enabled automatically

## 🧪 Test

After editing, trigger a new pipeline and check the logs for:
```
[INFO] Attempting to use live model: gemini-2.5-flash-live
```

This confirms the variable is working correctly.

