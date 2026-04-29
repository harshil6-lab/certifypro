# Student Import Multi-Tenant Isolation Fix
## Status: ✅ PLAN APPROVED - In Progress

### 1. Schema Update ✅
   - [x] Add `organization_id uuid REFERENCES organizations(id)` to `students` table
   - [x] Add indexes: `idx_students_organization_id`, `idx_students_org_created_by`
   - Edit: `backend/database/supabase_schema.sql`

### 2. Update Import Logic ✅
   - [x] Ensure `record["organization_id"]` set in import_students.py /save ✅ (already present)
   - [x] Ensure `row["organization_id"]` in students_routes.py /import
   - Files: `backend/app/api/import_students.py`, `backend/app/api/students_routes.py`

### 3. Optimize List Queries ✅
   - [x] list_students(): Primary `.eq("organization_id", org_id).or_("created_by.in...")` + Python fallback
   - [x] Keep super-admin + metadata fallback intact
   - File: `backend/app/services/students_service.py`

### 4. Fix Dashboard Queries ✅
   - [x] _resolve_student_ids(): Added `.eq("organization_id", org_id)` when provided
   - File: `backend/app/services/dashboard_service.py`

### 5. Backfill + Test ✅
   - [x] Created BACKFILL_ORGANIZATION_ID.sql for existing students
   - [ ] Test: Import new students (check organization_id populated), list_students() returns only org students, cross-org isolation, dashboard stats scoped
   - [x] No code changes to auth/verify → no regressions expected

### 6. Deploy [PENDING]
   - [ ] Run schema SQL in Supabase
   - [ ] Restart backend
   - [ ] ✅ Complete

