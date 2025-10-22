# Community Modal Improvements - TODO

**Date**: 2024-10-22  
**Status**: Planned  
**Priority**: High

---

## 🎯 Required Changes

### 1. **Add Open/Closed Toggle to Create Modal** ✅ DONE
- Already implemented in `community-discovery-mobile.tsx`
- Radio buttons for Öppet/Stängt samhälle
- ✅ Working correctly

### 2. **Add Edit Community Modal** ⏳ TODO
Features needed:
- Edit community name
- Edit description
- **Toggle Open/Closed (access_type)**
- Toggle public visibility
- Save changes button

**UI:**
```
┌──────────────────────────────────┐
│ ✏️ Redigera samhälle        [X] │
├──────────────────────────────────┤
│ Namn: [________________]         │
│ Beskrivning: [__________]        │
│                                  │
│ Åtkomsttyp:                      │
│ ○ Öppet samhälle                │
│ ● Stängt samhälle               │
│                                  │
│ ☑ Synlig i sökningar            │
│                                  │
│ [Spara ändringar]               │
└──────────────────────────────────┘
```

### 3. **Add Admin Actions Menu** ⏳ TODO
Show for community admins on their communities:

**Actions:**
- 🔗 **Skapa inbjudningslänk** → Opens invitation modal
- 🏠 **Redigera hemsida** → Navigate to `/local?community=[id]&tab=hemsida`
- ✏️ **Redigera samhälle** → Opens edit modal
- 🚪 **Lämna samhälle** → With protection (see below)

**UI (Dropdown Menu):**
```
┌─────────────────────────────┐
│ Din roll: Administratör     │
├─────────────────────────────┤
│ 🔗 Skapa inbjudningslänk   │
│ 🏠 Redigera hemsida         │
│ ✏️ Redigera samhälle        │
│ ─────────────────────────   │
│ 🚪 Lämna samhälle           │
└─────────────────────────────┘
```

### 4. **Invitation Link Creation Modal** ⏳ TODO
Quick invitation creation from community card:

**UI:**
```
┌──────────────────────────────────┐
│ 🔗 Skapa inbjudningslänk    [X] │
├──────────────────────────────────┤
│ Samhälle: [Name]                 │
│                                  │
│ Inbjudningskod: A3F7B2K9         │
│                                  │
│ Länk:                            │
│ beready.se/invite/A3F7B2K9       │
│ [📋 Kopiera länk]               │
│                                  │
│ Avancerade inställningar:        │
│ Max användningar: [____] (valfri)│
│ Utgår: [____] (valfri)          │
│                                  │
│ [Skapa inbjudan]                │
│                                  │
│ eller                            │
│ [Hantera alla inbjudningar →]   │
└──────────────────────────────────┘
```

### 5. **Prevent Last Admin From Leaving** ⏳ TODO
Before allowing admin to leave, check:

```typescript
async function canAdminLeave(communityId: string, userId: string): Promise<{
  canLeave: boolean;
  reason?: string;
}> {
  // Get all admins in community
  const admins = await getAdminsForCommunity(communityId);
  
  // If this is the last admin
  if (admins.length === 1 && admins[0].user_id === userId) {
    return {
      canLeave: false,
      reason: 'Du är den sista administratören. Utse en ny administratör innan du lämnar.'
    };
  }
  
  return { canLeave: true };
}
```

**Error Modal:**
```
┌──────────────────────────────────┐
│ ⚠️ Kan inte lämna samhället      │
├──────────────────────────────────┤
│ Du är den sista administratören. │
│ Du måste först:                  │
│                                  │
│ 1. Utse en ny administratör      │
│    från medlemslistan, eller     │
│ 2. Ta bort samhället helt        │
│                                  │
│ [Gå till medlemshantering]      │
│ [Stäng]                         │
└──────────────────────────────────┘
```

---

## 📁 Files to Modify

### 1. `community-discovery-mobile.tsx`
**Changes:**
- Add `showEditModal` state
- Add `editingCommunity` state
- Add `showInviteModal` state
- Create `EditModal()` component
- Create `InviteModal()` component  
- Create `AdminActionsMenu()` component
- Add `handleEditCommunity()` function
- Add `handleCreateInvite()` function
- Add `handleLeave Community()` with admin check
- Update community card rendering to show admin menu

### 2. `community-discovery.tsx` (Desktop)
**Same changes as mobile version**

### 3. Create helper function `lib/community-admin-helpers.ts`
```typescript
export async function canAdminLeaveCommunity(
  communityId: string,
  userId: string
): Promise<{ canLeave: boolean; reason?: string }>;

export async function getAdminCount(
  communityId: string
): Promise<number>;

export async function promoteToAdmin(
  communityId: string,
  userId: string
): Promise<void>;
```

---

## 🎨 UI/UX Considerations

### Admin Badge on Cards
```tsx
{isAdmin(community.id) && (
  <span className="absolute top-4 right-4 px-3 py-1 bg-[#3D4A2B] text-white text-xs font-bold rounded-full">
    Admin
  </span>
)}
```

### Quick Actions for Admins
```tsx
{isAdmin(community.id) ? (
  <div className="flex gap-2">
    <button onClick={() => openInviteModal(community)}>
      🔗 Inbjudningslänk
    </button>
    <button onClick={() => navigateToHomepage(community)}>
      🏠 Hemsida
    </button>
    <button onClick={() => openEditModal(community)}>
      ✏️ Redigera
    </button>
  </div>
) : (
  <button onClick={() => joinCommunity(community.id)}>
    Gå med
  </button>
)}
```

---

## 🔐 Security Checks

### Before Editing:
```typescript
const canEdit = await checkUserRole(community.id, user.id);
if (canEdit !== 'admin' && canEdit !== 'moderator') {
  showError('Du har inte behörighet att redigera');
  return;
}
```

### Before Leaving:
```typescript
const { canLeave, reason } = await canAdminLeaveCommunity(
  community.id,
  user.id
);

if (!canLeave) {
  showWarningModal(reason);
  return;
}
```

### Before Creating Invitation:
```typescript
// Check if user is admin
const membership = await getMembership(community.id, user.id);
if (!['admin', 'moderator'].includes(membership.role)) {
  showError('Endast administratörer kan skapa inbjudningar');
  return;
}
```

---

## 📊 Database Queries Needed

### Get Admin Count:
```sql
SELECT COUNT(*) as admin_count
FROM community_memberships
WHERE community_id = $1
  AND role = 'admin'
  AND membership_status = 'approved';
```

### Get User Role:
```sql
SELECT role
FROM community_memberships
WHERE community_id = $1
  AND user_id = $2
  AND membership_status = 'approved';
```

### Update Community Settings:
```sql
UPDATE local_communities
SET 
  community_name = $2,
  description = $3,
  access_type = $4,
  is_public = $5
WHERE id = $1
  AND created_by = $6; -- Security: only creator can edit
```

---

## 🚀 Implementation Order

1. **Phase 1: Backend Protection** (Critical)
   - [ ] Create `canAdminLeaveCommunity()` function
   - [ ] Add RLS policy check for editing communities
   - [ ] Test admin count query

2. **Phase 2: Edit Modal** (High Priority)
   - [ ] Create EditModal component
   - [ ] Add state management
   - [ ] Connect to update API
   - [ ] Test save functionality

3. **Phase 3: Invitation Quick Create** (High Priority)
   - [ ] Create InviteModal component
   - [ ] Connect to `generate_invitation_code()` 
   - [ ] Add copy-to-clipboard
   - [ ] Link to full invitation management

4. **Phase 4: Admin Menu** (Medium Priority)
   - [ ] Create dropdown menu component
   - [ ] Add homepage navigation link
   - [ ] Add edit button
   - [ ] Add leave button with protection

5. **Phase 5: Desktop Version** (Medium Priority)
   - [ ] Apply same changes to `community-discovery.tsx`
   - [ ] Adjust UI for desktop layout

---

## ✅ Testing Checklist

**Edit Community:**
- [ ] Admin can edit community name
- [ ] Admin can change Open/Closed status
- [ ] Non-admin cannot edit
- [ ] Changes save correctly to database
- [ ] UI updates after save

**Invitation Creation:**
- [ ] Admin can create invitation from card
- [ ] Code generates correctly
- [ ] Copy to clipboard works
- [ ] Link to full management works
- [ ] Non-admin cannot create

**Admin Protection:**
- [ ] Last admin sees warning when trying to leave
- [ ] Last admin is blocked from leaving
- [ ] Non-last admin can leave normally
- [ ] Promotes another user to admin before leaving (optional feature)

**Homepage Link:**
- [ ] Admin sees "Redigera hemsida" button
- [ ] Clicking navigates to correct URL
- [ ] Opens in full-screen editor
- [ ] Non-admin doesn't see button

---

## 🎯 Success Criteria

✅ Admins can easily edit community settings from discovery page  
✅ Admins can quickly create invitation links  
✅ System prevents orphaned communities (no admins)  
✅ Clear path to homepage editing  
✅ All actions properly secured with role checks  

---

**Estimated Implementation Time**: 4-6 hours  
**Priority Files**: 
1. `community-admin-helpers.ts` (create)
2. `community-discovery-mobile.tsx` (update)
3. `community-discovery.tsx` (update)

