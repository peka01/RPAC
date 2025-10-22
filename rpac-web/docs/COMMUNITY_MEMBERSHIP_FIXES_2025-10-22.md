# Community Membership Fixes - 2025-10-22

## Issues Fixed

### 1. **Creator Not Automatically Added as Admin**
**Problem**: When creating a community, the creator was added as a regular 'member' instead of 'admin', and sometimes wasn't showing up in "Mitt samhälle" section.

**Root Cause**: The `communityService.joinCommunity()` function always added users with role='member', even for community creators.

**Fix**: Updated `community-discovery.tsx` to directly insert creator as admin with approved status:
```typescript
const { error: adminError } = await supabase
  .from('community_memberships')
  .insert({
    community_id: newCommunity.id,
    user_id: user.id,
    role: 'admin',  // Creator is admin!
    status: 'approved'
  });
```

**Location**: `rpac-web/src/components/community-discovery.tsx:254-269`

---

### 2. **Closed Communities Showing Immediate Membership**
**Problem**: When clicking "Gå med" on a closed community (stängt), it immediately showed as joined even though it should require admin approval.

**Root Cause**: 
1. `handleJoinCommunity` didn't check if community was closed before joining
2. `getUserMemberships()` returned ALL memberships (including pending), not just approved ones

**Fix**: 
**Part A - Check access type before joining** (`community-discovery.tsx:310-355`):
```typescript
// Check if community is closed/requires approval
const { data: communityData } = await supabase
  .from('local_communities')
  .select('access_type, auto_approve_members')
  .eq('id', community.id)
  .single();

const isClosed = communityData?.access_type === 'stängt';
const autoApprove = communityData?.auto_approve_members === true;

if (isClosed && !autoApprove) {
  // Create pending membership request
  const { error: requestError } = await supabase
    .from('community_memberships')
    .insert({
      community_id: community.id,
      user_id: user.id,
      role: 'member',
      status: 'pending'
    });
  
  setError('Ansökan skickad! Väntar på godkännande från administratör.');
} else {
  // Open community - join directly with approved status
  await communityService.joinCommunity(community.id, user.id);
}
```

**Part B - Filter memberships by status** (`supabase.ts:313-333`):
```typescript
async getUserMemberships(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', userId)
    .eq('status', 'approved')  // Only get approved memberships!
  
  if (error) throw error
  return data?.map(m => m.community_id) || []
},

async getPendingMemberships(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', userId)
    .eq('status', 'pending')
  
  if (error) throw error
  return data?.map(m => m.community_id) || []
},
```

**Part C - Display pending status in UI** (`community-discovery.tsx:670-681`):
```typescript
else if (isPending) {
  // Pending approval - show disabled button
  return (
    <button
      disabled
      className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-lg cursor-not-allowed flex items-center gap-2 border border-amber-300"
      title="Väntar på godkännande"
    >
      <Loader className="animate-spin" size={16} />
      Väntande
    </button>
  );
}
```

---

## Files Modified

1. **rpac-web/src/components/community-discovery.tsx**
   - Fixed creator auto-join to use 'admin' role
   - Added logic to check community access type before joining
   - Added `pendingMemberships` state tracking
   - Updated button display logic to show pending status
   - Added notification when user requests to join closed community
   - Added pending request count badge on community cards for admins
   - Load and display pending request counts for admin communities

2. **rpac-web/src/lib/supabase.ts**
   - Updated `getUserMemberships()` to filter by status='approved'
   - Added `getPendingMemberships()` function
   - Added `getPendingRequestCount()` function
   - Updated `joinCommunity()` to explicitly set status='approved'

3. **rpac-web/src/lib/notification-service.ts**
   - Added notification types: 'membership_request', 'membership_approved', 'membership_rejected'
   - Added `createMembershipRequestNotification()` - notifies admins of new requests
   - Added `createMembershipApprovedNotification()` - notifies user when approved
   - Added `createMembershipRejectedNotification()` - notifies user when rejected

---

## User Experience Changes

### Before:
- ❌ Creator shows "Admin" badge but also "Gå med" button
- ❌ Closed community shows immediate membership on join
- ❌ No indication that approval is required
- ❌ No notifications for membership requests
- ❌ Admins don't know about pending requests

### After:
- ✅ Creator is automatically admin and member
- ✅ Creator sees Edit/Delete buttons (not "Gå med")
- ✅ Closed community shows pending status after join request
- ✅ Button shows "Väntande" with spinner icon while waiting for approval
- ✅ Only approved members appear in "Mitt samhälle"
- ✅ **Notifications sent to admins** when someone requests to join
- ✅ **Badge on community card** showing pending request count (e.g., "🔔 2 väntande")
- ✅ **Notification bell** in top bar shows new membership requests
- ✅ **User notifications** when membership is approved/rejected (to be implemented by admin approval flow)

---

## Testing Checklist

- [x] Create new community → Creator is admin and member
- [x] Creator sees Edit/Delete buttons, not "Gå med"
- [x] Join open community → Immediate membership
- [x] Join closed community → Shows "Väntande" status
- [x] Pending membership doesn't show in "Mitt samhälle"
- [ ] Admin receives notification when user requests to join
- [ ] Notification bell shows unread count
- [ ] Community card shows "X väntande" badge for admins
- [ ] Admin can approve/reject from admin panel
- [ ] User receives notification when approved
- [ ] User receives notification when rejected
- [ ] Approved membership shows in "Mitt samhälle"

---

## Notification Flow

### 1. User Requests to Join Closed Community
```
User clicks "Gå med" → 
  Creates pending membership →
  Fetches user profile name →
  Calls notificationService.createMembershipRequestNotification() →
    Finds all admins of community →
    Creates notification for each admin with:
      - Title: "🔔 Ny medlemsansökan"
      - Content: "[Name] vill gå med i [Community]"
      - Action URL: /community/[id]/admin/membership-requests
```

### 2. Admin Sees Notifications
- **Notification bell** in top bar shows unread count
- **Community card** shows amber badge: "⚠️ X väntande"
- **Notification center** lists all pending membership requests with:
  - 👥 Users icon (amber)
  - "Ny medlemsansökan" title
  - Requester name and community name
  - Three action buttons:
    - 🟢 **Godkänn** (Approve) - Quick approve
    - 🔴 **Avslå** (Reject) - Quick reject  
    - ⚪ **Hantera** (Manage) - Go to admin page
- Click notification → Navigate to admin panel

### 3. Admin Approves/Rejects (To Be Implemented)
When admin approves or rejects from admin panel:
```
Admin clicks Approve/Reject →
  Updates membership status →
  Calls notificationService.createMembershipApprovedNotification() or
        notificationService.createMembershipRejectedNotification() →
    User receives notification
```

---

## Database Schema Requirements

### ⚠️ IMPORTANT: Run Migrations First!

**Migration 1: Status Column**
If you get errors like "Error loading user communities" or "column status does not exist":
1. Navigate to `rpac-web/database/`
2. Run `add-membership-status-column.sql` in your Supabase SQL Editor
3. See `ADD_MEMBERSHIP_STATUS_README.md` for detailed instructions

**Migration 2: Notification Types**
If you get error: "violates check constraint notifications_type_check":
1. Run `add-membership-notification-types.sql` in your Supabase SQL Editor
2. See `ADD_MEMBERSHIP_NOTIFICATIONS_README.md` for detailed instructions

**Both migrations must be run for full functionality!**

### Required Schema

The `community_memberships` table needs:
- ✅ `status` column with values: 'approved', 'pending', 'rejected' (added by migration)
- ✅ `role` column with values: 'admin', 'moderator', 'member' (should exist)

The `notifications` table should support these notification types:
- 'membership_request' (sent to admins)
- 'membership_approved' (sent to requester)
- 'membership_rejected' (sent to requester)

### Backwards Compatibility

The code has fallback logic if `status` column doesn't exist yet:
- `getUserMemberships()` will return all memberships (old behavior)
- `getPendingMemberships()` will return empty array
- Notifications won't be sent
- Badges won't show

**For full functionality, run the migration!**

