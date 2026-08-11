# Supabase Planet Claims Setup

## 📋 Overview

Planet claims are now saved to Supabase for cloud storage and cross-device synchronization!

## 🗄️ Database Table Setup

You need to create a table in Supabase for storing planet claims.

### Step 1: Create the Table

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw
2. Click on **"Table Editor"** in the left sidebar
3. Click **"New Table"**
4. Name it: `planet_claims`
5. Add the following columns:

| Column Name | Type | Default | Nullable | Description |
|------------|------|---------|----------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | ❌ | Primary key |
| `user_id` | `uuid` | - | ❌ | Foreign key to auth.users |
| `username` | `text` | - | ✅ | Username |
| `email` | `text` | - | ✅ | User email |
| `kepid` | `bigint` | - | ❌ | Kepler planet ID |
| `planet_data` | `jsonb` | - | ✅ | Planet information (JSON) |
| `status` | `text` | `'active'` | ❌ | Claim status |
| `claimed_at` | `timestamptz` | `now()` | ❌ | When claimed |
| `certificate_number` | `text` | - | ✅ | Certificate number |
| `created_at` | `timestamptz` | `now()` | ❌ | Record creation time |
| `updated_at` | `timestamptz` | `now()` | ❌ | Last update time |

### Step 2: Set Up Row Level Security (RLS)

1. Click on **"Authentication"** → **"Policies"** in the left sidebar
2. Find the `planet_claims` table
3. Click **"New Policy"**
4. Create these policies:

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

### Step 3: Create Indexes (Optional but Recommended)

Run these SQL commands in the **SQL Editor**:

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

## ✅ How It Works

1. **Claiming a Planet:**
   - User clicks "Claim This Planet"
   - System checks if already claimed (Supabase + localStorage)
   - Saves to Supabase (if available)
   - Always saves to localStorage as backup
   - Updates UI immediately

2. **Loading Claims:**
   - On page load, checks Supabase first
   - Falls back to localStorage if Supabase unavailable
   - Syncs Supabase claims to localStorage
   - Updates planet availability status

3. **Cross-Device Sync:**
   - Claims saved to Supabase sync across all devices
   - User logs in on any device → sees all their claims
   - localStorage acts as offline backup

## 🔒 Security

- **Row Level Security (RLS)** ensures users can only see/modify their own claims
- **Authentication required** - must be logged in to claim
- **Data validation** - checks for duplicate claims

## 🎯 Benefits

- ✅ **Cloud Storage** - Claims saved to Supabase
- ✅ **Cross-Device Sync** - Access claims from any device
- ✅ **Offline Support** - localStorage backup if Supabase unavailable
- ✅ **Secure** - RLS policies protect user data
- ✅ **Scalable** - Can handle millions of claims

## 📝 Notes

- If Supabase table doesn't exist, the system falls back to localStorage
- Claims are always saved to localStorage as backup
- Supabase claims are synced to localStorage on load
- No backend server needed - works entirely on GitLab Pages!

