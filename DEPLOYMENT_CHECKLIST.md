# Quick Deployment Checklist - Profiles System

**Last Updated:** March 21, 2026

---

## 📋 PRE-DEPLOYMENT VERIFICATION

### Database Schema
- [ ] File exists: `database/profiles_schema.sql`
- [ ] Contains profiles table
- [ ] Contains RLS policies
- [ ] Contains indexes
- [ ] Contains triggers for updated_at

### Backend Files
- [ ] File exists: `backend/app/services/profile_service.py`
  - [ ] Has `get_user_profile()` function
  - [ ] Has `mark_first_login_complete()` function
  - [ ] Has `is_admin()` function
  - [ ] Has `get_user_organization()` function

- [ ] File updated: `backend/app/api/user_routes.py`
  - [ ] Imports from profile_service
  - [ ] Has GET `/user/profile` endpoint
  - [ ] Has POST `/user/profile/complete-first-login` endpoint

### Edge Function
- [ ] File updated: `supabase/functions/process-access-request/index.ts`
  - [ ] Creates profile after user creation
  - [ ] Has try/catch for profile creation
  - [ ] Logs profile creation steps
  - [ ] Captures errors in validation_notes

### Frontend Files
- [ ] File exists: `frontend/src/pages/CompleteProfile.tsx`
  - [ ] Imports profile helpers
  - [ ] Shows profile info
  - [ ] Has "Get Started" button
  - [ ] Redirects to dashboard on complete

- [ ] File updated: `frontend/src/lib/auth.ts`
  - [ ] Has `getCurrentUserProfile()` function
  - [ ] Has `checkFirstLoginRequired()` function
  - [ ] Has `markFirstLoginComplete()` function
  - [ ] Exports `UserProfile` type

- [ ] File updated: `frontend/src/App.tsx`
  - [ ] Imports CompleteProfile page
  - [ ] Route added: `/complete-profile`

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy Database Schema (5 min)
```bash
# Option A: Visual - Supabase Dashboard
Go to: Dashboard → SQL Editor
Copy: database/profiles_schema.sql
Paste: SQL Editor
Click: Run

# Option B: CLI
supabase db push
```

**Verify:**
- [ ] Supabase Dashboard → Tables → profiles exists
- [ ] RLS policies visible in policies tab
- [ ] Indexes created (idx_profiles_email, etc.)

### Step 2: Redeploy Edge Function (2 min)
```bash
npx supabase functions deploy process-access-request
```

**Verify:**
- [ ] Deployment successful message
- [ ] Check logs for any errors

### Step 3: Deploy Backend (Depends on setup)
```bash
# Python/FastAPI
# If using local development:
# - Restart uvicorn server
# - New services auto-imported

# If using production:
# - Deploy with your usual pipeline
# - Ensure profile_service.py is included
# - Restart backend service
```

**Verify:**
- [ ] Backend starts without errors
- [ ] No import errors for profile_service
- [ ] Endpoints available at `/user/profile`

### Step 4: Deploy Frontend (3-5 min)
```bash
# Build
npm run build

# Deploy (depends on setup)
# - Vercel: Auto-deploys on push
# - Manual: Copy dist to server
# - Docker: Rebuild and push image
```

**Verify:**
- [ ] New routes available
- [ ] `/complete-profile` page loads
- [ ] Auth helpers accessible

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test 1: Profile Creation on Access Request Approval
1. [ ] Submit access request with high score
2. [ ] Check Supabase Edge Function logs:
   - [ ] See `📝 Creating user profile...`
   - [ ] See `✅ User profile created successfully`
3. [ ] Check Supabase Dashboard → profiles table:
   - [ ] New row created with user UUID
   - [ ] email matches request email
   - [ ] organization matches request org
   - [ ] role = "admin"
   - [ ] first_login_required = true

### Test 2: First Login Onboarding
1. [ ] User receives email
2. [ ] User clicks login link
3. [ ] User sets password
4. [ ] User logs in
5. [ ] Verify redirect to `/complete-profile`
6. [ ] Profile info displays correctly
7. [ ] Click "Get Started"
8. [ ] Verify redirect to `/dashboard`

### Test 3: Second Login - No Onboarding
1. [ ] User logs out
2. [ ] User logs back in
3. [ ] Should go directly to dashboard (no /complete-profile)
4. [ ] Check Supabase profiles table:
   - [ ] first_login_required = false for user

### Test 4: API Endpoints Working
```bash
# Get profile
curl -X GET http://localhost:8000/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "admin",
    "organization": "Company",
    "first_login_required": false
  }
}
```

### Test 5: RLS Policies Working
1. [ ] User A tries to read User B's profile → 403 Forbidden
2. [ ] User A can read own profile → 200 OK
3. [ ] User A tries to modify own role → Not allowed
4. [ ] Service role can insert profiles → Works

---

## 🔍 TROUBLESHOOTING

### Issue: "profiles table not found"
**Solution:**
```bash
# Run schema SQL in Supabase Dashboard
# Or use: supabase db push
# Verify table exists: SELECT * FROM profiles;
```

### Issue: 404 on `/user/profile` endpoint
**Solution:**
```bash
# Verify backend has profile_service imported
# Check user_routes.py has endpoint defined
# Restart FastAPI server: uvicorn app.main:app --reload
```

### Issue: User redirects to `/complete-profile` but page doesn't load
**Solution:**
```bash
# Verify CompleteProfile.tsx exists
# Check App.tsx has route configured
# Check frontend build completed
# Check browser console for errors
```

### Issue: Profile shows but first_login_required still true after "Get Started"
**Solution:**
```bash
# Check if POST endpoint is being called
# Verify database update actually happens
# Check Supabase logs for errors
# Verify auth token is valid
```

### Issue: Users can read other profiles (RLS not working)
**Solution:**
```sql
-- Check RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- If missing, run schema SQL again
```

---

## 📊 MONITORING

### Edge Function Logs
```
Supabase Dashboard → Functions → process-access-request → Logs

Look for:
- ✅ [STEP 4 OK] Approval processing complete
- ✅ 📝 Creating user profile...
- ✅ User profile created successfully
```

### Database Logs
```sql
-- Query profiles table for new users
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 10;

-- Check for profile creation errors in validation_notes
SELECT id, email, validation_notes FROM public.access_requests 
WHERE status = 'approved' ORDER BY updated_at DESC;
```

### Backend Logs
```
Check application logs for:
- GET /user/profile requests
- 200 OK responses
- 401 Unauthorized errors
- 404 Not Found errors
```

### Frontend Console
```
Check browser console for:
- checkFirstLoginRequired() results
- getCurrentUserProfile() responses
- Navigation redirects
- Any TypeScript errors
```

---

## ✅ ROLLBACK PLAN (if needed)

### Option 1: Disable Profiles (Keep Data)
```bash
# Don't delete profiles table, just disable
# Remove route from App.tsx
# Revert user_routes.py to old version
# Revert edge function to old version
```

### Option 2: Full Rollback (Reset Everything)
```bash
# Frontend
git revert HEAD  # Undo last commit

# Backend
rm backend/app/services/profile_service.py
git revert HEAD  # Undo user_routes.py changes

# Edge Function
git revert HEAD  # Undo edge function changes

# Database (backup first!)
DROP TABLE profiles CASCADE;
```

---

## 📚 DOCUMENTATION

**Reference Documents:**
- `PROFILES_SYSTEM_IMPLEMENTATION.md` - Complete technical documentation
- `BACKEND_FIXES_SUMMARY.md` - Backend access request system
- `IMPLEMENTATION_DETAILS.md` - Edge function implementation details

**Quick Links:**
- SQL Schema: `database/profiles_schema.sql`
- Backend Service: `backend/app/services/profile_service.py`
- API Routes: `backend/app/api/user_routes.py`
- Frontend Page: `frontend/src/pages/CompleteProfile.tsx`
- Auth Helpers: `frontend/src/lib/auth.ts`

---

## 🎯 SUCCESS CRITERIA

All checks should be ✅:
- [ ] Database schema deployed
- [ ] Edge function redeployed  
- [ ] Backend running without errors
- [ ] Frontend builds successfully
- [ ] Test 1: Profile created on approval ✅
- [ ] Test 2: First login redirects correctly ✅
- [ ] Test 3: Second login bypasses onboarding ✅
- [ ] Test 4: API endpoints working ✅
- [ ] Test 5: RLS policies enforced ✅
- [ ] No errors in logs ✅
- [ ] Users can complete flow seamlessly ✅

---

## 📞 SUPPORT

If any issues:
1. Check TROUBLESHOOTING section above
2. Review detailed documentation in `PROFILES_SYSTEM_IMPLEMENTATION.md`
3. Check logs in Supabase Dashboard
4. Check browser console for frontend errors
5. Check application logs for backend errors

**All systems are backward compatible** - no existing functionality broken.

---

**Deployment Status:** 🟢 Ready to Deploy
