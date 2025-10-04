'use client';

import { useState } from 'react';
import { resourceService } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { 
  X, 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Wrench,
  Sparkles,
  Plus,
  Check,
  ArrowRight
} from 'lucide-react';

interface ResourceQuickAddModalProps {
  user: { id: string };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familySize?: number;
}

interface QuickAddTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'other';
  items: {
    name: string;
    quantity: number;
    unit: string;
    days_remaining: number;
  }[];
}

// Quick-add templates for common emergency kits (quantities are per person, will be scaled by familySize)
const quickAddTemplates: QuickAddTemplate[] = [
  {
    id: 'msb-starter',
    name: 'MSB Grundkit',
    description: 'MSB:s officiella rekommendationer för 72 timmar',
    emoji: '🛡️',
    category: 'food',
    items: [
      { name: 'Dricksvatten', quantity: 6, unit: 'liter', days_remaining: 365 },
      { name: 'Energirika konserver', quantity: 6, unit: 'burkar', days_remaining: 1095 },
      { name: 'Knäckebröd', quantity: 1, unit: 'paket', days_remaining: 730 },
      { name: 'Socker och salt', quantity: 1, unit: 'paket', days_remaining: 365 },
      { name: 'Multivitamin', quantity: 1, unit: 'burk', days_remaining: 730 },
    ]
  },
  {
    id: '1-week-emergency',
    name: '1 vecka självförsörjning',
    description: 'Grundläggande förnödenheter i 7 dagar',
    emoji: '📦',
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
  {
    id: '1-month-emergency',
    name: '1 månad självförsörjning',
    description: 'Utökad beredskap i 30 dagar',
    emoji: '🏠',
    category: 'food',
    items: [
      { name: 'Dricksvatten', quantity: 60, unit: 'liter', days_remaining: 365 },
      { name: 'Konserver och burkar', quantity: 40, unit: 'burkar', days_remaining: 1095 },
      { name: 'Knäckebröd eller hårt bröd', quantity: 6, unit: 'paket', days_remaining: 730 },
      { name: 'Kött- eller fiskkonserver', quantity: 20, unit: 'burkar', days_remaining: 1095 },
      { name: 'Ris', quantity: 3, unit: 'kg', days_remaining: 730 },
      { name: 'Pasta', quantity: 3, unit: 'kg', days_remaining: 730 },
      { name: 'Olja och fett', quantity: 1, unit: 'liter', days_remaining: 365 },
      { name: 'Mjöl', quantity: 2, unit: 'kg', days_remaining: 365 },
      { name: 'Torrfrukt och nötter', quantity: 2, unit: 'kg', days_remaining: 365 },
    ]
  },
  {
    id: 'first-aid',
    name: 'Första hjälpen-kit',
    description: 'Komplett medicinsk grundutrustning (MSB)',
    emoji: '💊',
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
  {
    id: 'energy-kit',
    name: 'Energi & belysning',
    description: 'Ljus, batterier och strömförsörjning',
    emoji: '⚡',
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
  },
  {
    id: 'water-complete',
    name: 'Vattenförsörjning komplett',
    description: 'Vatten, rening och förvaring',
    emoji: '💧',
    category: 'water',
    items: [
      { name: 'Dricksvatten (3 liter/dag/person)', quantity: 21, unit: 'liter', days_remaining: 365 },
      { name: 'Vattenreningstavletter', quantity: 2, unit: 'förpackningar', days_remaining: 1095 },
      { name: 'Vattenfilter/pump', quantity: 1, unit: 'styck', days_remaining: 99999 },
      { name: 'Vattenbehållare 10L', quantity: 2, unit: 'stycken', days_remaining: 99999 },
      { name: 'Vattenkanister', quantity: 2, unit: 'stycken', days_remaining: 99999 },
    ]
  },
  {
    id: 'tools-survival',
    name: 'Verktyg & survival',
    description: 'Grundläggande verktyg och överlevnadsutrustning',
    emoji: '🔧',
    category: 'tools',
    items: [
      { name: 'Multiverktyg eller schweizisk kniv', quantity: 1, unit: 'styck', days_remaining: 99999 },
      { name: 'Tändstickor vattentäta', quantity: 3, unit: 'askar', days_remaining: 99999 },
      { name: 'Tändare', quantity: 2, unit: 'stycken', days_remaining: 99999 },
      { name: 'Rep 10m', quantity: 1, unit: 'rulle', days_remaining: 99999 },
      { name: 'Silvertejp', quantity: 1, unit: 'rulle', days_remaining: 99999 },
      { name: 'Sovsäck eller filtar', quantity: 1, unit: 'styck', days_remaining: 99999 },
      { name: 'Visselpipa', quantity: 1, unit: 'styck', days_remaining: 99999 },
      { name: 'Kontanter', quantity: 1, unit: '1000-2000 kr', days_remaining: 99999 },
    ]
  },
  {
    id: 'hygiene-kit',
    name: 'Hygien & sanitet',
    description: 'Hygienartiklar för en vecka',
    emoji: '🧼',
    category: 'other',
    items: [
      { name: 'Toalettpapper', quantity: 4, unit: 'rullar', days_remaining: 99999 },
      { name: 'Tvål', quantity: 2, unit: 'stycken', days_remaining: 365 },
      { name: 'Handsprit', quantity: 1, unit: 'flaska', days_remaining: 730 },
      { name: 'Tandborste och tandkräm', quantity: 1, unit: 'set', days_remaining: 180 },
      { name: 'Handduk', quantity: 2, unit: 'stycken', days_remaining: 99999 },
      { name: 'Blöjor (om tillämpligt)', quantity: 50, unit: 'stycken', days_remaining: 730 },
      { name: 'Mensskydd (om tillämpligt)', quantity: 2, unit: 'förpackningar', days_remaining: 730 },
    ]
  }
];

// Individual category quick-adds (MSB-recommended items per category)
const categoryQuickAdds = {
  food: [
    { name: 'Konserver (bönor, soppa)', quantity: 5, unit: 'burkar', days_remaining: 1095 },
    { name: 'Ris', quantity: 2, unit: 'kg', days_remaining: 730 },
    { name: 'Pasta', quantity: 2, unit: 'kg', days_remaining: 730 },
    { name: 'Knäckebröd', quantity: 2, unit: 'paket', days_remaining: 730 },
    { name: 'Kött/fiskkonserver', quantity: 3, unit: 'burkar', days_remaining: 1095 },
    { name: 'Torrfrukt', quantity: 1, unit: 'kg', days_remaining: 365 },
    { name: 'Nötter och frön', quantity: 1, unit: 'kg', days_remaining: 365 },
    { name: 'Olja', quantity: 1, unit: 'liter', days_remaining: 365 },
    { name: 'Honung', quantity: 1, unit: 'burk', days_remaining: 99999 },
    { name: 'Mjöl', quantity: 2, unit: 'kg', days_remaining: 365 },
  ],
  water: [
    { name: 'Vattenflaskor 1.5L', quantity: 6, unit: 'flaskor', days_remaining: 365 },
    { name: 'Vattenreningstavletter', quantity: 1, unit: 'förpackning', days_remaining: 1095 },
    { name: 'Vattenfilter', quantity: 1, unit: 'styck', days_remaining: 99999 },
    { name: 'Vattenbehållare 10L', quantity: 1, unit: 'styck', days_remaining: 99999 },
    { name: 'Kanister', quantity: 2, unit: 'stycken', days_remaining: 99999 },
  ],
  medicine: [
    { name: 'Första hjälpen-kit', quantity: 1, unit: 'kit', days_remaining: 1095 },
    { name: 'Smärtstillande (Alvedon)', quantity: 1, unit: 'förpackning', days_remaining: 730 },
    { name: 'Smärtstillande (Ipren)', quantity: 1, unit: 'förpackning', days_remaining: 730 },
    { name: 'Plåster och bandage', quantity: 1, unit: 'förpackning', days_remaining: 1095 },
    { name: 'Desinfektionsmedel', quantity: 1, unit: 'flaska', days_remaining: 730 },
    { name: 'Termometer', quantity: 1, unit: 'styck', days_remaining: 1825 },
    { name: 'Allergimedicin', quantity: 1, unit: 'förpackning', days_remaining: 730 },
    { name: 'Receptbelagda mediciner', quantity: 1, unit: 'månadsförråd', days_remaining: 30 },
  ],
  energy: [
    { name: 'AA-batterier', quantity: 2, unit: 'förpackningar', days_remaining: 1095 },
    { name: 'AAA-batterier', quantity: 1, unit: 'förpackning', days_remaining: 1095 },
    { name: 'Ficklampa LED', quantity: 2, unit: 'stycken', days_remaining: 1825 },
    { name: 'Batteridriven radio', quantity: 1, unit: 'styck', days_remaining: 1825 },
    { name: 'Powerbank', quantity: 1, unit: 'styck', days_remaining: 1095 },
    { name: 'Ljus', quantity: 10, unit: 'stycken', days_remaining: 99999 },
    { name: 'Tändstickor', quantity: 3, unit: 'askar', days_remaining: 99999 },
    { name: 'Gasol/spritkök', quantity: 1, unit: 'styck', days_remaining: 99999 },
  ],
  tools: [
    { name: 'Multiverktyg/schweizisk kniv', quantity: 1, unit: 'styck', days_remaining: 99999 },
    { name: 'Rep 10m', quantity: 1, unit: 'rulle', days_remaining: 99999 },
    { name: 'Silvertejp', quantity: 1, unit: 'rulle', days_remaining: 99999 },
    { name: 'Vattentäta tändstickor', quantity: 2, unit: 'askar', days_remaining: 99999 },
    { name: 'Tändare', quantity: 2, unit: 'stycken', days_remaining: 99999 },
    { name: 'Visselpipa', quantity: 1, unit: 'styck', days_remaining: 99999 },
  ],
  other: [
    { name: 'Kontanter 1000-2000 kr', quantity: 1, unit: 'summa', days_remaining: 99999 },
    { name: 'Varm filt/sovsäck', quantity: 1, unit: 'styck', days_remaining: 99999 },
    { name: 'Toalettpapper', quantity: 4, unit: 'rullar', days_remaining: 99999 },
    { name: 'Tvål', quantity: 2, unit: 'stycken', days_remaining: 365 },
    { name: 'Handsprit', quantity: 1, unit: 'flaska', days_remaining: 730 },
    { name: 'Tandborste och tandkräm', quantity: 1, unit: 'set', days_remaining: 180 },
  ]
};

export function ResourceQuickAddModal({ 
  user, 
  isOpen, 
  onClose, 
  onSuccess,
  familySize = 1 
}: ResourceQuickAddModalProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'category' | 'custom'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof categoryQuickAdds>('food');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom form state
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'food' as 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'other',
    quantity: 1,
    unit: 'st',
    days_remaining: 365
  });

  if (!isOpen) return null;

  const handleTemplateAdd = async (templateId: string) => {
    const template = quickAddTemplates.find(t => t.id === templateId);
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
          quantity: item.quantity * familySize, // Scale by family size
          unit: item.unit,
          days_remaining: item.days_remaining,
          is_msb_recommended: false,
          is_filled: true
        });
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding template:', err);
      setError('Kunde inte lägga till resurser. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryItemAdd = async (item: typeof categoryQuickAdds.food[0]) => {
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
    setLoading(true);
    setError(null);

    try {
      await resourceService.addResource({
        user_id: user.id,
        ...customForm,
        is_msb_recommended: false,
        is_filled: true
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding custom resource:', err);
      setError('Kunde inte lägga till resurs. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Snabblägg till resurser</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-white/80">
            Välj färdiga mallar eller lägg till enskilda resurser
          </p>
          {familySize > 1 && (
            <p className="text-white/90 text-sm mt-2 bg-white/20 rounded-lg px-3 py-2">
              💡 Kvantiteter skalas automatiskt för {familySize} personer
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'templates'
                  ? 'text-[#3D4A2B] border-b-2 border-[#3D4A2B] bg-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package size={20} />
                <span>Färdiga kit</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'category'
                  ? 'text-[#3D4A2B] border-b-2 border-[#3D4A2B] bg-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles size={20} />
                <span>Per kategori</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'custom'
                  ? 'text-[#3D4A2B] border-b-2 border-[#3D4A2B] bg-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={20} />
                <span>Egen resurs</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickAddTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateAdd(template.id)}
                  disabled={loading}
                  className="text-left p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-[#3D4A2B] hover:shadow-lg transition-all group disabled:opacity-50"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="text-4xl">{template.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {template.description}
                        {familySize > 1 && (
                          <span className="text-[#3D4A2B] font-semibold"> • För {familySize} personer</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    {template.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check size={14} className="text-[#556B2F]" />
                        <span>{item.name}</span>
                      </div>
                    ))}
                    {template.items.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{template.items.length - 3} fler...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{template.items.length} resurser</span>
                    <div className="flex items-center gap-2 text-[#3D4A2B] font-bold group-hover:gap-3 transition-all">
                      <span>Lägg till alla</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'category' && (
            <div>
              {/* Category selector */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                {(Object.keys(categoryQuickAdds) as Array<keyof typeof categoryQuickAdds>).map(cat => {
                  const icons = { food: Package, water: Droplets, medicine: Heart, energy: Zap, tools: Wrench, other: Sparkles };
                  const Icon = icons[cat];
                  const labels = { food: 'Mat', water: 'Vatten', medicine: 'Medicin', energy: 'Energi', tools: 'Verktyg', other: 'Övrigt' };
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedCategory === cat
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={24} className="mx-auto mb-1" style={{ color: selectedCategory === cat ? '#3D4A2B' : '#6B7280' }} />
                      <div className="text-xs font-medium text-gray-700">{labels[cat]}</div>
                    </button>
                  );
                })}
              </div>

              {/* Category items */}
              <div className="space-y-2">
                {categoryQuickAdds[selectedCategory].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCategoryItemAdd(item)}
                    disabled={loading}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#3D4A2B] hover:shadow-md transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 mb-1">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity * familySize} {item.unit}
                          {item.days_remaining >= 99999 ? ' • Obegränsad hållbarhet' : ` • ${item.days_remaining} dagar`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[#3D4A2B]">
                        <Plus size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleCustomAdd} className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Namn
                </label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  placeholder="t.ex. Konserverad mat"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Kategori
                </label>
                <select
                  value={customForm.category}
                  onChange={(e) => setCustomForm({ ...customForm, category: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                >
                  <option value="food">Mat</option>
                  <option value="water">Vatten</option>
                  <option value="medicine">Medicin</option>
                  <option value="energy">Energi</option>
                  <option value="tools">Verktyg</option>
                  <option value="other">Övrigt</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Antal
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customForm.quantity}
                    onChange={(e) => setCustomForm({ ...customForm, quantity: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Enhet
                  </label>
                  <input
                    type="text"
                    value={customForm.unit}
                    onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    placeholder="t.ex. kg, liter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Hållbarhet (dagar)
                </label>
                <input
                  type="number"
                  min="1"
                  value={customForm.days_remaining}
                  onChange={(e) => setCustomForm({ ...customForm, days_remaining: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Använd 99999 för obegränsad hållbarhet
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold hover:bg-[#2A331E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Lägger till...</span>
                  </>
                ) : (
                  <>
                    <Plus size={20} strokeWidth={2.5} />
                    <span>Lägg till resurs</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}

