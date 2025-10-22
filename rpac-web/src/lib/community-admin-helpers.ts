import { supabase } from './supabase';

/**
 * Check if a user can leave a community (prevents last admin from leaving)
 */
export async function canAdminLeaveCommunity(
  communityId: string,
  userId: string
): Promise<{ canLeave: boolean; reason?: string; isLastAdmin: boolean }> {
  try {
    // Get user's current role
    const { data: membership } = await supabase
      .from('community_memberships')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('membership_status', 'approved')
      .single();

    // If not an admin, can leave freely
    if (!membership || membership.role !== 'admin') {
      return { canLeave: true, isLastAdmin: false };
    }

    // Count total admins
    const { data: admins, error } = await supabase
      .from('community_memberships')
      .select('user_id')
      .eq('community_id', communityId)
      .eq('role', 'admin')
      .eq('membership_status', 'approved');

    if (error) throw error;

    const adminCount = admins?.length || 0;

    // If last admin
    if (adminCount === 1) {
      return {
        canLeave: false,
        reason: 'Du är den sista administratören. Utse en ny administratör innan du lämnar.',
        isLastAdmin: true
      };
    }

    return { canLeave: true, isLastAdmin: false };
  } catch (error) {
    console.error('Error checking if admin can leave:', error);
    return {
      canLeave: false,
      reason: 'Ett fel uppstod vid kontroll av administratörsstatus',
      isLastAdmin: false
    };
  }
}

/**
 * Get the count of admins in a community
 */
export async function getAdminCount(communityId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('community_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('role', 'admin')
      .eq('membership_status', 'approved');

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting admin count:', error);
    return 0;
  }
}

/**
 * Get user's role in a community
 */
export async function getUserRole(
  communityId: string,
  userId: string
): Promise<'admin' | 'moderator' | 'member' | null> {
  try {
    const { data } = await supabase
      .from('community_memberships')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('membership_status', 'approved')
      .single();

    return (data?.role as 'admin' | 'moderator' | 'member') || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is admin or moderator
 */
export async function canManageCommunity(
  communityId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(communityId, userId);
  return role === 'admin' || role === 'moderator';
}

/**
 * Create a quick invitation link
 */
export async function createQuickInvitation(
  communityId: string,
  createdBy: string,
  description?: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // Generate code
    const { data: codeData, error: codeError } = await supabase.rpc('generate_invitation_code');
    
    if (codeError || !codeData) {
      // Fallback to client-side generation
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      
      const { error: insertError } = await supabase
        .from('community_invitations')
        .insert({
          community_id: communityId,
          created_by: createdBy,
          invitation_code: code,
          description: description || 'Snabbinbjudan'
        });

      if (insertError) throw insertError;
      return { success: true, code };
    }

    // Use RPC-generated code
    const { error: insertError } = await supabase
      .from('community_invitations')
      .insert({
        community_id: communityId,
        created_by: createdBy,
        invitation_code: codeData,
        description: description || 'Snabbinbjudan'
      });

    if (insertError) throw insertError;
    return { success: true, code: codeData };
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update community settings
 */
export async function updateCommunitySettings(
  communityId: string,
  updates: {
    community_name?: string;
    description?: string;
    access_type?: 'open' | 'closed';
    auto_approve_members?: boolean;
    is_public?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('local_communities')
      .update(updates)
      .eq('id', communityId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating community:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Leave a community (with admin check)
 */
export async function leaveCommunity(
  communityId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if can leave
    const { canLeave, reason } = await canAdminLeaveCommunity(communityId, userId);
    
    if (!canLeave) {
      return { success: false, error: reason };
    }

    // Delete membership
    const { error } = await supabase
      .from('community_memberships')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error leaving community:', error);
    return { success: false, error: error.message };
  }
}

