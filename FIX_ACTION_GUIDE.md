# Quick Action Guide - Fix Your Campaign's Backer Count

## Problem Summary
Your campaign "The Blue Creek Flow — 24/7 Clean Power for Oakhaven" shows:
- `amountRaisedINR`: 200 ✅ (Correct)
- `backersCount`: 0 ❌ (Should be 1, not 0)
- `status`: funded ✅ (Correct)

## How to Fix

### Option 1: Fix Just This Campaign (Recommended)

Using **Postman** or **curl**:

```bash
POST http://localhost:5000/api/donations/reconcile/694d20a4d4c33fa4649ea4e0
Headers:
  Authorization: Bearer <your_auth_token>
  Content-Type: application/json
```

You should get a response showing the backer count was updated from 0 to 1.

### Option 2: Fix All Campaigns At Once

If multiple campaigns have this issue:

```bash
POST http://localhost:5000/api/donations/reconcile-all
Headers:
  Authorization: Bearer <your_auth_token>
  Content-Type: application/json
```

This will scan all campaigns and fix any with incorrect backer counts.

## What Was Fixed?

### The Issue
- Donations were recorded in the database with the correct amounts
- But the campaign's `backersCount` field wasn't being incremented
- This could happen if donations were created through:
  - Direct database inserts
  - Legacy code paths
  - Data migrations

### The Solution
Added two new endpoints that:
1. Count how many **unique people** have donated to a campaign
2. Update the `backersCount` to match that number
3. Works even if someone donated multiple times (counts them once)

## Files Modified

✅ [backend/controllers/donationControllerV2.js](../backend/controllers/donationControllerV2.js)
- Added `reconcileBackersCount()` - Fixes a single campaign
- Added `reconcileAllBackersCounts()` - Fixes all campaigns

✅ [backend/routes/donationRoutesV2.js](../backend/routes/donationRoutesV2.js)
- Added POST `/donations/reconcile/:campaignId`
- Added POST `/donations/reconcile-all`

## Verification

After running the fix, verify it worked:

```bash
GET http://localhost:5000/api/campaigns/694d20a4d4c33fa4649ea4e0
```

Response should now show:
```json
{
  "campaign": {
    "_id": "694d20a4d4c33fa4649ea4e0",
    "title": "The Blue Creek Flow — 24/7 Clean Power for Oakhaven",
    "amountRaisedINR": 200,
    "backersCount": 1,  // ✅ NOW FIXED!
    "status": "funded"
  }
}
```

## Prevention for Future Donations

All new donations using the `POST /api/donations/submit` endpoint will properly update the `backersCount`:
- First donation from a user → increments count by 1
- Subsequent donations from same user → count stays the same
- Different user's donation → increments count by 1

See [backend/controllers/donationControllerV2.js lines 289-301](../backend/controllers/donationControllerV2.js#L289-L301) for the implementation.
