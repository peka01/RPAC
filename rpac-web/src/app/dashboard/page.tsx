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
  AlertTriangle,
  TrendingUp,
  Smile,
  Wind,
  Droplets
} from 'lucide-react';
import { StatusCard } from '@/components/status-card';
import { QuickActions } from '@/components/quick-actions';
import { PreparednessOverview } from '@/components/preparedness-overview';
import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { CommunityHub } from '@/components/community-hub';
import { MessagingSystem } from '@/components/messaging-system';
import { ExternalCommunication } from '@/components/external-communication';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stressLevel, setStressLevel] = useState<'calm' | 'moderate' | 'stressed'>('calm');
  const [communityHeartbeat, setCommunityHeartbeat] = useState(87); // Community health percentage
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push('/');
      }
    };
    checkUser();

    // Update time every minute for natural rhythm
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Simulate community heartbeat pulse
    const heartbeatInterval = setInterval(() => {
      setCommunityHeartbeat(prev => prev + (Math.random() - 0.5) * 2);
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(heartbeatInterval);
    };
  }, [router]);

  // Revolutionary stress-adaptive loading experience
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Biophilic breathing pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-blue-50/30 to-green-50/40"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-100/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-100/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="text-center z-10">
          {/* Calm confidence loading indicator */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-spin" style={{ animationDuration: '3s' }}></div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Förbereder din trygghet...</h2>
          <p className="text-gray-600">Andas lugnt medan vi laddar din personliga beredskapscentral</p>
        </div>
      </div>
    );
  }

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return "God natt";
    if (hour < 12) return "God morgon";
    if (hour < 18) return "God dag";
    return "God kväll";
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Vän';

  return (
    <div className="min-h-screen relative">
      {/* Professional military background with subtle biophilic touches */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'var(--bg-primary)' }}></div>
        {/* Subtle professional patterns */}
        <div className="absolute top-20 left-20 w-32 h-32 opacity-[0.02]">
          <div className="w-full h-full rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
        </div>
        <div className="absolute bottom-20 right-20 w-24 h-24 opacity-[0.02]">
          <div className="w-full h-full rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Professional Crisis Intelligence Dashboard Header */}
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-md" style={{ 
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' 
                    }}>
                      {currentTime.getHours() >= 6 && currentTime.getHours() < 18 ? 
                        <Sun className="w-7 h-7 text-white" /> : 
                        <Moon className="w-7 h-7 text-white" />
                      }
                    </div>
                    {/* Professional status indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}>
                      <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }}></div>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {getTimeOfDayGreeting()}, {userName}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Beredskapsläge: Operationell • Status: Förberedd</p>
                  </div>
                </div>

                {/* Professional Community Status */}
                <div className="text-center">
                  <div className="relative mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                      background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%)' 
                    }}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nätverk</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(communityHeartbeat)}%</div>
                </div>
              </div>

              {/* Professional Operational Mode Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <button 
                  onClick={() => setStressLevel('calm')}
                  className={`p-3 rounded-lg transition-all duration-300 border ${
                    stressLevel === 'calm' 
                      ? 'border-2 shadow-md' 
                      : 'border hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: stressLevel === 'calm' ? 'rgba(135, 169, 107, 0.15)' : 'var(--bg-card)',
                    borderColor: stressLevel === 'calm' ? 'var(--color-sage)' : 'var(--color-muted)',
                  }}
                >
                  <CheckCircle className={`w-5 h-5 mx-auto mb-1`} style={{ 
                    color: stressLevel === 'calm' ? 'var(--color-sage)' : 'var(--color-muted)' 
                  }} />
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Standard</div>
                </button>
                
                <button 
                  onClick={() => setStressLevel('moderate')}
                  className={`p-3 rounded-lg transition-all duration-300 border ${
                    stressLevel === 'moderate' 
                      ? 'border-2 shadow-md' 
                      : 'border hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: stressLevel === 'moderate' ? 'rgba(139, 132, 78, 0.15)' : 'var(--bg-card)',
                    borderColor: stressLevel === 'moderate' ? 'var(--color-khaki)' : 'var(--color-muted)',
                  }}
                >
                  <TrendingUp className={`w-5 h-5 mx-auto mb-1`} style={{ 
                    color: stressLevel === 'moderate' ? 'var(--color-khaki)' : 'var(--color-muted)' 
                  }} />
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Fokuserad</div>
                </button>
                
                <button 
                  onClick={() => setStressLevel('stressed')}
                  className={`p-3 rounded-lg transition-all duration-300 border ${
                    stressLevel === 'stressed' 
                      ? 'border-2 shadow-md' 
                      : 'border hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: stressLevel === 'stressed' ? 'rgba(184, 134, 11, 0.15)' : 'var(--bg-card)',
                    borderColor: stressLevel === 'stressed' ? 'var(--color-warning)' : 'var(--color-muted)',
                  }}
                >
                  <AlertTriangle className={`w-5 h-5 mx-auto mb-1`} style={{ 
                    color: stressLevel === 'stressed' ? 'var(--color-warning)' : 'var(--color-muted)' 
                  }} />
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Kris</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zero-Learning Interface - Contextual Sections */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          
          {/* Professional Crisis Support Mode */}
          {stressLevel === 'stressed' && (
            <div className="mb-8 rounded-lg p-5 border shadow-md" style={{ 
              backgroundColor: 'rgba(139, 69, 19, 0.05)', 
              borderColor: 'var(--color-danger)' 
            }}>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-danger)' }}>Krisstöd aktiverat</h2>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Prioriterade åtgärder för nuvarande situation. Du har resurserna som behövs.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-colors" 
                        style={{ background: 'linear-gradient(135deg, var(--color-danger) 0%, #7A3D10 100%)' }}>
                  Andningsteknik (2 min)
                </button>
                <button className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-colors"
                        style={{ background: 'linear-gradient(135deg, var(--color-danger) 0%, #7A3D10 100%)' }}>
                  Kontakta nätverk
                </button>
                <button className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-colors"
                        style={{ background: 'linear-gradient(135deg, var(--color-danger) 0%, #7A3D10 100%)' }}>
                  Krischecklista
                </button>
              </div>
            </div>
          )}

          {/* Professional Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            
            {/* Preparedness Status Report */}
            <div className="group bg-white/95 rounded-lg p-5 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ 
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
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Beredskapsgrad</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Operationell Status</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Resurser: 14 dagar • Nätverk: Aktivt • Utbildning: Genomförd</p>
              <div className="flex space-x-2">
                <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'rgba(135, 169, 107, 0.2)' }}>
                  <div className="h-2 rounded-full" style={{ width: '92%', backgroundColor: 'var(--color-sage)' }}></div>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-sage)' }}>Optimal</span>
              </div>
            </div>

            {/* Network Intelligence */}
            <div className="group bg-white/95 rounded-lg p-5 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ 
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
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kontakter</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Nätverk</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Aktiva medlemmar • Resursdelning pågår • Kommunikation säker</p>
              <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--color-cool-olive)' }}>
                <MessageCircle className="w-3 h-3" />
                <span>3 meddelanden</span>
              </div>
            </div>

            {/* Cultivation Management */}
            <div className="group bg-white/95 rounded-lg p-5 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer lg:col-span-2 xl:col-span-1" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-khaki)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)' 
                }}>
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-lg" style={{ color: 'var(--color-khaki)' }}>🌱</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Aktiv</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Odlingsplan</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Tomater: Utvecklas • Kål: Mogen snart • Nästa: Morötter</p>
              <div className="text-xs font-semibold" style={{ color: 'var(--color-khaki)' }}>Skörd: 3 veckor</div>
            </div>
          </div>

          {/* Stress-Adaptive Layout - Simplified when stressed */}
          {stressLevel !== 'stressed' && (
            <>
              {/* Advanced Communication Hub - Enhanced & Resizable */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <div className="xl:col-span-1">
                  {user && <MessagingSystem user={user} communityId="demo-community-1" />}
                </div>
                <div className="xl:col-span-1">
                  <ExternalCommunication />
                </div>
              </div>

              {/* Resource Excellence */}
              {user && (
                <div className="mb-8">
                  <SupabaseResourceInventory user={user} />
                </div>
              )}

              {/* Community Psychology Integration */}
              {user && (
                <div className="mb-8">
                  <CommunityHub user={user} />
                </div>
              )}
            </>
          )}

          {/* Always Show - Core Preparedness (Crisis-Ready) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="order-2 lg:order-1">
              <StatusCard />
            </div>
            <div className="order-1 lg:order-2">
              <QuickActions />
            </div>
          </div>

          {/* Professional Status Update */}
          <div className="mt-8 rounded-lg p-4 border shadow-sm" style={{ 
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
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Daglig uppdatering slutförd</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Resurser uppdaterade • Nätverk utökat • Beredskap förbättrad</p>
              </div>
              <div className="text-lg" style={{ color: 'var(--color-primary)' }}>✓</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
