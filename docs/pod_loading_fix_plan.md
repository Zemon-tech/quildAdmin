# Implementation Plan: Fix Pod Loading Issue

## Objective
Fix the issue where pods for specific problems are not loading correctly due to pagination limits in the `GET /api/admin/pods` endpoint. The goal is to implement server-side filtering so that the frontend can request all pods belonging to a specific problem, bypassing the global pagination limit that hides pods on subsequent pages.

## Phase 1: Backend Update
**File:** `backend/src/routes/pods.ts`

- Modify the `GET /api/admin/pods` route handler.
- Extract `problemId` from `req.query`.
- Add a conditional check: if `problemId` is present, add `{ problem: problemId }` to the MongoDB query object.
- **Verification:** Ensure that filtering by `problemId` returns the expected pods for that problem.
- **Consideration:** When filtering by `problemId`, we likely want to disable or increase the default pagination limit (currently 10) to ensure ALL pods for that problem are returned in one request (e.g., set a much higher limit like 100 if `problemId` is present, or allow the frontend to request a higher limit).

## Phase 2: Frontend API Client Update
**File:** `frontend/src/lib/api.ts`

- Update the `adminApi.Pods.list` method signature.
- Change it from `list: () => ...` to `list: (params?: { problemId?: string, limit?: number }) => ...`.
- Construct the query string based on the provided parameters.
  - Example: `/api/admin/pods?problemId=...&limit=100`

## Phase 3: Frontend Component Integration
**File:** `frontend/src/components/ProblemManageDialog.tsx`

- Locate the `loadPodsForProblem` function.
- Update the call to `adminApi.Pods.list()` to pass the `problemId`.
  - Example: `await adminApi.Pods.list({ problemId: problemId, limit: 100 });`
- This ensures that the API returns all pods specifically for the currently managed problem, fixing the issue where pods were missing because they fell onto "Page 2" of the global list.

## Phase 4: Verification
- Restart the backend server.
- Open the Problem Manage Dialog for the problem "Why Did My Data Disappear?".
- Verify that all 4 pods are now visible (previously only some might have been visible).
- Open "How Does the App Know It's You?" and verify all pods are still visible.
- Check the general Pods page (`frontend/src/pages/Pods.tsx`) to ensure it still loads the global list correctly (without params).
