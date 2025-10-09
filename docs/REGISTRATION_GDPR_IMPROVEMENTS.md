# Registration & GDPR Improvements
**Date**: 2025-10-09
**Status**: ✅ COMPLETED

## Summary
Enhanced the user registration process with mandatory display name field, smart name suggestion from email, and GDPR consent requirement.

## Changes Made

### 1. Smart Display Name Suggestion
- **File**: `rpac-web/src/app/page.tsx`
- **Function**: `suggestDisplayNameFromEmail(email: string)`
- Automatically suggests a display name from the email address
- Example: `per.karlsson@title.se` → "Per Karlsson"
- Capitalizes each part separated by `.`, `_`, or `-`
- Auto-fills when user enters email during signup

### 2. Mandatory Display Name Field
- Display name is now required for registration
- Shows validation error if left empty
- Helper text explains that this name will be visible to other users
- Marked with red asterisk `*` to indicate required field
- Saved to both:
  - `auth.users` metadata (`user_metadata.display_name`)
  - `user_profiles` table (`display_name` column)

### 3. GDPR Consent Checkbox
- **Required** checkbox for registration
- Located before the "Skapa konto" button
- Submit button is disabled until checkbox is checked
- Shows validation error if user tries to register without consent
- Text: "Jag godkänner att Beready lagrar och behandlar mina personuppgifter enligt GDPR..."
- Includes helper text about privacy protection

### 4. Localization Strings Added
**File**: `rpac-web/src/lib/locales/sv.json`

New keys in `forms` section:
- `display_name`: "Visningsnamn"

New keys in `placeholders` section:
- `enter_display_name`: "T.ex. Per Karlsson"

New keys in `auth` section:
- `display_name_required`: "Visningsnamn måste anges"
- `display_name_helper`: "Detta namn kommer att visas för andra användare i samhällsfunktioner"
- `gdpr_consent_required`: "Du måste godkänna villkoren för att skapa ett konto"
- `gdpr_consent_text`: "Jag godkänner att Beready lagrar och behandlar mina personuppgifter enligt GDPR. Jag förstår att jag kan återkalla mitt samtycke när som helst."
- `gdpr_learn_more`: "Läs mer om hur vi skyddar din integritet"
- `privacy_policy`: "Integritetspolicy"
- `terms_of_service`: "Användarvillkor"

## User Experience Flow

### Sign Up Process:
1. User enters email (e.g., `per.karlsson@title.se`)
2. Display name field auto-fills with "Per Karlsson"
3. User can edit the suggested name or keep it
4. User enters password
5. User checks GDPR consent checkbox (required)
6. User clicks "Skapa konto"
7. System validates:
   - Display name is not empty
   - GDPR consent is checked
   - Password meets requirements
8. User profile created with display_name
9. Success! User is redirected to dashboard

### Sign In Process:
- Unchanged - only email and password required
- No display name or GDPR checkbox shown

## Technical Details

### Display Name Suggestion Algorithm
```typescript
const suggestDisplayNameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '';
  
  const localPart = email.split('@')[0];
  // Remove common separators and convert to title case
  const parts = localPart.split(/[._-]/);
  const capitalized = parts.map(part => {
    if (part.length === 0) return '';
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  });
  
  return capitalized.join(' ').trim();
};
```

### Examples:
- `per.karlsson@example.com` → "Per Karlsson"
- `john_doe@example.com` → "John Doe"
- `mary-jane@example.com` → "Mary Jane"
- `simple@example.com` → "Simple"

### Database Storage
Display name is stored in two places:
1. **Supabase Auth Metadata**: `auth.users.user_metadata.display_name`
2. **User Profiles Table**: `user_profiles.display_name`

This dual storage ensures:
- Auth system has the display name for quick access
- User profiles table has it for queries and joins
- Existing trigger (`set_default_display_name()`) will maintain consistency

## Related Issues Fixed
This enhancement also addresses the "Medlem 4" issue reported earlier by ensuring all new users have a proper display name from registration.

## Testing Checklist
- [x] Email suggestion works correctly for various email formats
- [x] Display name is required (validation error shown)
- [x] GDPR checkbox is required (validation error shown)
- [x] Submit button disabled until GDPR checked
- [x] Display name saved to both auth metadata and user_profiles
- [x] Toggle between sign in/sign up resets form state
- [x] No linter errors
- [x] Localization strings all working

## Future Enhancements
- Add links to actual Privacy Policy and Terms of Service pages
- Allow users to update their display name in settings
- Add option to show/hide display name in privacy settings
- Implement proper GDPR data export/deletion features

