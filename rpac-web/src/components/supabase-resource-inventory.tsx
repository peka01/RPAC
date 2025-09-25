'use client';

import { useState, useEffect } from 'react';
import { resourceService, Resource } from '@/lib/supabase';
import { useUserProfile } from '@/lib/useUserProfile';
import { t } from '@/lib/locales';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Wrench,
  Shield,
  Sparkles,
  CheckCircle,
  Calendar,
  TrendingUp,
  Sun,
  Leaf
} from 'lucide-react';

interface SupabaseResourceInventoryProps {
  user: { id: string; email?: string; user_metadata?: { name?: string } };
}

const categoryIcons = {
  food: Package,
  water: Droplets,
  medicine: Heart,
  energy: Zap,
  tools: Wrench,
  other: Sparkles
};

const categoryLabels = {
  food: 'Mat',
  water: 'Vatten',
  medicine: 'Medicin',
  energy: 'Energi',
  tools: 'Verktyg',
  other: 'Övrigt'
};

// MSB recommended emergency supplies based on "Om krisen eller kriget kommer"
const msbRecommendations = {
  food: [
    { name: 'Konserver och burkar', quantity: '3 dagar per person', priority: 'high' },
    { name: 'Knäckebröd eller hårt bröd', quantity: '1 paket', priority: 'high' },
    { name: 'Frukt och nötter', quantity: '500g', priority: 'medium' },
    { name: 'Kött- eller fiskkonserver', quantity: '3-4 burkar', priority: 'high' }
  ],
  water: [
    { name: 'Dricksvatten', quantity: '3 liter per person och dag', priority: 'high' },
    { name: 'Vattenreningstavletter', quantity: '1 förpackning', priority: 'medium' },
    { name: 'Extra vattenbehållare', quantity: '2-3 stycken', priority: 'medium' }
  ],
  medicine: [
    { name: 'Receptbelagda mediciner', quantity: '1 veckas förbrukning', priority: 'high' },
    { name: 'Smärtstillande', quantity: '1 förpackning', priority: 'medium' },
    { name: 'Första hjälpen-kit', quantity: '1 komplett kit', priority: 'high' },
    { name: 'Termometer', quantity: '1 styck', priority: 'medium' }
  ],
  energy: [
    { name: 'Batterier (olika storlekar)', quantity: 'Flera förpackningar', priority: 'high' },
    { name: 'Ficklampor', quantity: '2-3 stycken', priority: 'high' },
    { name: 'Batteridriven radio', quantity: '1 styck', priority: 'high' },
    { name: 'Ljus och tändstickor', quantity: 'Flera förpackningar', priority: 'medium' }
  ],
  tools: [
    { name: 'Multiverktyg eller kniv', quantity: '1 styck', priority: 'medium' }
  ],
  other: [
    { name: 'Kontanter', quantity: 'Mindre mängder', priority: 'high' },
    { name: 'Varma filtar', quantity: '1 per person', priority: 'high' }
  ]
};

export function SupabaseResourceInventory({ user }: SupabaseResourceInventoryProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get user profile for family size
  const { profile: userProfile } = useUserProfile(user as any);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'food' as Resource['category'],
    quantity: 1,
    unit: '',
    days_remaining: 30
  });

  useEffect(() => {
    if (user?.id) {
      loadResources();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadResources = async () => {
    try {
      setLoading(true);
      
      // Use demo mode for all users for now (Supabase has columns= bug)
      if (true || user.id === 'demo-user') {
        // Load demo data from localStorage
        const demoResources = localStorage.getItem('rpac-demo-resources');
        if (demoResources) {
          const existingResources = JSON.parse(demoResources);
          
          // Check if MSB resources exist, if not, add them
          const hasMsbResources = existingResources.some((r: any) => r.is_msb_recommended);
          
          if (!hasMsbResources) {
            // Add MSB resources to existing user resources
            const msbResources = createMsbResources();
            const combinedResources = [...msbResources, ...existingResources];
            setResources(combinedResources);
            localStorage.setItem('rpac-demo-resources', JSON.stringify(combinedResources));
          } else {
            setResources(existingResources);
          }
        } else {
          const demoData = createMsbResources();
          setResources(demoData);
          localStorage.setItem('rpac-demo-resources', JSON.stringify(demoData));
        }
      } else {
        // Note: Supabase integration temporarily disabled due to columns= bug
        
        const data = await resourceService.getResources(user.id);
        setResources(data);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('resources.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const createMsbResources = () => {
    // Create MSB recommended resources + some demo filled ones
    const msbRecommendedResources = [
            // MSB Food recommendations
            { name: 'Konserver och burkar', category: 'food', unit: 'burkar', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Knäckebröd eller hårt bröd', category: 'food', unit: 'paket', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Kött- eller fiskkonserver', category: 'food', unit: 'burkar', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Frukt och nötter', category: 'food', unit: 'kg', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            
            // MSB Water recommendations  
            { name: 'Dricksvatten', category: 'water', unit: 'liter', msb_priority: 'high', is_msb_recommended: true, quantity: 14, days_remaining: 7, is_filled: true }, // Demo: 1 week supply for 1 person (2L per day)
            { name: 'Vattenreningstavletter', category: 'water', unit: 'förpackningar', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Extra vattenbehållare', category: 'water', unit: 'stycken', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            
            // MSB Medicine recommendations
            { name: 'Receptbelagda mediciner', category: 'medicine', unit: 'dagars förbrukning', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Första hjälpen-kit', category: 'medicine', unit: 'kit', msb_priority: 'high', is_msb_recommended: true, quantity: 1, days_remaining: 365, is_filled: true }, // Demo: filled
            { name: 'Smärtstillande', category: 'medicine', unit: 'förpackningar', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Termometer', category: 'medicine', unit: 'stycken', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            
            // MSB Energy recommendations
            { name: 'Batterier (olika storlekar)', category: 'energy', unit: 'förpackningar', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Ficklampor', category: 'energy', unit: 'stycken', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Batteridriven radio', category: 'energy', unit: 'stycken', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Ljus och tändstickor', category: 'energy', unit: 'förpackningar', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            
            // MSB Tools recommendations
            { name: 'Multiverktyg eller kniv', category: 'tools', unit: 'styck', msb_priority: 'medium', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            
            // MSB Other recommendations
            { name: 'Kontanter', category: 'other', unit: 'mindre mängder', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            { name: 'Varma filtar', category: 'other', unit: 'stycken', msb_priority: 'high', is_msb_recommended: true, quantity: 0, days_remaining: 0, is_filled: false },
            
            // User added example
            { name: 'Extra ris och pasta', category: 'food', unit: 'kg', is_msb_recommended: false, quantity: 5, days_remaining: 90, is_filled: true }
          ];

    return msbRecommendedResources.map((item, index) => ({
      id: `msb-${index + 1}`,
      user_id: user.id,
      name: item.name,
      category: item.category as Resource['category'],
      quantity: item.quantity,
      unit: item.unit,
      days_remaining: item.days_remaining,
      is_msb_recommended: item.is_msb_recommended,
      msb_priority: item.msb_priority as 'high' | 'medium' | 'low' | undefined,
      is_filled: item.is_filled,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  };

  // Function to calculate automatic shelf life based on resource type and name
  const calculateShelfLife = (name: string, category: string): number => {
    const lowerName = name.toLowerCase();
    
    // Water - typically 6 months to 2 years depending on storage
    if (category === 'water') {
      if (lowerName.includes('rening') || lowerName.includes('tablett')) return 1095; // 3 years
      return 365; // 1 year for stored water
    }
    
    // Food - varies greatly by type
    if (category === 'food') {
      // Canned goods - 2-5 years
      if (lowerName.includes('konserv') || lowerName.includes('burk') || lowerName.includes('burkar')) return 1095; // 3 years
      // Dry goods - 1-2 years
      if (lowerName.includes('knäckebröd') || lowerName.includes('bröd') || lowerName.includes('pasta') || lowerName.includes('ris')) return 730; // 2 years
      // Nuts and dried fruits - 1 year
      if (lowerName.includes('nötter') || lowerName.includes('frukt') || lowerName.includes('torkad')) return 365; // 1 year
      // Default for food
      return 365; // 1 year
    }
    
    // Medicine - check expiration dates, typically 1-3 years
    if (category === 'medicine') {
      if (lowerName.includes('första hjälpen') || lowerName.includes('kit')) return 1095; // 3 years
      if (lowerName.includes('smärtstillande') || lowerName.includes('tablett')) return 730; // 2 years
      return 365; // 1 year default
    }
    
    // Energy - batteries and electronics
    if (category === 'energy') {
      if (lowerName.includes('batteri')) return 1095; // 3 years (batteries degrade)
      if (lowerName.includes('radio') || lowerName.includes('ficklampa')) return 1825; // 5 years (electronics can fail)
      if (lowerName.includes('ljus') || lowerName.includes('tändstickor')) return 99999; // Essentially unlimited
      return 1095; // 3 years default
    }
    
    // Tools - many have unlimited shelf life
    if (category === 'tools') {
      if (lowerName.includes('verktyg') || lowerName.includes('kniv') || lowerName.includes('multiverktyg')) return 99999; // Essentially unlimited
      return 99999; // Essentially unlimited default for tools
    }
    
    // Other category - special items
    if (category === 'other') {
      if (lowerName.includes('kontanter') || lowerName.includes('cash')) return 99999; // Essentially unlimited
      if (lowerName.includes('filtar') || lowerName.includes('filt')) return 99999; // Essentially unlimited (blankets last forever)
      return 99999; // Essentially unlimited default for other
    }
    
    return 365; // Default 1 year
  };

  // Function to get urgency color based on days remaining
  const getUrgencyColor = (daysRemaining: number, isMsbRecommended?: boolean, isFilled?: boolean): string => {
    if (!isFilled) return 'bg-gray-100 text-gray-500'; // Empty MSB resources
    
    if (daysRemaining >= 99999) return 'bg-green-100 text-green-800'; // Unlimited shelf life
    if (daysRemaining > 365) return 'bg-green-100 text-green-800'; // More than 1 year
    if (daysRemaining > 30) return 'bg-yellow-100 text-yellow-800'; // 1 month to 1 year
    if (daysRemaining > 7) return 'bg-orange-100 text-orange-800'; // 1 week to 1 month
    return 'bg-red-100 text-red-800'; // Less than 1 week
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Calculate automatic shelf life
      const automaticShelfLife = calculateShelfLife(formData.name, formData.category);
      
      if (true || user.id === 'demo-user') {
        // Handle demo mode
        const newResource = {
          id: `demo-${Date.now()}`,
          user_id: user.id,
          ...formData,
          days_remaining: automaticShelfLife, // Use calculated shelf life
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (editingResource) {
          const updatedResources = resources.map(r => 
            r.id === editingResource.id ? { ...r, ...formData, days_remaining: automaticShelfLife, updated_at: new Date().toISOString() } : r
          );
          setResources(updatedResources);
          localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
          setEditingResource(null);
        } else {
          const updatedResources = [...resources, newResource];
          setResources(updatedResources);
          localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
        }
      } else {
        // Handle real Supabase mode
        if (editingResource?.id) {
          await resourceService.updateResource(editingResource!.id, formData);
          setEditingResource(null);
        } else {
          // Note: Supabase addResource disabled due to columns= bug
          const resourceData = {
            user_id: user.id,
            ...formData
          };
          await resourceService.addResource(resourceData);
        }
        loadResources();
      }

      setFormData({
        name: '',
        category: 'food',
        quantity: 1,
        unit: '',
        days_remaining: 0 // Will be calculated automatically
      });
      setShowAddForm(false);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('resources.error_occurred'));
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData({
      name: resource.name,
      category: resource.category,
      quantity: resource.quantity,
      unit: resource.unit,
      days_remaining: 0 // Will be calculated automatically
    });
    setEditingResource(resource);
    setShowAddForm(true);
  };

  const handleQuickFill = async (resource: Resource) => {
    try {
      setError(null);
      
      // Get family size from user profile (default to 1 if not available)
      const familySize = userProfile?.family_size || 1;
      
      // Calculate automatic shelf life for this resource
      const automaticShelfLife = calculateShelfLife(resource.name, resource.category);
      
      // Quick fill with default values for MSB recommendations (1 week supply per person)
      // Only scale consumable items with family size, not tools/equipment
      const isConsumable = resource.category === 'water' || resource.category === 'food' || 
                          (resource.category === 'medicine' && !resource.name.toLowerCase().includes('kit') && !resource.name.toLowerCase().includes('termometer'));
      
      const defaultValues = {
        quantity: resource.category === 'water' ? 14 * familySize : // 2L x 7 days per person
                  resource.category === 'food' ? 7 * familySize : // 1 week supply per person
                  resource.category === 'medicine' && isConsumable ? 7 * familySize : // 1 week supply per person for consumable medicine
                  resource.category === 'energy' ? Math.max(2, familySize) : // At least 2, scale with family
                  resource.category === 'tools' ? 1 : // Tools are typically 1 per family
                  resource.category === 'medicine' ? 1 : // Medical equipment is typically 1 per family
                  resource.category === 'other' && resource.name.toLowerCase().includes('filtar') ? familySize : // Blankets scale with family
                  resource.category === 'other' ? 1 : // Other items (like cash) are typically 1 per family
                  1, // Default to 1 for non-consumables
        days_remaining: automaticShelfLife, // Use calculated shelf life
        is_filled: true,
        updated_at: new Date().toISOString()
      };
      
      // Handle demo mode
      const updatedResources = resources.map(r => 
        r.id === resource.id ? { ...r, ...defaultValues } : r
      );
      setResources(updatedResources);
      localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
    } catch (err) {
      console.error('Error quick filling resource:', err);
      setError(t('resources.error_occurred'));
    }
  };

  const handleDelete = async (id: string, isMsbRecommended?: boolean) => {
    try {
      if (isMsbRecommended) {
        // For MSB resources, mark as empty instead of deleting
        const updatedResources = resources.map(r => 
          r.id === id ? { 
            ...r, 
            quantity: 0, 
            days_remaining: 0, 
            is_filled: false,
            updated_at: new Date().toISOString() 
          } : r
        );
        setResources(updatedResources);
        localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
      } else if (confirm(t('resources.confirm_delete'))) {
        // For user resources, delete completely
        if (true || user.id === 'demo-user') {
          const updatedResources = resources.filter(r => r.id !== id);
        setResources(updatedResources);
        localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
      } else {
        await resourceService.deleteResource(id);
        loadResources();
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('resources.error_occurred'));
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getResourceHealthScore = () => {
    if (resources.length === 0) return 0;
    const totalDays = resources.reduce((sum, resource) => sum + resource.days_remaining, 0);
    const avgDays = totalDays / resources.length;
    return Math.min(100, Math.round((avgDays / 30) * 100));
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'water': return '💧';
      case 'medicine': return '💊';
      case 'energy': return '⚡';
      case 'tools': return '🔧';
      case 'other': return '✨';
      default: return '📦';
    }
  };

  const getConfidenceMessage = () => {
    const healthScore = getResourceHealthScore();
    if (healthScore >= 80) return t('preparedness.health_messages.excellent');
    if (healthScore >= 60) return t('preparedness.health_messages.very_good');
    if (healthScore >= 40) return t('preparedness.health_messages.good');
    if (healthScore >= 20) return t('preparedness.health_messages.fair');
    return t('preparedness.health_messages.poor');
  };

  const resourceHealthScore = getResourceHealthScore();

  return (
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-khaki)'
    }}>
      {/* Professional Background Patterns */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.02]">
        <div className="w-full h-full rounded-full" style={{ background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' }}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-20 h-20 opacity-[0.02]">
        <div className="w-full h-full rounded-full animate-pulse" style={{ 
          background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)',
          animationDelay: '2s' 
        }}></div>
      </div>

      {/* Resource Intelligence Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)' 
            }}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            {/* Resource Status Indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse" style={{
              backgroundColor: resourceHealthScore > 70 ? 'var(--color-sage)' : 
                              resourceHealthScore > 40 ? 'var(--color-warning)' : 'var(--color-danger)'
            }}>
              <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-50"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('resources.storage_title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{
              resources.length
            } {t('resources.registered_units')}</p>
          </div>
        </div>
        
        {/* Resource Readiness Metrics */}
        <div className="text-center px-4 py-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-2xl font-bold" style={{
            color: resourceHealthScore > 70 ? 'var(--color-sage)' : 
                   resourceHealthScore > 40 ? 'var(--color-warning)' : 'var(--color-danger)'
          }}>
            {resourceHealthScore}%
          </div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>BEREDSKAP</div>
        </div>
      </div>

      {/* Professional Resource Addition */}
      <button
        onClick={() => {
          setShowAddForm(true);
          setEditingResource(null);
          setFormData({
            name: '',
            category: 'food',
            quantity: 1,
            unit: '',
            days_remaining: 30
          });
        }}
        className="group w-full mb-6 text-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-bold text-base">{t('buttons.register_resource')}</div>
          </div>
        </div>
      </button>

      {/* MSB Info Header */}
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" style={{ color: 'var(--color-sage)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('msb.emergency_supplies')}
            </h3>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('rpac-demo-resources');
              loadResources();
            }}
            className="text-xs px-3 py-1 rounded border transition-colors hover:bg-white/20"
            style={{ 
              borderColor: 'var(--color-sage)',
              color: 'var(--color-sage)'
            }}
          >
            🔄 {t('resources.load_msb_resources')}
          </button>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('msb.basic_supplies.description')} {t('resources.msb_supplies_description')}
        </p>
        {userProfile?.family_size && userProfile.family_size > 1 && (
          <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ 
            backgroundColor: 'var(--color-sage)10',
            color: 'var(--color-sage)',
            border: '1px solid var(--color-sage)30'
          }}>
            💡 {t('resources.family_scaling_note').replace('{familySize}', userProfile.family_size.toString())}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingResource ? t('resources.edit_resource') : t('resources.add_new_resource')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Namn
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="t.ex. Konserverad mat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Resource['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Antal
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Enhet
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="t.ex. burkar, liter, kg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('resources.days_remaining')} (automatisk)
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" style={{ color: 'var(--text-secondary)' }}>
                  {formData.name && formData.category ? 
                    (calculateShelfLife(formData.name, formData.category) >= 99999 ? 
                      'Obegränsad hållbarhet' : 
                      `${calculateShelfLife(formData.name, formData.category)} dagar`
                    ) : 
                    'Välj namn och kategori för att se hållbarhet'
                  }
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Hållbarhet beräknas automatiskt baserat på resurstyp
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingResource ? t('buttons.update') : t('buttons.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingResource(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources Table */}
      <div className="space-y-6">
        {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
          const categoryResources = resources.filter(r => r.category === categoryKey);
          if (categoryResources.length === 0) return null;
          
          const IconComponent = categoryIcons[categoryKey as keyof typeof categoryIcons];
          
          return (
            <div key={categoryKey} className="backdrop-blur-sm rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-white)' }}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-crisis-grey)' }}>
                <IconComponent size={24} style={{ color: 'var(--color-sage)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {categoryLabel}
                </h3>
                <span className="text-sm px-2 py-1 rounded-full" style={{ 
                  backgroundColor: 'var(--color-sage)20',
                  color: 'var(--color-sage)'
                }}>
                  {categoryResources.length} {categoryResources.length === 1 ? t('resources.resource_count.single') : t('resources.resource_count.multiple')}
                </span>
              </div>

              {/* Resources Table - Responsive */}
              <div className="w-full">
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-crisis-grey)' }}>
                      <th className="text-left py-2 px-2 font-medium text-sm w-1/3" style={{ color: 'var(--text-secondary)' }}>
                        {t('resources.table_headers.name')}
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-sm w-1/6" style={{ color: 'var(--text-secondary)' }}>
                        {t('resources.table_headers.quantity')}
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-sm w-1/6" style={{ color: 'var(--text-secondary)' }}>
                        {t('resources.table_headers.shelf_life')}
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-sm w-1/6" style={{ color: 'var(--text-secondary)' }}>
                        {t('resources.table_headers.status')}
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-sm w-1/6" style={{ color: 'var(--text-secondary)' }}>
                        {t('resources.table_headers.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryResources.map((resource) => {
                      const isMsbRecommended = resource.is_msb_recommended;
                      const isFilled = resource.is_filled;
                      const isEmpty = isMsbRecommended && !isFilled;
                      
                      return (
                        <tr 
                          key={resource.id} 
                          className={`border-b transition-colors hover:bg-gray-50/50 ${
                            isEmpty ? 'opacity-60' : ''
                          }`}
                          style={{ borderColor: 'var(--color-crisis-grey)20' }}
                        >
                          {/* Name Column */}
                          <td className="py-3 px-2 truncate">
                            <div className="flex flex-col gap-1">
                              <span className={`font-medium truncate ${isEmpty ? 'text-gray-500' : ''}`} style={{ 
                                color: isEmpty ? 'var(--text-secondary)' : 'var(--text-primary)' 
                              }}>
                                {resource.name}
                              </span>
                              {isMsbRecommended && (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-sage)' }} />
                                  <span className="text-xs px-1.5 py-0.5 rounded-full truncate" style={{ 
                                    backgroundColor: 'var(--color-sage)20',
                                    color: 'var(--color-sage)'
                                  }}>
                                    MSB {resource.msb_priority === 'high' ? 'Viktigt' : 'Rekommenderat'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Quantity Column */}
                          <td className="py-3 px-2">
                            {isEmpty ? (
                              <span className="text-gray-400 italic text-sm">-</span>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {resource.quantity} {resource.unit}
                              </span>
                            )}
                          </td>

                          {/* Days Remaining Column */}
                          <td className="py-3 px-2">
                            {isEmpty ? (
                              <span className="text-gray-400 italic text-sm">-</span>
                            ) : (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(resource.days_remaining, isMsbRecommended, isFilled)}`}>
                                {resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}
                              </span>
                            )}
                          </td>

                          {/* Status Column */}
                          <td className="py-3 px-2">
                            {isEmpty ? (
                              <span className="text-xs px-2 py-1 rounded-full border border-dashed" style={{ 
                                borderColor: 'var(--color-sage)',
                                color: 'var(--color-sage)'
                              }}>
                                Ej ifylld
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full" style={{ 
                                backgroundColor: 'var(--color-crisis-green)20',
                                color: 'var(--color-crisis-green)'
                              }}>
                                Registrerad
                              </span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-end gap-1 flex-shrink-0">
                              {isEmpty && (
                                <button
                                  onClick={() => handleQuickFill(resource)}
                                  className="p-1.5 hover:bg-green-500/20 rounded transition-colors"
                                  title="Snabbfyll"
                                >
                                  <Plus size={14} style={{ color: 'var(--color-sage)' }} />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(resource)}
                                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                                title="Redigera"
                              >
                                <Edit size={14} style={{ color: 'var(--text-secondary)' }} />
                              </button>
                              <button
                                onClick={() => handleDelete(resource.id, isMsbRecommended)}
                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                                title={isMsbRecommended ? 'Töm' : 'Ta bort'}
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {categoryResources.map((resource) => {
                    const isMsbRecommended = resource.is_msb_recommended;
                    const isFilled = resource.is_filled;
                    const isEmpty = isMsbRecommended && !isFilled;
                    
                    return (
                      <div 
                        key={resource.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isEmpty ? 'opacity-60 border-dashed' : 'border-solid'
                        }`}
                        style={{ 
                          borderColor: isEmpty ? 'var(--color-sage)' : 'var(--color-crisis-grey)20',
                          backgroundColor: 'var(--bg-white)'
                        }}
                      >
                        {/* Resource Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className={`font-medium truncate ${isEmpty ? 'text-gray-500' : ''}`} style={{ 
                              color: isEmpty ? 'var(--text-secondary)' : 'var(--text-primary)' 
                            }}>
                              {resource.name}
                            </h4>
                            {isMsbRecommended && (
                              <div className="flex items-center gap-1 mt-1">
                                <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-sage)' }} />
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ 
                                  backgroundColor: 'var(--color-sage)20',
                                  color: 'var(--color-sage)'
                                }}>
                                  MSB {resource.msb_priority === 'high' ? 'Viktigt' : 'Rekommenderat'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isEmpty && (
                              <button
                                onClick={() => handleQuickFill(resource)}
                                className="p-2 hover:bg-green-500/20 rounded transition-colors"
                                title="Snabbfyll"
                              >
                                <Plus size={16} style={{ color: 'var(--color-sage)' }} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(resource)}
                              className="p-2 hover:bg-white/20 rounded transition-colors"
                              title="Redigera"
                            >
                              <Edit size={16} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id, isMsbRecommended)}
                              className="p-2 hover:bg-red-500/20 rounded transition-colors"
                              title={isMsbRecommended ? 'Töm' : 'Ta bort'}
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Resource Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Antal:</span>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {isEmpty ? (
                                <span className="text-gray-400 italic">Ej ifylld</span>
                              ) : (
                                `${resource.quantity} ${resource.unit}`
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Hållbarhet:</span>
                            <div>
                              {isEmpty ? (
                                <span className="text-gray-400 italic">-</span>
                              ) : (
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(resource.days_remaining, isMsbRecommended, isFilled)}`}>
                                  {resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="mt-2">
                          {isEmpty ? (
                            <span className="text-xs px-2 py-1 rounded-full border border-dashed" style={{ 
                              borderColor: 'var(--color-sage)',
                              color: 'var(--color-sage)'
                            }}>
                              Ej ifylld
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full" style={{ 
                              backgroundColor: 'var(--color-crisis-green)20',
                              color: 'var(--color-crisis-green)'
                            }}>
                              Registrerad
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {resources.length === 0 && (
        <div className="text-center py-8">
          <Package size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('resources.no_resources_message')}
          </p>
        </div>
      )}
    </div>
  );
}
