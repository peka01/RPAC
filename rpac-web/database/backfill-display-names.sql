-- Backfill Display Names for Existing Users
-- This script generates display names from email addresses for users who don't have one set
-- Date: 2025-10-09

-- This function extracts a display name from an email address
-- Example: per.karlsson@example.com -> "Per Karlsson"
CREATE OR REPLACE FUNCTION generate_display_name_from_email(email_address TEXT)
RETURNS TEXT AS $$
DECLARE
  local_part TEXT;
  parts TEXT[];
  part TEXT;
  capitalized_parts TEXT[] := '{}';
  result TEXT;
BEGIN
  -- Extract the local part (before @)
  IF email_address IS NULL OR email_address NOT LIKE '%@%' THEN
    RETURN 'Användare';
  END IF;
  
  local_part := split_part(email_address, '@', 1);
  
  -- Split by common separators (., _, -)
  parts := regexp_split_to_array(local_part, '[._-]');
  
  -- Capitalize each part
  FOREACH part IN ARRAY parts
  LOOP
    IF length(part) > 0 THEN
      capitalized_parts := array_append(
        capitalized_parts,
        initcap(part)
      );
    END IF;
  END LOOP;
  
  -- Join with spaces
  result := array_to_string(capitalized_parts, ' ');
  
  -- If result is empty, return a default
  IF result IS NULL OR trim(result) = '' THEN
    RETURN 'Användare';
  END IF;main-app.js?v=1760038766695:1847 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
weather-service.ts:185 🌤️ SMHI Weather Data: {temperature: 11.1, humidity: 90, windSpeed: 5.3, pressure: 1005.9, rainfall: 0.7, …}
weather-service.ts:185 🌤️ SMHI Weather Data: {temperature: 11.1, humidity: 90, windSpeed: 5.3, pressure: 1005.9, rainfall: 0.7, …}
top-menu.tsx:125 📡 Top menu subscribed to notifications
top-menu.tsx:71 🔢 Top menu unread count updated: 0
messaging-system-v2.tsx:124 👥 Loading contacts for community: cd857625-a53a-4bb6-9970-b60db3cb8c73
messaging-system-v2.tsx:152 🔍 MessagingSystemV2 loadMessages called with: {userId: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', activeTab: 'direct', communityId: 'cd857625-a53a-4bb6-9970-b60db3cb8c73', activeContact: undefined}
messaging-system-v2.tsx:161 📝 Direct tab without contact - setting empty messages
messaging-service.ts:344 🔔 Setting up realtime subscription: {channelName: 'messages:34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', userId: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', recipientId: undefined, communityId: undefined}
messaging-service.ts:380 🔔 Subscription status: CLOSED
messaging-system-v2.tsx:124 👥 Loading contacts for community: cd857625-a53a-4bb6-9970-b60db3cb8c73
messaging-system-v2.tsx:152 🔍 MessagingSystemV2 loadMessages called with: {userId: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', activeTab: 'direct', communityId: 'cd857625-a53a-4bb6-9970-b60db3cb8c73', activeContact: undefined}
messaging-system-v2.tsx:161 📝 Direct tab without contact - setting empty messages
messaging-service.ts:344 🔔 Setting up realtime subscription: {channelName: 'messages:34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', userId: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', recipientId: undefined, communityId: undefined}
messaging-service.ts:380 🔔 Subscription status: SUBSCRIBED
fetch.js:23   POST https://dsoujjudzrrtkkqwhpge.supabase.co/rest/v1/rpc/get_community_members_with_emails 404 (Not Found)
eval @ fetch.js:23
eval @ fetch.js:44
fulfilled @ fetch.js:4
Promise.then
step @ fetch.js:6
eval @ fetch.js:7
__awaiter @ fetch.js:3
eval @ fetch.js:34
then @ PostgrestBuilder.js:66
messaging-service.ts:415  RPC call failed, falling back to basic query: {code: 'PGRST202', details: 'Searched for the function public.get_community_mem…r, but no matches were found in the schema cache.', hint: 'Perhaps you meant to call the function public.get_resource_request_details', message: 'Could not find the function public.get_community_m…s_with_emails(p_community_id) in the schema cache'}
getOnlineUsers @ messaging-service.ts:415
await in getOnlineUsers
loadInitialData @ messaging-system-v2.tsx:125
eval @ messaging-system-v2.tsx:63
commitHookEffectListMount @ react-dom.development.js:21102
commitHookPassiveMountEffects @ react-dom.development.js:23154
commitPassiveMountOnFiber @ react-dom.development.js:23259
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23267
fetch.js:23   POST https://dsoujjudzrrtkkqwhpge.supabase.co/rest/v1/rpc/get_community_members_with_emails 404 (Not Found)
eval @ fetch.js:23
eval @ fetch.js:44
fulfilled @ fetch.js:4
Promise.then
step @ fetch.js:6
eval @ fetch.js:7
__awaiter @ fetch.js:3
eval @ fetch.js:34
then @ PostgrestBuilder.js:66
messaging-service.ts:415  RPC call failed, falling back to basic query: {code: 'PGRST202', details: 'Searched for the function public.get_community_mem…r, but no matches were found in the schema cache.', hint: 'Perhaps you meant to call the function public.get_resource_request_details', message: 'Could not find the function public.get_community_m…s_with_emails(p_community_id) in the schema cache'}
getOnlineUsers @ messaging-service.ts:415
await in getOnlineUsers
loadInitialData @ messaging-system-v2.tsx:125
eval @ messaging-system-v2.tsx:63
commitHookEffectListMount @ react-dom.development.js:21102
invokePassiveEffectMountInDEV @ react-dom.development.js:23980
invokeEffectsInDev @ react-dom.development.js:26852
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26835
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26816
flushPassiveEffectsImpl @ react-dom.development.js:26514
flushPassiveEffects @ react-dom.development.js:26438
eval @ react-dom.development.js:26172
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
messaging-service.ts:448 👤 Processing contact: {user_id: '1def1560-5a92-454c-af4b-f97442c9403e', profile_found: true, display_name: 'PerraP'}
messaging-service.ts:465 ✅ Using display_name: PerraP
messaging-service.ts:448 👤 Processing contact: {user_id: '831ee387-8976-4dd8-b258-59e51c104a2f', profile_found: true, display_name: 'Malin Sälgfors'}
messaging-service.ts:465 ✅ Using display_name: Malin Sälgfors
messaging-service.ts:448 👤 Processing contact: {user_id: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', profile_found: true, display_name: 'Per Karlsson'}
messaging-service.ts:465 ✅ Using display_name: Per Karlsson
messaging-service.ts:448 👤 Processing contact: {user_id: '966c09bc-4ead-4ca7-a715-af079e232c67', profile_found: false, display_name: undefined}
messaging-service.ts:457  ⚠️ No profile found for user: 966c09bc-4ead-4ca7-a715-af079e232c67
eval @ messaging-service.ts:457
getOnlineUsers @ messaging-service.ts:444
await in getOnlineUsers
loadInitialData @ messaging-system-v2.tsx:125
eval @ messaging-system-v2.tsx:63
commitHookEffectListMount @ react-dom.development.js:21102
commitHookPassiveMountEffects @ react-dom.development.js:23154
commitPassiveMountOnFiber @ react-dom.development.js:23259
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23256
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23370
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23237
commitPassiveMountOnFiber @ react-dom.development.js:23267
messaging-system-v2.tsx:126 👥 Online users loaded: 4 (4) [{…}, {…}, {…}, {…}]
messaging-system-v2.tsx:127 👥 Current user ID: 34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721
messaging-system-v2.tsx:130 👥 Filtered contacts (excluding self): 3 (3) [{…}, {…}, {…}]
messaging-system-v2.tsx:131 👥 Contact details: (4) [{…}, {…}, {…}, {…}]
messaging-system-v2.tsx:152 🔍 MessagingSystemV2 loadMessages called with: {userId: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', activeTab: 'direct', communityId: 'cd857625-a53a-4bb6-9970-b60db3cb8c73', activeContact: undefined}
messaging-system-v2.tsx:161 📝 Direct tab without contact - setting empty messages
messaging-service.ts:448 👤 Processing contact: {user_id: '1def1560-5a92-454c-af4b-f97442c9403e', profile_found: true, display_name: 'PerraP'}
messaging-service.ts:465 ✅ Using display_name: PerraP
messaging-service.ts:448 👤 Processing contact: {user_id: '831ee387-8976-4dd8-b258-59e51c104a2f', profile_found: true, display_name: 'Malin Sälgfors'}
messaging-service.ts:465 ✅ Using display_name: Malin Sälgfors
messaging-service.ts:448 👤 Processing contact: {user_id: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', profile_found: true, display_name: 'Per Karlsson'}
messaging-service.ts:465 ✅ Using display_name: Per Karlsson
messaging-service.ts:448 👤 Processing contact: {user_id: '966c09bc-4ead-4ca7-a715-af079e232c67', profile_found: false, display_name: undefined}
messaging-service.ts:457  ⚠️ No profile found for user: 966c09bc-4ead-4ca7-a715-af079e232c67
eval @ messaging-service.ts:457
getOnlineUsers @ messaging-service.ts:444
await in getOnlineUsers
loadInitialData @ messaging-system-v2.tsx:125
eval @ messaging-system-v2.tsx:63
commitHookEffectListMount @ react-dom.development.js:21102
invokePassiveEffectMountInDEV @ react-dom.development.js:23980
invokeEffectsInDev @ react-dom.development.js:26852
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26835
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26816
flushPassiveEffectsImpl @ react-dom.development.js:26514
flushPassiveEffects @ react-dom.development.js:26438
eval @ react-dom.development.js:26172
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
messaging-system-v2.tsx:126 👥 Online users loaded: 4 (4) [{…}, {…}, {…}, {…}]
messaging-system-v2.tsx:127 👥 Current user ID: 34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721
messaging-system-v2.tsx:130 👥 Filtered contacts (excluding self): 3 (3) [{…}, {…}, {…}]
messaging-system-v2.tsx:131 👥 Contact details: (4) [{…}, {…}, {…}, {…}]
messaging-system-v2.tsx:152 🔍 MessagingSystemV2 loadMessages called with: {userId: '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', activeTab: 'direct', communityId: 'cd857625-a53a-4bb6-9970-b60db3cb8c73', activeContact: undefined}
messaging-system-v2.tsx:161 📝 Direct tab without contact - setting empty messages

  
  RETURN trim(result);
END;
$$ LANGUAGE plpgsql;

-- Backfill display names in user_profiles table
DO $$
DECLARE
  profile_record RECORD;
  user_email TEXT;
  generated_name TEXT;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting display name backfill...';
  
  -- Loop through all user profiles that don't have a display_name
  FOR profile_record IN
    SELECT up.id, up.user_id, up.display_name
    FROM user_profiles up
    WHERE up.display_name IS NULL 
       OR trim(up.display_name) = '' 
       OR up.display_name SIMILAR TO '(Medlem [0-9]+|Användare)'
  LOOP
    -- Get email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = profile_record.user_id;
    
    IF user_email IS NOT NULL THEN
      -- Generate display name from email
      generated_name := generate_display_name_from_email(user_email);
      
      -- Update user_profiles
      UPDATE user_profiles
      SET 
        display_name = generated_name,
        updated_at = NOW()
      WHERE id = profile_record.id;
      
      updated_count := updated_count + 1;
      
      RAISE NOTICE 'Updated profile % (user %): % -> %', 
        profile_record.id, 
        profile_record.user_id, 
        user_email, 
        generated_name;
    ELSE
      RAISE WARNING 'No email found for user_id: %', profile_record.user_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! Updated % profiles.', updated_count;
END $$;

-- Also update auth.users metadata for consistency
DO $$
DECLARE
  user_record RECORD;
  generated_name TEXT;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting auth metadata backfill...';
  
  -- Loop through all users
  FOR user_record IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE 
      email IS NOT NULL 
      AND (
        raw_user_meta_data->>'display_name' IS NULL 
        OR trim(raw_user_meta_data->>'display_name') = ''
        OR raw_user_meta_data->>'display_name' SIMILAR TO '(Medlem [0-9]+|Användare)'
      )
  LOOP
    -- Generate display name from email
    generated_name := generate_display_name_from_email(user_record.email);
    
    -- Update auth.users metadata
    UPDATE auth.users
    SET 
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{display_name}',
        to_jsonb(generated_name)
      ),
      updated_at = NOW()
    WHERE id = user_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE NOTICE 'Updated auth user %: % -> %', 
      user_record.id, 
      user_record.email, 
      generated_name;
  END LOOP;
  
  RAISE NOTICE 'Auth metadata backfill complete! Updated % users.', updated_count;
END $$;

-- Verify the results
DO $$
DECLARE
  total_profiles INTEGER;
  profiles_with_names INTEGER;
  profiles_without_names INTEGER;
BEGIN
  -- Count total profiles
  SELECT COUNT(*) INTO total_profiles FROM user_profiles;
  
  -- Count profiles with display names
  SELECT COUNT(*) INTO profiles_with_names 
  FROM user_profiles 
  WHERE display_name IS NOT NULL 
    AND trim(display_name) != '' 
    AND display_name NOT SIMILAR TO '(Medlem [0-9]+|Användare)';
  
  -- Count profiles without display names
  SELECT COUNT(*) INTO profiles_without_names 
  FROM user_profiles 
  WHERE display_name IS NULL 
     OR trim(display_name) = '' 
     OR display_name SIMILAR TO '(Medlem [0-9]+|Användare)';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total user profiles: %', total_profiles;
  RAISE NOTICE 'Profiles with display names: %', profiles_with_names;
  RAISE NOTICE 'Profiles without display names: %', profiles_without_names;
  RAISE NOTICE '========================================';
  
  IF profiles_without_names > 0 THEN
    RAISE WARNING 'There are still % profiles without proper display names!', profiles_without_names;
  ELSE
    RAISE NOTICE 'SUCCESS! All profiles now have display names.';
  END IF;
END $$;

-- Clean up the temporary function (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS generate_display_name_from_email(TEXT);

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Display name backfill script completed successfully!';
  RAISE NOTICE '========================================';
END $$;

