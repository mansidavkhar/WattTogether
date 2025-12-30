# Backers Count Fix

## Issue
Campaigns showing `backersCount: 0` even when they have received donations and the `amountRaisedINR` is correct.

**Example:**
```json
{
  "title": "The Blue Creek Flow — 24/7 Clean Power for Oakhaven",
  "fundingGoalINR": 200,
  "amountRaisedINR": 200,
  "backersCount": 0,  // ❌ WRONG - should be at least 1
  "status": "funded"
}
```

## Root Cause
The `backersCount` field is only incremented when donations are processed through the `submitDonation` endpoint in `donationControllerV2.js`. If donations were created through:
- Direct database writes
- Old/legacy donation endpoints
- Data migrations or imports

The `backersCount` field was not updated accordingly.

## Solution

### New Endpoints Added

#### 1. Fix a Single Campaign
```bash
POST /api/donations/reconcile/:campaignId
```
Recalculates the backer count for a specific campaign based on actual donation records.

**Example:**
```bash
curl -X POST http://localhost:5000/api/donations/reconcile/694d20a4d4c33fa4649ea4e0 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Backer count reconciled",
  "data": {
    "campaignId": "694d20a4d4c33fa4649ea4e0",
    "title": "The Blue Creek Flow — 24/7 Clean Power for Oakhaven",
    "previousBackersCount": 0,
    "newBackersCount": 1,
    "amountRaisedINR": 200
  }
}
```

#### 2. Fix All Campaigns (Admin)
```bash
POST /api/donations/reconcile-all
```
Bulk fixes all campaigns in the database where `backersCount` doesn't match the actual number of unique donors.

**Example:**
```bash
curl -X POST http://localhost:5000/api/donations/reconcile-all \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation complete. 3 campaigns fixed.",
  "totalCampaigns": 47,
  "reconciledCount": 3,
  "details": [
    {
      "campaignId": "694d20a4d4c33fa4649ea4e0",
      "title": "The Blue Creek Flow — 24/7 Clean Power for Oakhaven",
      "previousCount": 0,
      "newCount": 1
    },
    // ... more campaigns
  ]
}
```

## How It Works

The reconciliation function:
1. Queries all **unique donors** for a campaign using: `Donation.distinct('member', { campaign: campaignId })`
2. Counts the number of unique members
3. Updates the campaign's `backersCount` to match this count

This ensures that `backersCount` always represents the **number of unique people** who have donated, regardless of how many times they donated.

## Implementation Details

### Files Modified
- [backend/controllers/donationControllerV2.js](backend/controllers/donationControllerV2.js#L485) - Added two new functions
- [backend/routes/donationRoutesV2.js](backend/routes/donationRoutesV2.js#L35) - Added two new routes

### How the Fix Counts Backers
```javascript
const uniqueBackers = await Donation.distinct('member', { campaign: campaignId });
const correctBackersCount = uniqueBackers.length;
```

This counts **distinct members** who have made at least one donation to the campaign.

## Prevention

To prevent this issue in the future:
1. Always use the `submitDonation` endpoint for new donations - it properly updates `backersCount`
2. The endpoint checks if a member is a first-time backer and only increments the count once per unique donor
3. Code in [donationControllerV2.js lines 289-301](backend/controllers/donationControllerV2.js#L289-L301) handles this logic

## Testing

After running the reconciliation, verify:
```bash
# Get campaign details
curl http://localhost:5000/api/campaigns/694d20a4d4c33fa4649ea4e0
```

The `backersCount` should now match the number of unique donors visible in the campaign.
