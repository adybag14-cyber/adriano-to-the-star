# How to Run the SQL Script to Create the Table

## 🚀 Quick Steps (2 minutes)

1. **Go to Supabase SQL Editor:**
   - Direct link: https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy the SQL script:**
   - Open `create_planet_claims_table.sql` file
   - Copy ALL the SQL code (Ctrl+A, Ctrl+C)

3. **Paste into SQL Editor:**
   - Paste the code into the SQL Editor
   - Click **"Run"** or press `Ctrl+Enter`

4. **Done! ✅**
   - The table will be created automatically
   - All columns, indexes, and policies will be set up
   - You can now use the planet claiming feature!

## 📋 What the Script Does

The SQL script automatically:
- ✅ Creates the `planet_claims` table
- ✅ Adds all 11 columns with correct types and defaults
- ✅ Sets `id` as primary key (UUID)
- ✅ Adds foreign key to `auth.users`
- ✅ Enables Row Level Security (RLS)
- ✅ Creates 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ Creates 4 indexes for better performance
- ✅ Adds automatic `updated_at` timestamp trigger

## 🔍 Verify It Worked

After running the script:

1. Go to **Table Editor**
2. You should see `planet_claims` table
3. Click on it to see all 11 columns
4. Go to **Authentication → Policies**
5. You should see 4 policies for `planet_claims`

## ⚠️ If You Get Errors

- **"relation already exists"**: The table already exists, that's okay!
- **"permission denied"**: Make sure you're logged into Supabase
- **"column already exists"**: Some columns already exist, you can delete the table and run again

## 🎯 Next Steps

Once the table is created:
- ✅ Planet claiming will automatically save to Supabase
- ✅ Claims will sync across all devices
- ✅ No additional setup needed!

