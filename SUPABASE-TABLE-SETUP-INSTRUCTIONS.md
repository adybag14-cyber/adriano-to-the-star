# Supabase Table Setup - Step by Step Instructions

## Creating the `planet_claims` Table

### Step 1: Create the Table

1. Go to: https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw/editor
2. Click **"New Table"** (or **"Create a new table"**)
3. Set:
   - **Name:** `planet_claims`
   - **Description:** (optional) "Stores user planet claims"
   - **Enable Row Level Security (RLS):** ✅ **CHECKED** (Recommended)
   - **Enable Realtime:** (optional, can leave unchecked)

### Step 2: Add Columns

**IMPORTANT:** Delete the default `id` and `created_at` columns first, then add these columns in order:

#### Column 1: `id`
- **Name:** `id`
- **Type:** `uuid` (NOT int8!)
- **Default Value:** `gen_random_uuid()`
- **Is Nullable:** ❌ **UNCHECKED**
- **Is Primary Key:** ✅ **CHECKED**

#### Column 2: `user_id`
- **Name:** `user_id`
- **Type:** `uuid`
- **Default Value:** (leave empty)
- **Is Nullable:** ❌ **UNCHECKED**
- **Is Primary Key:** ❌ **UNCHECKED**

#### Column 3: `username`
- **Name:** `username`
- **Type:** `text`
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECKED**

#### Column 4: `email`
- **Name:** `email`
- **Type:** `text`
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECKED**

#### Column 5: `kepid`
- **Name:** `kepid`
- **Type:** `bigint`
- **Default Value:** (leave empty)
- **Is Nullable:** ❌ **UNCHECKED**

#### Column 6: `planet_data`
- **Name:** `planet_data`
- **Type:** `jsonb`
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECKED**

#### Column 7: `status`
- **Name:** `status`
- **Type:** `text`
- **Default Value:** `'active'` (with quotes)
- **Is Nullable:** ❌ **UNCHECKED**

#### Column 8: `claimed_at`
- **Name:** `claimed_at`
- **Type:** `timestamptz`
- **Default Value:** `now()`
- **Is Nullable:** ❌ **UNCHECKED**

#### Column 9: `certificate_number`
- **Name:** `certificate_number`
- **Type:** `text`
- **Default Value:** (leave empty)
- **Is Nullable:** ✅ **CHECKED**

#### Column 10: `created_at`
- **Name:** `created_at`
- **Type:** `timestamptz`
- **Default Value:** `now()`
- **Is Nullable:** ❌ **UNCHECKED**

#### Column 11: `updated_at`
- **Name:** `updated_at`
- **Type:** `timestamptz`
- **Default Value:** `now()`
- **Is Nullable:** ❌ **UNCHECKED**

### Step 3: Add Foreign Key (Optional but Recommended)

After creating the table, add a foreign key:

1. Click on the **"Foreign keys"** tab
2. Click **"Add foreign key relation"**
3. Set:
   - **Foreign key column:** `user_id`
   - **Reference table:** `auth.users`
   - **Reference column:** `id`
   - **On delete:** `CASCADE` (optional, but recommended)

### Step 4: Save the Table

Click **"Save"** or **"Create table"** button at the bottom.

### Step 5: Create RLS Policies

After the table is created, you need to add Row Level Security policies:

1. Go to **"Authentication"** → **"Policies"** in the left sidebar
2. Find the `planet_claims` table
3. Click **"New Policy"** for each policy below:

#### Policy 1: Users can read their own claims
- **Policy Name:** `Users can read own claims`
- **Allowed Operation:** `SELECT`
- **Policy Definition:**
```sql
auth.uid() = user_id
```

#### Policy 2: Users can insert their own claims
- **Policy Name:** `Users can insert own claims`
- **Allowed Operation:** `INSERT`
- **Policy Definition:**
```sql
auth.uid() = user_id
```

#### Policy 3: Users can update their own claims
- **Policy Name:** `Users can update own claims`
- **Allowed Operation:** `UPDATE`
- **Policy Definition:**
```sql
auth.uid() = user_id
```

#### Policy 4: Users can delete their own claims
- **Policy Name:** `Users can delete own claims`
- **Allowed Operation:** `DELETE`
- **Policy Definition:**
```sql
auth.uid() = user_id
```

### Step 6: Create Indexes (Optional but Recommended)

Go to **"SQL Editor"** and run this SQL:

```sql
-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_planet_claims_user_id ON planet_claims(user_id);

-- Index for faster lookups by kepid
CREATE INDEX IF NOT EXISTS idx_planet_claims_kepid ON planet_claims(kepid);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_planet_claims_status ON planet_claims(status);

-- Composite index for user + kepid lookups
CREATE INDEX IF NOT EXISTS idx_planet_claims_user_kepid ON planet_claims(user_id, kepid);
```

### ✅ You're Done!

Once the table is created with all columns and policies, the planet claiming system will automatically:
- Save claims to Supabase
- Load claims from Supabase
- Sync across all devices

## Quick Reference: All Columns Summary

| Column | Type | Default | Nullable | Primary Key |
|--------|------|---------|----------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | ❌ | ✅ |
| `user_id` | `uuid` | - | ❌ | ❌ |
| `username` | `text` | - | ✅ | ❌ |
| `email` | `text` | - | ✅ | ❌ |
| `kepid` | `bigint` | - | ❌ | ❌ |
| `planet_data` | `jsonb` | - | ✅ | ❌ |
| `status` | `text` | `'active'` | ❌ | ❌ |
| `claimed_at` | `timestamptz` | `now()` | ❌ | ❌ |
| `certificate_number` | `text` | - | ✅ | ❌ |
| `created_at` | `timestamptz` | `now()` | ❌ | ❌ |
| `updated_at` | `timestamptz` | `now()` | ❌ | ❌ |

