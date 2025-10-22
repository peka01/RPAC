'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.code as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkInvitation();
  }, [inviteCode]);

  const checkInvitation = async () => {
    try {
      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Get invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from('community_invitations')
        .select(`
          *,
          local_communities (
            id,
            community_name,
            county,
            description,
            member_count
          )
        `)
        .eq('invitation_code', inviteCode)
        .eq('is_active', true)
        .single();

      if (inviteError || !inviteData) {
        setError('Ogiltig eller utgången inbjudningskod');
        setLoading(false);
        return;
      }

      // Check if expired
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        setError('Denna inbjudningslänk har gått ut');
        setLoading(false);
        return;
      }

      // Check if max uses reached
      if (inviteData.max_uses && inviteData.current_uses >= inviteData.max_uses) {
        setError('Denna inbjudningslänk har använts maximalt antal gånger');
        setLoading(false);
        return;
      }

      setInvitation(inviteData);
      setCommunity(inviteData.local_communities);

      // If user is logged in, check if already member
      if (currentUser) {
        const { data: membership } = await supabase
          .from('community_memberships')
          .select('*')
          .eq('community_id', inviteData.community_id)
          .eq('user_id', currentUser.id)
          .single();

        if (membership) {
          if (membership.membership_status === 'approved') {
            setError('Du är redan medlem i detta samhälle');
          } else if (membership.membership_status === 'pending') {
            setError('Du har redan en väntande ansökan till detta samhälle');
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking invitation:', err);
      setError('Ett fel uppstod vid kontroll av inbjudan');
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${inviteCode}`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('use_community_invitation', {
        p_invitation_code: inviteCode,
        p_user_id: user.id
      });

      if (rpcError || !data || !data.success) {
        setError(data?.error || 'Kunde inte använda inbjudan');
        setProcessing(false);
        return;
      }

      setSuccess(true);
      setRequiresApproval(data.requires_approval || false);
      
      // Redirect to community after 3 seconds (more time to read message)
      setTimeout(() => {
        router.push('/local');
      }, 3000);
    } catch (err: any) {
      console.error('Error using invitation:', err);
      setError(err.message || 'Ett fel uppstod');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar inbjudan..." />
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ogiltig inbjudan</h1>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-[#3D4A2B] text-white rounded-xl font-semibold hover:bg-[#2A331E] transition-all"
          >
            Tillbaka till startsidan
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className={`w-20 h-20 ${requiresApproval ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500`}>
              <CheckCircle size={48} className={requiresApproval ? 'text-blue-600' : 'text-green-600'} />
            </div>
            
            {requiresApproval ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ansökan skickad!</h1>
                <p className="text-gray-600 mb-4">
                  Din ansökan till <strong>{community?.community_name}</strong> har skickats.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    ℹ️ Detta är ett stängt samhälle. En administratör kommer att granska din ansökan inom kort.
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Du får ett meddelande när du blir godkänd.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Välkommen!</h1>
                <p className="text-gray-600 mb-4">
                  Du är nu medlem i <strong>{community?.community_name}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Omdirigerar till ditt samhälle...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Inbjudan till samhälle
          </h1>
          <p className="text-gray-600">
            Du har blivit inbjuden att gå med i ett lokalt beredskapssamhälle
          </p>
        </div>

        {/* Community Info */}
        {community && (
          <div className="bg-gradient-to-br from-[#5C6B47]/10 to-[#4A5239]/5 rounded-xl p-6 mb-6 border-2 border-[#5C6B47]/30">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {community.community_name}
            </h2>
            {community.county && (
              <p className="text-sm text-gray-600 mb-3">📍 {community.county}</p>
            )}
            {community.description && (
              <p className="text-gray-700 mb-3">{community.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={16} />
              <span>{community.member_count || 0} medlemmar</span>
            </div>
          </div>
        )}

        {/* Invitation Details */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            Om inbjudningar
          </h3>
          {community?.access_type === 'open' || community?.auto_approve_members ? (
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Du blir automatiskt godkänd som medlem</li>
              <li>✅ Ingen väntetid för godkännande</li>
              <li>✅ Direkt tillgång till samhällets resurser</li>
            </ul>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1">
              <li>📋 Inbjudan skapar en medlemsansökan</li>
              <li>⏳ En administratör granskar din ansökan</li>
              <li>✅ Du får tillgång när du godkänts</li>
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAcceptInvite}
            disabled={processing}
            className="w-full px-6 py-3 bg-[#3D4A2B] text-white rounded-xl font-semibold hover:bg-[#2A331E] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <ShieldProgressSpinner variant="bounce" size="sm" />
                Ansluter...
              </>
            ) : user ? (
              <>
                Acceptera inbjudan
                <ArrowRight size={20} />
              </>
            ) : (
              <>
                Logga in för att acceptera
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Avböj
          </button>
        </div>

        {/* Help Text */}
        {!user && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Du måste ha ett Beready-konto för att acceptera inbjudan.
            {' '}
            <Link href="/login" className="text-[#3D4A2B] hover:underline">
              Logga in
            </Link>
            {' '}eller{' '}
            <Link href="/signup" className="text-[#3D4A2B] hover:underline">
              skapa konto
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

