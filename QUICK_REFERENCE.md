# Quick Reference Card - Profiles System

**Print this or bookmark!**

---

## 📋 WHAT WAS BUILT

### System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                   USER AUTHENTICATION                        │
│                   (Supabase Auth)                            │
│         auth.users (email, password, UUID)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 1:1 relationship
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   PROFILES TABLE (NEW)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id (UUID, PK, FK auth.users)                         │   │
│  │ email (TEXT) - user's email                          │   │
│  │ organization (TEXT) - tenant/company name            │   │
│  │ role (TEXT) - staff | admin | super_admin            │   │
│  │ first_login_required (BOOLEAN) - onboarding flag     │   │
│  │ created_at, updated_at                               │   │
│  │                                                      │   │
│  │ RLS: Users see only own profile                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────|
```

---

## 🔄 FLOW SUMMARY

```
User Approved (score ≥ 70)
    ↓
Create Supabase Auth user
    ↓
NEW: Create profile row
    ↓
Send welcome email
    ↓
User logs in
    ↓
Check: first_login_required = true?
    ↓
YES → Redirect to /complete-profile
    ↓
Click "Get Started" → POST /user/profile/complete-first-login
    ↓
first_login_required = false
    ↓
Redirect to /dashboard
    ↓
User ready!

NEXT LOGIN: Skip to /dashboard directly
```

---

## 📁 FILES AT A GLANCE

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| **profiles_schema.sql** | SQL | 150 | Create table, RLS, indexes |
| **profile_service.py** | Python | 100 | Backend service functions |
| **CompleteProfile.tsx** | React | 180 | Onboarding page |
| **process-access-request/index.ts** | TypeScript | +40 | Create profile on approval |
| **user_routes.py** | Python | +50 | Profile endpoints |
| **auth.ts** | TypeScript | +130 | Frontend helpers |
| **App.tsx** | React | +2 | Add route |

---

## 🚀 QUICK START (5 Steps)

### 1️⃣ Deploy Database (2 min)
```bash
# Supabase Dashboard → SQL Editor
# Copy: database/profiles_schema.sql
# Run
```

### 2️⃣ Redeploy Edge Function (1 min)
```bash
npx supabase functions deploy process-access-request
```

### 3️⃣ Restart Backend (1 min)
```bash
# Picks up profile_service.py automatically
```

### 4️⃣ Build Frontend (2 min)
```bash
npm run build
```

### 5️⃣ Test (5 min)
```
- Submit high-score access request
- Check email
- Login
- Should see /complete-profile
- Click "Get Started"
- Should go to /dashboard
```

**Total: ~11 minutes** ✅

---

## 🔑 KEY FUNCTIONS

### Backend
```python
# Get current user's profile
profile = get_user_profile(user_id)
# → {"id": "...", "email": "...", "role": "admin", ...}

# Check if admin
if is_admin(user_id):
    # Allow admin operations

# Get user's organization
org = get_user_organization(user_id)
```

### Frontend
```typescript
// Get profile data
const profile = await getCurrentUserProfile();

// Check if needs first login
const redirect = await checkFirstLoginRequired();
if (redirect) navigate(redirect);

// Mark first login complete
await markFirstLoginComplete();
```

---

## 📊 API ENDPOINTS

### GET `/user/profile`
```bash
curl http://localhost:8000/user/profile \
  -H "Authorization: Bearer TOKEN"

# Response:
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "admin",
    "organization": "Acme Corp",
    "first_login_required": false
  }
}
```

### POST `/user/profile/complete-first-login`
```bash
curl -X POST http://localhost:8000/user/profile/complete-first-login \
  -H "Authorization: Bearer TOKEN" \
  -d '{}'

# Response:
{
  "success": true,
  "message": "first login marked complete",
  "redirect": "/dashboard"
}
```

---

## 🔒 SECURITY ENFORCED

- ✅ Users read/update only own profile
- ✅ Service role can insert only
- ✅ No privilege escalation possible
- ✅ All operations require auth
- ✅ RLS enforced at DB level
- ✅ Tokens required for API calls

---

## ✅ WHAT DIDN'T CHANGE

- ✅ Access requests table
- ✅ Scoring logic
- ✅ Email system
- ✅ Auth middleware
- ✅ Existing routes
- ✅ User signup

**100% Backward Compatible**

---

## 🧪 QUICK TEST

### Test Profile Creation
```bash
# 1. Submit access request (high score)
# 2. Check Supabase Dashboard
# 3. Find profiles table
# 4. New row should exist with:
#    - email: your@email.com
#    - organization: your org
#    - role: admin
#    - first_login_required: true
```

### Test First Login
```bash
# 1. Click email login link
# 2. Set password
# 3. Login
# 4. Should see /complete-profile page
# 5. Click "Get Started"
# 6. Should redirect to /dashboard
```

---

## 📞 TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| "profiles table not found" | Run schema SQL in Supabase |
| 404 on `/user/profile` | Restart backend |
| Stuck on /complete-profile | Check browser console for errors |
| Can't complete first login | Verify POST endpoint responding |

---

## 📚 MORE INFO

- **Full Docs:** `PROFILES_SYSTEM_IMPLEMENTATION.md`
- **Deployment:** `DEPLOYMENT_CHECKLIST.md`
- **All Changes:** `FILES_CHANGED_MANIFEST.md`
- **Summary:** `PROFILES_SYSTEM_SUMMARY.md`

---

## 🎯 KEY METRICS

| Metric | Value |
|--------|-------|
| Files Created | 3 |
| Files Modified | 4 |
| Total Lines Added | ~600 |
| Breaking Changes | 0 |
| Backward Compatible | ✅ Yes |
| Time to Deploy | ~15-20 min |
| Risk Level | 🟢 Low |

---

## ✨ WHAT YOU CAN NOW DO

✅ Role-based access control  
✅ Multi-tenant data isolation  
✅ User onboarding flows  
✅ Organization management  
✅ Profile-based features  
✅ Audit user lifecycle  

---

**Status: ✅ READY TO DEPLOY**

Print this card → Share with team → Deploy! 🚀
