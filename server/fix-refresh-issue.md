# Fix for Lifting Class UI Not Refreshing

The issue is with the `/api/schedule/class` endpoint returning a 404 error at 5 minutes to the hour.

## Problem

In the Express routing system, route order matters. The `/api/schedule/class` endpoint is being interpreted as a parameter route (like `/:id`) because it's defined after the more generic routes.

## Fix Steps

1. Modify the route order in `server/src/routes/schedule.routes.ts`:
   ```bash
   # Apply the patch with:
   cd server
   patch -p2 < fix-routes.patch
   ```

2. Rebuild the server:
   ```bash
   cd server
   npm run build
   ```

3. Restart the server:
   ```bash
   # Stop any running server instance first
   # Then start a new one
   cd server
   npm run ensure-workout-schemes
   npm start
   ```

## Verifying the Fix

1. Access the lifting class page in your browser:
   ```
   http://localhost:3000/lifting-class
   ```

2. The page should now auto-refresh at 5 minutes to the hour (XX:55) and at the top of each hour (XX:00).

3. You should no longer see `GET /api/schedule/class 404` errors in the server logs.