'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { 
  Heart, 
  Shield, 
  Users, 
  Leaf, 
  Radio, 
  MessageCircle,
  Sun,
  Moon,
  CheckCircle,
  Smile,
  Wind,
  Droplets
} from 'lucide-react';
import { StatusCard } from '@/components/status-card';
import { PreparednessOverview } from '@/components/preparedness-overview';
import { ResourceSummaryCard } from '@/components/resource-summary-card';
import { CommunityCoordinationSummary } from '@/components/community-coordination-summary';
import { MessagingSystem } from '@/components/messaging-system';
import { ExternalCommunication } from '@/components/external-communication';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();


  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        // If no user is authenticated, try to authenticate with demo user
        console.log('No user authenticated, trying demo login...');
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'demo@rpac.se',
            password: 'demo123'
          });
          
          if (signInError) {
            console.log('Demo user not found, creating...');
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'demo@rpac.se',
              password: 'demo123',
              options: {
                data: {
                  name: 'Demo Användare'
                }
              }
            });
            
            if (signUpError) {
              console.error('Failed to create demo user:', signUpError);
              router.push('/');
              return;
            }
            
            // Wait for user creation and try to sign in again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: 'demo@rpac.se',
              password: 'demo123'
            });
            
            if (retryError) {
              console.error('Failed to sign in demo user:', retryError);
              router.push('/');
              return;
            }
          }
          
          // Get the authenticated user
          const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
          if (authenticatedUser) {
            setUser(authenticatedUser);
            setLoading(false);
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          router.push('/');
        }
      }
    };
    checkUser();

    // Update time every minute for natural rhythm
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Note: Removed heartbeat animation to prevent flashing

    return () => {
      clearInterval(timeInterval);
    };
  }, [router]);

  // Professional military loading experience
  if (loading) {
    return (
      <div className="h-full overflow-hidden flex items-center justify-center relative" style={{ background: 'var(--bg-primary)' }}>
        {/* Professional background patterns */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 opacity-[0.02]">
            <div className="w-full h-full rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          </div>
          <div className="absolute bottom-20 right-20 w-24 h-24 opacity-[0.02]">
            <div className="w-full h-full rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
          </div>
        </div>
        
        <div className="text-center z-10 max-w-md mx-auto px-6">
          {/* Military-style loading indicator */}
          <div className="mb-8">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto shadow-lg mb-6" style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' 
            }}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            {/* Clean progress bar */}
            <div className="w-64 mx-auto">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('dashboard.loading_progress')}</span>
                <span>75%</span>
              </div>
              <div className="h-2 rounded-full border" style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'var(--color-secondary)' 
              }}>
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                    width: '75%',
                    transition: 'none' // Remove animations to prevent flashing
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                <span>{t('dashboard.loading_status_start')}</span>
                <span>{t('dashboard.loading_status_end')}</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.loading_title')}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.loading_description')}
          </p>
        </div>
      </div>
    );
  }

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return t('dashboard.good_night');
    if (hour < 12) return t('dashboard.good_morning');
    if (hour < 18) return t('dashboard.good_day');
    return t('dashboard.good_evening');
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || t('dashboard.default_user');

  return (
    <div className="relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Dashboard Content */}
        <div className="space-y-6">

          {/* Professional Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {/* Preparedness Status Report */}
            <div className="group bg-white/95 rounded-lg p-4 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-sage)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
                }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: 'var(--color-sage)' }}>92%</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.preparedness_level')}</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('dashboard.operational_status_title')}</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.resources_status')}</p>
              <div className="flex space-x-2">
                <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'rgba(135, 169, 107, 0.2)' }}>
                  <div className="h-2 rounded-full" style={{ width: '92%', backgroundColor: 'var(--color-sage)' }}></div>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-sage)' }}>{t('dashboard.optimal')}</span>
              </div>
            </div>

            {/* Network Intelligence */}
            <div className="group bg-white/95 rounded-lg p-4 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-cool-olive)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-cool-olive) 0%, var(--color-tertiary) 100%)' 
                }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: 'var(--color-cool-olive)' }}>23</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.contacts')}</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('dashboard.network')}</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.community_status_description')}</p>
              <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--color-cool-olive)' }}>
                <MessageCircle className="w-3 h-3" />
                <span>{t('dashboard.messages_count')}</span>
              </div>
            </div>

            {/* Cultivation Management */}
            <div 
              className="group bg-white/95 rounded-lg p-4 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer lg:col-span-2 xl:col-span-1" 
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-khaki)'
              }}
              onClick={() => router.push('/individual')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)' 
                }}>
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: 'var(--color-khaki)' }}>68%</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.self_sufficiency')}</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('dashboard.cultivation_plan')}</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.cultivation_details')}</p>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2 flex-1">
                  <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'rgba(160, 142, 90, 0.2)' }}>
                    <div className="h-2 rounded-full" style={{ width: '68%', backgroundColor: 'var(--color-khaki)' }}></div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-khaki)' }}>{t('dashboard.good_level')}</span>
                </div>
                <span className="text-xs ml-2 group-hover:underline" style={{ color: 'var(--color-khaki)' }}>
                  {t('dashboard.manage')}
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Communication Hub - Enhanced & Resizable */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="xl:col-span-1">
              {user && <MessagingSystem user={user} communityId="demo-community-1" />}
            </div>
            <div className="xl:col-span-1">
              <ExternalCommunication />
            </div>
          </div>


          {/* Resource Summary */}
          {user && (
            <div className="mb-6">
              <ResourceSummaryCard user={user} />
            </div>
          )}

          {/* Community Coordination Summary */}
          <div className="mb-6">
            <CommunityCoordinationSummary />
          </div>

          {/* Core Preparedness (Crisis-Ready) */}
          <div className="mb-6">
            <StatusCard />
          </div>

          {/* Professional Status Update */}
          <div className="rounded-lg p-3 border shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--bg-olive-light) 0%, var(--bg-card) 100%)',
            borderColor: 'var(--color-secondary)'
          }}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                backgroundColor: 'var(--color-primary)' 
              }}>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.daily_update_complete')}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.daily_update_description')}</p>
              </div>
              <div className="text-lg" style={{ color: 'var(--color-primary)' }}>✓</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}