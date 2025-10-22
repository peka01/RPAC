# Notification Improvements for Membership Approval

## Before vs After

### 📧 Approval Notification

#### ❌ Before
```
Medlemskap godkänt
Din ansökan om medlemskap har godkänts!
[Not clickable - broken link]
```

#### ✅ After
```
Medlemskap godkänt
Din ansökan om medlemskap i Berg har godkänts! Klicka här för att gå till samhället.
[Clickable - opens directly to "Mina samhällen" with Berg selected]
```

**Improvements:**
- ✅ Includes community name ("Berg")
- ✅ Clear call-to-action ("Klicka här...")
- ✅ Working link to `/local?tab=myCommunities&community={id}`
- ✅ User lands directly in their new community

---

### 📧 Rejection Notification

#### ❌ Before
```
Medlemskap avslaget
Din ansökan om medlemskap har avslagits.
[Generic message, no context]
```

#### ✅ After (Without Reason)
```
Medlemskap avslaget
Din ansökan om medlemskap i Berg har avslagits.
[Opens to discover page to find other communities]
```

#### ✅ After (With Reason)
```
Medlemskap avslaget
Din ansökan om medlemskap i Berg har avslagits. Orsak: Samhället är fullt just nu.
[Opens to discover page to find other communities]
```

**Improvements:**
- ✅ Includes community name ("Berg")
- ✅ Optional rejection reason from admin
- ✅ Link to discover page to find alternatives
- ✅ Contextual and helpful

---

## Technical Implementation

### Database Changes

**Function:** `approve_membership_request`
```sql
-- Fetch community name
SELECT community_name INTO v_community_name
FROM local_communities
WHERE id = v_community_id;

-- Create personalized notification
INSERT INTO notifications (user_id, type, title, content, action_url)
VALUES (
  v_user_id,
  'membership_approved',
  'Medlemskap godkänt',
  'Din ansökan om medlemskap i ' || v_community_name || ' har godkänts! Klicka här för att gå till samhället.',
  '/local?tab=myCommunities&community=' || v_community_id::text
);
```

**Function:** `reject_membership_request`
```sql
-- Fetch community name
SELECT community_name INTO v_community_name
FROM local_communities
WHERE id = v_community_id;

-- Create personalized notification with optional reason
INSERT INTO notifications (user_id, type, title, content, action_url)
VALUES (
  v_user_id,
  'membership_rejected',
  'Medlemskap avslaget',
  CASE 
    WHEN p_reason IS NOT NULL THEN 
      'Din ansökan om medlemskap i ' || v_community_name || ' har avslagits. Orsak: ' || p_reason
    ELSE 
      'Din ansökan om medlemskap i ' || v_community_name || ' har avslagits.'
  END,
  '/local/discover'
);
```

---

## User Experience Flow

### Approval Flow
1. User clicks "Gå med" on closed community "Berg"
2. Request sent, button shows "Väntande" (amber)
3. Admin clicks "Godkänn"
4. **Notification appears:** "Din ansökan om medlemskap i Berg har godkänts! Klicka här för att gå till samhället."
5. User clicks notification
6. Opens directly to "Mina samhällen" tab with "Berg" community dashboard visible
7. User can immediately start engaging with community

### Rejection Flow
1. User clicks "Gå med" on closed community "Berg"
2. Request sent, button shows "Väntande"
3. Admin clicks "Avslå" and enters reason: "Samhället är fullt"
4. **Notification appears:** "Din ansökan om medlemskap i Berg har avslagits. Orsak: Samhället är fullt"
5. User clicks notification
6. Opens to discover page where they can find other communities
7. User can try joining another community

---

## Testing Checklist

After running the migration:

### Approval
- [ ] Request membership to a closed community
- [ ] Admin approves the request
- [ ] Check notification bell - should show new notification
- [ ] Read notification text - should include community name
- [ ] Click notification - should open to "Mina samhällen" with community selected
- [ ] Verify you can see the community dashboard

### Rejection
- [ ] Request membership to a closed community
- [ ] Admin rejects with reason: "Test rejection"
- [ ] Check notification bell - should show new notification
- [ ] Read notification text - should include community name AND reason
- [ ] Click notification - should open to discover page
- [ ] Verify you can browse other communities

---

## Migration File

**File to run:** `rpac-web/database/fix-approve-membership-rpc.sql`

This single migration fixes:
1. ✅ Column name errors (`message` → `content`, `link` → `action_url`)
2. ✅ Adds community name to notifications
3. ✅ Improves action URLs for better navigation
4. ✅ Adds clear call-to-action text
5. ✅ Handles rejection reasons properly

---

**Date:** 2025-10-22  
**Status:** Ready to deploy  
**Impact:** Greatly improves user experience and engagement

