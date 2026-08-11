# Quick Column Setup Guide for Supabase

## ⚠️ IMPORTANT: Do NOT Import the CSV File

The CSV file (`planet_claims_table_columns.csv`) is a **reference document only**. 
**Do NOT use "Import data from CSV"** - that will import the wrong data!

Instead, **manually add each column** using the "Add column" button.

---

## Step-by-Step: Add Each Column Manually

### 1. First, delete any default columns
- Remove the default `id` (int8) if it exists
- Remove the default `created_at` if it exists

### 2. Add Column 1: `id`
Click **"Add column"** and set:
- **Name:** `id`
- **Type:** Select `uuid` from dropdown
- **Default Value:** Type `gen_random_uuid()`
- **Is Nullable:** ❌ **UNCHECK**
- **Is Primary Key:** ✅ **CHECK**

### 3. Add Column 2: `user_id`
Click **"Add column"** and set:
- **Name:** `user_id`
- **Type:** Select `uuid` from dropdown
- **Default Value:** (leave empty)
- **Is Nullable:** ❌ **UNCHECK**

### 4. Add Column 3: `username`
Click **"Add column"** and set:
- **Name:** `username`
- **Type:** Select `text` from dropdown
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECK**

### 5. Add Column 4: `email`
Click **"Add column"** and set:
- **Name:** `email`
- **Type:** Select `text` from dropdown
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECK**

### 6. Add Column 5: `kepid`
Click **"Add column"** and set:
- **Name:** `kepid`
- **Type:** Select `bigint` from dropdown
- **Default Value:** (leave empty)
- **Is Nullable:** ❌ **UNCHECK**

### 7. Add Column 6: `planet_data`
Click **"Add column"** and set:
- **Name:** `planet_data`
- **Type:** Select `jsonb` from dropdown
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECK**

### 8. Add Column 7: `status`
Click **"Add column"** and set:
- **Name:** `status`
- **Type:** Select `text` from dropdown
- **Default Value:** Type `'active'` (with single quotes)
- **Is Nullable:** ❌ **UNCHECK**

### 9. Add Column 8: `claimed_at`
Click **"Add column"** and set:
- **Name:** `claimed_at`
- **Type:** Select `timestamptz` from dropdown
- **Default Value:** Type `now()`
- **Is Nullable:** ❌ **UNCHECK**

### 10. Add Column 9: `certificate_number`
Click **"Add column"** and set:
- **Name:** `certificate_number`
- **Type:** Select `text` from dropdown
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECK**

### 11. Add Column 10: `created_at`
Click **"Add column"** and set:
- **Name:** `created_at`
- **Type:** Select `timestamptz` from dropdown
- **Default Value:** Type `now()`
- **Is Nullable:** ❌ **UNCHECK**

### 12. Add Column 11: `updated_at`
Click **"Add column"** and set:
- **Name:** `updated_at`
- **Type:** Select `timestamptz` from dropdown
- **Default Value:** Type `now()`
- **Is Nullable:** ❌ **UNCHECK**

---

## After Adding All Columns

1. ✅ Make sure **"Enable Row Level Security (RLS)"** is checked
2. Click **"Save"** or **"Create table"** button
3. After saving, go to **"Authentication" → "Policies"** to add RLS policies

---

## Visual Summary

Your table should have **11 columns total**:

1. ✅ `id` (uuid, primary key)
2. ✅ `user_id` (uuid, not null)
3. ✅ `username` (text, nullable)
4. ✅ `email` (text, nullable)
5. ✅ `kepid` (bigint, not null)
6. ✅ `planet_data` (jsonb, nullable)
7. ✅ `status` (text, default 'active', not null)
8. ✅ `claimed_at` (timestamptz, default now(), not null)
9. ✅ `certificate_number` (text, nullable)
10. ✅ `created_at` (timestamptz, default now(), not null)
11. ✅ `updated_at` (timestamptz, default now(), not null)

---

## Need Help?

If you see "Warning: No primary keys selected", make sure:
- The `id` column has **"Is Primary Key"** ✅ CHECKED
- The `id` column type is `uuid` (not `int8` or `text`)

