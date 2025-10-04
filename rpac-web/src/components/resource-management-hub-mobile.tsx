'use client';

import { useState, useEffect, useCallback } from 'react';
import { resourceService, Resource } from '@/lib/supabase';
import { useUserProfile } from '@/lib/useUserProfile';
import { t } from '@/lib/locales';
import { 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Wrench,
  Shield,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  Edit,
  Share2
} from 'lucide-react';
import { ResourceShareToCommunityModal } from './resource-share-to-community-modal';

interface ResourceManagementHubMobileProps {
  user: { id: string; email?: string };
}

const categoryConfig = {
  food: { 
    icon: Package, 
    emoji: '🍞', 
    label: 'Mat',
    color: '#FFC000'
  },
  water: { 
    icon: Droplets, 
    emoji: '💧', 
    label: 'Vatten',
    color: '#4A90E2'
  },
  medicine: { 
    icon: Heart, 
    emoji: '💊', 
    label: 'Medicin',
    color: '#8B4513'
  },
  energy: { 
    icon: Zap, 
    emoji: '⚡', 
    label: 'Energi',
    color: '#B8860B'
  },
  tools: { 
    icon: Wrench, 
    emoji: '🔧', 
    label: 'Verktyg',
    color: '#4A5239'
  },
  other: { 
    icon: Sparkles, 
    emoji: '✨', 
    label: 'Övrigt',
    color: '#707C5F'
  }
};

type CategoryKey = keyof typeof categoryConfig;

interface CategoryStats {
  total: number;
  filled: number;
  empty: number;
  expiringSoon: number;
  avgDaysRemaining: number;
  health: number;
}

export function ResourceManagementHubMobile({ user }: ResourceManagementHubMobileProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [showQuickAddSheet, setShowQuickAddSheet] = useState(false);
  const [showResourceDetail, setShowResourceDetail] = useState<Resource | null>(null);
  
  const { profile: userProfile } = useUserProfile(user as any);

  const loadResources = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('loadResources called - fetching from database...');
      const data = await resourceService.getResources(user.id);
      console.log('Fetched resources from DB:', data.length, 'total resources');
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Calculate category statistics
  const getCategoryStats = (category: CategoryKey): CategoryStats => {
    const categoryResources = resources.filter(r => r.category === category);
    const total = categoryResources.length;
    const filled = categoryResources.filter(r => r.is_filled).length;
    const empty = total - filled;
    const expiringSoon = categoryResources.filter(r => 
      r.is_filled && r.days_remaining < 30 && r.days_remaining < 99999
    ).length;
    
    const filledResources = categoryResources.filter(r => r.is_filled);
    const avgDaysRemaining = filledResources.length > 0
      ? filledResources.reduce((sum, r) => sum + (r.days_remaining >= 99999 ? 365 : r.days_remaining), 0) / filledResources.length
      : 0;
    
    const health = total > 0 ? Math.round((filled / total) * 100) : 0;
    
    return { total, filled, empty, expiringSoon, avgDaysRemaining, health };
  };

  // Calculate overall preparedness
  const getOverallPreparedness = () => {
    if (resources.length === 0) return { score: 0, days: 0, message: '' };
    
    const msbResources = resources.filter(r => r.is_msb_recommended);
    const filledMsb = msbResources.filter(r => r.is_filled).length;
    const score = msbResources.length > 0 
      ? Math.round((filledMsb / msbResources.length) * 100)
      : 0;
    
    const waterResources = resources.filter(r => r.category === 'water' && r.is_filled);
    const foodResources = resources.filter(r => r.category === 'food' && r.is_filled);
    const familySize = userProfile?.household_size || 1;
    
    const waterDays = waterResources.length > 0 
      ? waterResources.reduce((sum, r) => sum + r.quantity, 0) / (2 * familySize)
      : 0;
    const foodDays = foodResources.length > 0
      ? Math.min(...foodResources.map(r => r.days_remaining < 99999 ? r.days_remaining : 365))
      : 0;
    
    const days = Math.floor(Math.min(waterDays, foodDays));
    
    let message = '';
    if (score >= 80) message = 'Utmärkt';
    else if (score >= 60) message = 'Bra';
    else if (score >= 40) message = 'På rätt väg';
    else message = 'Behöver uppmärksamhet';
    
    return { score, days, message };
  };

  const preparedness = getOverallPreparedness();
  
  // Get gradient color based on score
  const getGradientColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#556B2F';
    if (health >= 50) return '#B8860B';
    if (health >= 25) return '#D97706';
    return '#8B4513';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dina resurser...</p>
        </div>
      </div>
    );
  }

  // If category selected, show category detail view
  if (selectedCategory) {
    const stats = getCategoryStats(selectedCategory);
    const config = categoryConfig[selectedCategory];
    const categoryResources = resources.filter(r => r.category === selectedCategory);

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Category Header */}
        <div 
          className="px-6 py-8 rounded-b-3xl shadow-2xl relative"
          style={{ 
            background: `linear-gradient(135deg, ${config.color}dd, ${config.color}99)` 
          }}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>

          <div className="text-center text-white mt-8">
            <div className="text-6xl mb-3">{config.emoji}</div>
            <h1 className="text-3xl font-bold mb-2">{config.label}</h1>
            <p className="text-white/90">
              {stats.filled} av {stats.total} ifyllda
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.health}%</div>
              <div className="text-xs text-white/80">Hälsa</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.empty}</div>
              <div className="text-xs text-white/80">Ej ifyllda</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.expiringSoon}</div>
              <div className="text-xs text-white/80">Utgår snart</div>
            </div>
          </div>
        </div>

        {/* Resources List */}
        <div className="px-6 py-6 space-y-3">
          {categoryResources.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">{config.emoji}</div>
              <p className="text-gray-600 mb-4">Inga {config.label.toLowerCase()}-resurser än</p>
              <button
                onClick={() => setShowQuickAddSheet(true)}
                className="px-6 py-3 bg-[#3D4A2B] text-white rounded-xl font-medium active:scale-95 transition-transform"
              >
                Lägg till första resursen
              </button>
            </div>
          ) : (
            categoryResources.map((resource) => (
              <button
                key={resource.id}
                onClick={() => {
                  console.log('Resource card clicked:', resource);
                  setShowResourceDetail(resource);
                }}
                className="w-full bg-white rounded-2xl p-5 shadow-md active:scale-98 transition-transform text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      {resource.name}
                      {resource.is_msb_recommended && (
                        <Shield size={14} className="text-[#556B2F]" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {resource.quantity} {resource.unit}
                    </p>
                  </div>
                  {resource.is_filled ? (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      Ej ifylld
                    </div>
                  )}
                </div>

                {resource.is_filled && resource.days_remaining < 30 && resource.days_remaining < 99999 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    <AlertTriangle size={14} />
                    <span>Utgår snart!</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Floating Add Button */}
        <button
          onClick={() => setShowQuickAddSheet(true)}
          className="fixed bottom-32 right-6 w-14 h-14 bg-[#3D4A2B] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-10"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Quick Add Bottom Sheet */}
        {showQuickAddSheet && (
          <QuickAddBottomSheet
            user={user}
            onClose={() => setShowQuickAddSheet(false)}
            onSuccess={loadResources}
            familySize={userProfile?.household_size || 1}
          />
        )}

        {/* Resource Detail Bottom Sheet */}
        {showResourceDetail && (
          <>
            {console.log('Rendering ResourceDetailSheet for:', showResourceDetail)}
            <ResourceDetailSheet
              resource={showResourceDetail}
              onClose={() => setShowResourceDetail(null)}
              onUpdate={loadResources}
              userId={user.id}
            />
          </>
        )}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Hero Header with Stats */}
      <div 
        className={`bg-gradient-to-br ${getGradientColor(preparedness.score)} text-white px-6 py-8 rounded-b-3xl shadow-2xl`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mina resurser</h1>
            <p className="text-white/80">Din beredskapsstatus</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold mb-1">{preparedness.score}%</div>
            <div className="text-xs text-white/80">Beredskap</div>
            <div className="text-xs font-medium mt-1">{preparedness.message}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold mb-1">{preparedness.days}</div>
            <div className="text-xs text-white/80">Dagar</div>
            <div className="text-xs font-medium mt-1">Självförsörjning</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold mb-1">{resources.filter(r => r.is_filled).length}</div>
            <div className="text-xs text-white/80">Ifyllda</div>
            <div className="text-xs font-medium mt-1">Resurser</div>
          </div>
        </div>
      </div>

      {/* MSB Status Banner */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-[#556B2F]/10 to-[#3D4A2B]/10 border border-[#556B2F]/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[#556B2F] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">MSB-rekommendationer</h3>
              <p className="text-sm text-gray-600">
                {resources.filter(r => r.is_msb_recommended && r.is_filled).length} av {resources.filter(r => r.is_msb_recommended).length} ifyllda
              </p>
            </div>
            <div className="text-2xl font-bold text-[#556B2F]">
              {Math.round((resources.filter(r => r.is_msb_recommended && r.is_filled).length / Math.max(1, resources.filter(r => r.is_msb_recommended).length)) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Category Health Cards */}
      <div className="px-6 py-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Kategorier</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(categoryConfig) as CategoryKey[]).map((category) => {
            const stats = getCategoryStats(category);
            const config = categoryConfig[category];
            const healthColor = getHealthColor(stats.health);

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="bg-white rounded-2xl p-5 shadow-md active:scale-98 transition-transform text-left"
              >
                {/* Emoji and Label */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-4xl">{config.emoji}</div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
                
                <h3 className="font-bold text-gray-900 mb-2">{config.label}</h3>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stats.health}%`,
                      backgroundColor: healthColor
                    }}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{stats.filled}/{stats.total} ifyllda</span>
                  <span className="font-bold" style={{ color: healthColor }}>
                    {stats.health}%
                  </span>
                </div>

                {/* Alerts */}
                {stats.expiringSoon > 0 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-2">
                    <AlertTriangle size={12} />
                    <span>{stats.expiringSoon} utgår snart</span>
                  </div>
                )}
                {stats.empty > 0 && stats.total > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2">
                    {stats.empty} ej ifyllda
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Snabbåtgärder</h2>
        <div className="space-y-3">
          <button
            onClick={() => setShowQuickAddSheet(true)}
            className="w-full bg-white rounded-2xl p-5 shadow-md active:scale-98 transition-transform text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
                <Plus size={24} className="text-[#3D4A2B]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Lägg till resurser</h3>
                <p className="text-sm text-gray-600">Snabblägg från mallar</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowQuickAddSheet(true)}
        className="fixed bottom-32 right-6 w-14 h-14 bg-[#3D4A2B] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Quick Add Bottom Sheet */}
      {showQuickAddSheet && (
        <QuickAddBottomSheet
          user={user}
          onClose={() => setShowQuickAddSheet(false)}
          onSuccess={loadResources}
          familySize={userProfile?.household_size || 1}
        />
      )}

      {/* Resource Detail Bottom Sheet */}
      {showResourceDetail && (
        <>
          {console.log('Rendering ResourceDetailSheet for:', showResourceDetail)}
          <ResourceDetailSheet
            resource={showResourceDetail}
            onClose={() => setShowResourceDetail(null)}
            onUpdate={loadResources}
            userId={user.id}
          />
        </>
      )}
    </div>
  );
}

// Quick Add Bottom Sheet Component
function QuickAddBottomSheet({ 
  user, 
  onClose, 
  onSuccess,
  familySize 
}: { 
  user: { id: string }; 
  onClose: () => void; 
  onSuccess: () => void;
  familySize: number;
}) {
  const [activeTab, setActiveTab] = useState<'kits' | 'category' | 'custom'>('kits');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('food');
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'food' as CategoryKey,
    quantity: 1,
    unit: 'st',
    days_remaining: 365
  });

  // Quick kit templates matching desktop modal
  const quickKitTemplates: { [key: string]: { category: CategoryKey; items: any[] } } = {
    'msb-starter': {
      category: 'food',
      items: [
        { name: 'Dricksvatten', quantity: 6, unit: 'liter', days_remaining: 365 },
        { name: 'Energirika konserver', quantity: 6, unit: 'burkar', days_remaining: 1095 },
        { name: 'Knäckebröd', quantity: 1, unit: 'paket', days_remaining: 730 },
        { name: 'Socker och salt', quantity: 1, unit: 'paket', days_remaining: 365 },
        { name: 'Multivitamin', quantity: 1, unit: 'burk', days_remaining: 730 },
      ]
    },
    '1-week-emergency': {
      category: 'food',
      items: [
        { name: 'Dricksvatten', quantity: 14, unit: 'liter', days_remaining: 365 },
        { name: 'Konserver (bönor, soppa, grönsaker)', quantity: 10, unit: 'burkar', days_remaining: 1095 },
        { name: 'Knäckebröd eller hårt bröd', quantity: 2, unit: 'paket', days_remaining: 730 },
        { name: 'Kött- eller fiskkonserver', quantity: 5, unit: 'burkar', days_remaining: 1095 },
        { name: 'Nötskal eller energibars', quantity: 5, unit: 'st', days_remaining: 180 },
        { name: 'Torrfrukt', quantity: 1, unit: 'kg', days_remaining: 365 },
      ]
    },
    'first-aid': {
      category: 'medicine',
      items: [
        { name: 'Första hjälpen-kit', quantity: 1, unit: 'kit', days_remaining: 1095 },
        { name: 'Smärtstillande (Alvedon/Ipren)', quantity: 2, unit: 'förpackningar', days_remaining: 730 },
        { name: 'Termometer', quantity: 1, unit: 'stycken', days_remaining: 1825 },
        { name: 'Plåster och bandage', quantity: 1, unit: 'förpackning', days_remaining: 1095 },
        { name: 'Desinfektionsmedel', quantity: 1, unit: 'flaska', days_remaining: 730 },
        { name: 'Receptbelagda mediciner', quantity: 1, unit: 'månadsförbrukning', days_remaining: 30 },
        { name: 'Allergimedicin', quantity: 1, unit: 'förpackning', days_remaining: 730 },
      ]
    },
    'energy-kit': {
      category: 'energy',
      items: [
        { name: 'AA-batterier', quantity: 3, unit: 'förpackningar', days_remaining: 1095 },
        { name: 'AAA-batterier', quantity: 2, unit: 'förpackningar', days_remaining: 1095 },
        { name: 'Ficklampor', quantity: 2, unit: 'stycken', days_remaining: 1825 },
        { name: 'Batteridriven radio', quantity: 1, unit: 'stycken', days_remaining: 1825 },
        { name: 'Powerbank', quantity: 1, unit: 'stycken', days_remaining: 1095 },
        { name: 'Ljus', quantity: 10, unit: 'stycken', days_remaining: 99999 },
        { name: 'Tändstickor', quantity: 3, unit: 'askar', days_remaining: 99999 },
        { name: 'Gasol/spritkök', quantity: 1, unit: 'styck', days_remaining: 99999 },
      ]
    }
  };

  const quickKits = [
    {
      id: 'msb-starter',
      name: 'MSB 72h kit',
      emoji: '🛡️',
      items: 5,
      description: 'Grundkit för 3 dagar'
    },
    {
      id: '1-week-emergency',
      name: '1 vecka',
      emoji: '📦',
      items: 6,
      description: 'En veckas självförsörjning'
    },
    {
      id: 'first-aid',
      name: 'Första hjälpen',
      emoji: '💊',
      items: 7,
      description: 'Medicinsk grundutrustning'
    },
    {
      id: 'energy-kit',
      name: 'Energi & ljus',
      emoji: '⚡',
      items: 8,
      description: 'Batterier och belysning'
    }
  ];

  // Category quick-add items
  const categoryQuickAdds: { [key in CategoryKey]: any[] } = {
    food: [
      { name: 'Konserver (bönor, soppa)', quantity: 5, unit: 'burkar', days_remaining: 1095 },
      { name: 'Ris', quantity: 2, unit: 'kg', days_remaining: 730 },
      { name: 'Pasta', quantity: 2, unit: 'kg', days_remaining: 730 },
      { name: 'Knäckebröd', quantity: 2, unit: 'paket', days_remaining: 730 },
    ],
    water: [
      { name: 'Vattenflaskor 1.5L', quantity: 6, unit: 'flaskor', days_remaining: 365 },
      { name: 'Vattenreningstavletter', quantity: 1, unit: 'förpackning', days_remaining: 1095 },
      { name: 'Vattenbehållare 10L', quantity: 1, unit: 'styck', days_remaining: 99999 },
    ],
    medicine: [
      { name: 'Första hjälpen-kit', quantity: 1, unit: 'kit', days_remaining: 1095 },
      { name: 'Smärtstillande (Alvedon)', quantity: 1, unit: 'förpackning', days_remaining: 730 },
      { name: 'Plåster och bandage', quantity: 1, unit: 'förpackning', days_remaining: 1095 },
    ],
    energy: [
      { name: 'AA-batterier', quantity: 2, unit: 'förpackningar', days_remaining: 1095 },
      { name: 'Ficklampa LED', quantity: 2, unit: 'stycken', days_remaining: 1825 },
      { name: 'Ljus', quantity: 10, unit: 'stycken', days_remaining: 99999 },
    ],
    tools: [
      { name: 'Multiverktyg/schweizisk kniv', quantity: 1, unit: 'styck', days_remaining: 99999 },
      { name: 'Rep 10m', quantity: 1, unit: 'rulle', days_remaining: 99999 },
      { name: 'Silvertejp', quantity: 1, unit: 'rulle', days_remaining: 99999 },
    ],
    other: [
      { name: 'Kontanter 1000-2000 kr', quantity: 1, unit: 'summa', days_remaining: 99999 },
      { name: 'Toalettpapper', quantity: 4, unit: 'rullar', days_remaining: 99999 },
      { name: 'Tvål', quantity: 2, unit: 'stycken', days_remaining: 365 },
    ]
  };

  const handleAddKit = async (kitId: string) => {
    const template = quickKitTemplates[kitId];
    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      // Add all items from the template
      for (const item of template.items) {
        await resourceService.addResource({
          user_id: user.id,
          name: item.name,
          category: template.category,
          quantity: item.quantity * familySize,
          unit: item.unit,
          days_remaining: item.days_remaining,
          is_msb_recommended: false,
          is_filled: true
        });
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding kit:', err);
      setError('Kunde inte lägga till resurser. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategoryItem = async (item: any) => {
    setLoading(true);
    setError(null);

    try {
      await resourceService.addResource({
        user_id: user.id,
        name: item.name,
        category: selectedCategory,
        quantity: item.quantity * familySize,
        unit: item.unit,
        days_remaining: item.days_remaining,
        is_msb_recommended: false,
        is_filled: true
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Kunde inte lägga till resurs. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double-submit
    
    if (!customForm.name.trim()) {
      setError('Namn krävs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Adding custom resource:', customForm.name);
      await resourceService.addResource({
        user_id: user.id,
        name: customForm.name,
        category: customForm.category,
        quantity: customForm.quantity, // Don't scale custom resources - user enters exact amount
        unit: customForm.unit,
        days_remaining: customForm.days_remaining,
        is_msb_recommended: false,
        is_filled: true
      });
      console.log('Resource added successfully');
      
      // Reset form
      setCustomForm({
        name: '',
        category: 'food',
        quantity: 1,
        unit: 'st',
        days_remaining: 365
      });
      
      console.log('Calling onSuccess()');
      onSuccess();
      console.log('Calling onClose()');
      onClose();
    } catch (err) {
      console.error('Error adding custom resource:', err);
      setError('Kunde inte lägga till resurs. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl flex flex-col"
        style={{ height: '90vh', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Lägg till resurser</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('kits')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'kits'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Färdiga kit
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'category'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Per kategori
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'custom'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Egen resurs
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-scroll p-6 pb-24" style={{ 
          WebkitOverflowScrolling: 'touch',
          minHeight: 0
        }}>
          {familySize > 1 && activeTab !== 'custom' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
              💡 Kvantiteter skalas automatiskt för {familySize} personer
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">
              {error}
            </div>
          )}

          {activeTab === 'kits' && (
            <div className="space-y-3">
              {quickKits.map((kit) => (
                <button
                  key={kit.id}
                  onClick={() => handleAddKit(kit.id)}
                  disabled={loading}
                  className="w-full bg-gray-50 rounded-2xl p-5 active:scale-98 transition-transform text-left border-2 border-gray-200 active:border-[#3D4A2B]"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{kit.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{kit.name}</h3>
                      <p className="text-sm text-gray-600">{kit.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{kit.items} resurser</p>
                    </div>
                    <Plus size={24} className="text-[#3D4A2B]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'category' && (
            <div>
              {/* Category selector */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {(Object.keys(categoryConfig) as CategoryKey[]).map((cat) => {
                  const config = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
                        selectedCategory === cat
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="text-3xl mb-1 text-center">{config.emoji}</div>
                      <div className={`text-xs font-medium text-center ${
                        selectedCategory === cat ? 'text-[#3D4A2B]' : 'text-gray-700'
                      }`}>
                        {config.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Category items list */}
              <div className="space-y-2">
                {categoryQuickAdds[selectedCategory].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddCategoryItem(item)}
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 active:scale-98 transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity * familySize} {item.unit}
                          {item.days_remaining >= 99999 ? ' • Obegränsad hållbarhet' : ` • ${item.days_remaining} dagar`}
                        </div>
                      </div>
                      <Plus size={20} strokeWidth={2.5} className="text-[#3D4A2B] flex-shrink-0 ml-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Tab */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCustomAdd} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resursnamn *
                </label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="T.ex. Havregryn, Tändstickor..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(categoryConfig) as CategoryKey[]).map((cat) => {
                    const config = categoryConfig[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCustomForm({ ...customForm, category: cat })}
                        className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
                          customForm.category === cat
                            ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="text-2xl mb-1 text-center">{config.emoji}</div>
                        <div className={`text-xs font-medium text-center ${
                          customForm.category === cat ? 'text-[#3D4A2B]' : 'text-gray-700'
                        }`}>
                          {config.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Antal
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customForm.quantity}
                    onChange={(e) => setCustomForm({ ...customForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enhet
                  </label>
                  <input
                    type="text"
                    value={customForm.unit}
                    onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}
                    placeholder="st, kg, liter..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hållbarhet (dagar)
                </label>
                <input
                  type="number"
                  min="1"
                  value={customForm.days_remaining === 0 ? '' : customForm.days_remaining}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomForm({ ...customForm, days_remaining: val === '' ? 0 : parseInt(val) });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  T.ex. 365 = 1 år, 730 = 2 år, 99999 = obegränsad
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !customForm.name.trim()}
                className="w-full py-4 px-6 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Lägger till...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Lägg till resurs
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Resource Detail Bottom Sheet
function ResourceDetailSheet({ 
  resource, 
  onClose, 
  onUpdate,
  userId
}: { 
  resource: Resource; 
  onClose: () => void;
  onUpdate: () => void;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: resource.name,
    quantity: resource.quantity,
    unit: resource.unit,
    days_remaining: resource.days_remaining,
    is_filled: resource.is_filled
  });

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill ta bort denna resurs?')) return;
    
    setLoading(true);
    try {
      await resourceService.deleteResource(resource.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Kunde inte ta bort resursen');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resourceService.updateResource(resource.id, editForm);
      onUpdate();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Kunde inte uppdatera resursen');
    } finally {
      setLoading(false);
    }
  };

  const config = categoryConfig[resource.category as CategoryKey];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end"
      onClick={onClose}
    >
      <div 
        className="w-full bg-white rounded-t-3xl flex flex-col"
        style={{ height: '85vh', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white px-6 py-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <div className="text-5xl mb-3">{config.emoji}</div>
            <h2 className="text-2xl font-bold mb-1">{resource.name}</h2>
            <p className="text-white/80">{config.label}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-scroll p-6 space-y-6" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resursnamn
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Antal
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enhet
                  </label>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hållbarhet (dagar)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.days_remaining === 0 ? '' : editForm.days_remaining}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditForm({ ...editForm, days_remaining: val === '' ? 0 : parseInt(val) });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Skriv 99999 för obegränsad hållbarhet
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_filled}
                    onChange={(e) => setEditForm({ ...editForm, is_filled: e.target.checked })}
                    className="w-5 h-5 text-[#3D4A2B] rounded focus:ring-[#3D4A2B]"
                  />
                  <span className="font-semibold text-gray-700">Resursen är ifylld</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold active:scale-98 transition-transform disabled:opacity-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#3D4A2B] text-white py-3 rounded-xl font-bold active:scale-98 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Sparar...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Spara ändringar
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Main Info */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Antal</div>
              <div className="text-2xl font-bold text-gray-900">
                {resource.quantity} {resource.unit}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-1">Hållbarhet</div>
              <div className="text-2xl font-bold text-gray-900">
                {resource.days_remaining >= 99999 ? 'Obegränsad' : `${resource.days_remaining} dagar`}
              </div>
            </div>

            {resource.is_filled && resource.days_remaining < 30 && resource.days_remaining < 99999 && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-4 py-3 rounded-xl">
                <AlertTriangle size={18} />
                <span>Denna resurs utgår snart!</span>
              </div>
            )}
          </div>

          {/* MSB Badge */}
          {resource.is_msb_recommended && (
            <div className="flex items-center gap-3 bg-[#556B2F]/10 border border-[#556B2F]/20 rounded-xl p-4">
              <Shield size={24} className="text-[#556B2F]" />
              <div>
                <div className="font-bold text-gray-900">MSB-rekommenderad</div>
                <div className="text-sm text-gray-600">Denna resurs ingår i MSB:s officiella rekommendationer</div>
              </div>
            </div>
          )}

              {/* Status */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="text-sm text-gray-600 mb-2">Status</div>
                {resource.is_filled ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={20} />
                    <span className="font-bold">Ifylld</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={20} />
                    <span className="font-bold">Ej ifylld</span>
                  </div>
                )}
              </div>

              {/* Actions (inside view mode) */}
              <div className="space-y-3 mt-8 pt-6 pb-8 border-t-2 border-gray-200">
                <div className="text-center text-xs text-gray-500 mb-4">
                  Hantera resurs
                </div>
                
                {/* Share Button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold active:scale-98 transition-transform flex items-center justify-center gap-2 shadow-lg"
                  style={{ minHeight: '56px' }}
                >
                  <Share2 size={20} />
                  <span>Dela till samhälle</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    console.log('Edit clicked');
                    setIsEditing(true);
                  }}
                  className="w-full bg-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold active:scale-98 transition-transform flex items-center justify-center gap-2 shadow-lg"
                  style={{ minHeight: '56px' }}
                >
                  <Edit2 size={20} />
                  <span>Redigera resurs</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    console.log('Delete clicked');
                    handleDelete();
                  }}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-4 px-6 rounded-xl font-bold active:scale-98 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                  style={{ minHeight: '56px' }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Tar bort...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={20} />
                      <span>Ta bort resurs</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ResourceShareToCommunityModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resource={resource}
        userId={userId}
        onSuccess={() => {
          setShowShareModal(false);
          onUpdate();
        }}
      />
    </div>
  );
}

