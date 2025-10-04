'use client';

import { useState } from 'react';
import { X, Plus, Shield, CheckCircle, AlertCircle, Loader, Sparkles } from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceService, Resource } from '@/lib/supabase';

// Category configuration
const categoryConfig = {
  food: { emoji: '🍞', label: 'Mat', color: '#FFC000' },
  water: { emoji: '💧', label: 'Vatten', color: '#4A90E2' },
  medicine: { emoji: '💊', label: 'Medicin', color: '#8B4513' },
  energy: { emoji: '⚡', label: 'Energi', color: '#2A331E' },
  tools: { emoji: '🔧', label: 'Verktyg', color: '#4A5239' },
  machinery: { emoji: '🚜', label: 'Maskiner', color: '#6B8E23' },
  other: { emoji: '✨', label: 'Övrigt', color: '#707C5F' }
};

type CategoryKey = keyof typeof categoryConfig;

// MSB recommended resources by category (atomic items only)
export const msbRecommendations: Record<CategoryKey, Array<{
  name: string;
  quantity: number;
  unit: string;
  days_remaining: number;
  is_msb: boolean;
}>> = {
  food: [
    // MSB Core Recommendations
    { name: 'Pasta', quantity: 1, unit: 'kg', days_remaining: 730, is_msb: true },
    { name: 'Ris', quantity: 1, unit: 'kg', days_remaining: 730, is_msb: true },
    { name: 'Linser', quantity: 500, unit: 'g', days_remaining: 730, is_msb: true },
    { name: 'Bönor (torkade)', quantity: 500, unit: 'g', days_remaining: 730, is_msb: true },
    { name: 'Konserver (kött)', quantity: 3, unit: 'burkar', days_remaining: 1095, is_msb: true },
    { name: 'Konserver (fisk)', quantity: 3, unit: 'burkar', days_remaining: 1095, is_msb: true },
    { name: 'Konserver (bönor)', quantity: 3, unit: 'burkar', days_remaining: 1095, is_msb: true },
    { name: 'Knäckebröd', quantity: 2, unit: 'paket', days_remaining: 365, is_msb: true },
    { name: 'Smör/olja', quantity: 500, unit: 'ml', days_remaining: 365, is_msb: true },
    { name: 'Salt', quantity: 500, unit: 'g', days_remaining: 99999, is_msb: true },
    { name: 'Socker', quantity: 1, unit: 'kg', days_remaining: 730, is_msb: true },
    { name: 'Mjöl', quantity: 2, unit: 'kg', days_remaining: 365, is_msb: true },
    { name: 'Honung', quantity: 500, unit: 'g', days_remaining: 99999, is_msb: true },
    { name: 'Sylt', quantity: 1, unit: 'burk', days_remaining: 730, is_msb: true },
    { name: 'Müsli', quantity: 1, unit: 'paket', days_remaining: 365, is_msb: false },
    { name: 'Havregryn', quantity: 1, unit: 'kg', days_remaining: 730, is_msb: false },
    { name: 'Nötter', quantity: 500, unit: 'g', days_remaining: 365, is_msb: false },
    { name: 'Torkad frukt', quantity: 500, unit: 'g', days_remaining: 365, is_msb: false },
    { name: 'Energibars', quantity: 10, unit: 'st', days_remaining: 365, is_msb: false },
    { name: 'Kaffe/te', quantity: 1, unit: 'paket', days_remaining: 730, is_msb: false },
    { name: 'Buljong', quantity: 1, unit: 'paket', days_remaining: 730, is_msb: false },
    { name: 'Kex', quantity: 2, unit: 'paket', days_remaining: 365, is_msb: false },
  ],
  water: [
    // MSB Core Recommendations
    { name: 'Vattenflaskor (PET)', quantity: 21, unit: 'liter', days_remaining: 730, is_msb: true },
    { name: 'Vattenreningstabletter', quantity: 50, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Vattenfilter (portabelt)', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Vattendunk (fällbar)', quantity: 10, unit: 'liter', days_remaining: 99999, is_msb: false },
    { name: 'Vattenförvaring (stor)', quantity: 25, unit: 'liter', days_remaining: 99999, is_msb: false },
  ],
  medicine: [
    // MSB Core Recommendations
    { name: 'Första hjälpen-kit', quantity: 1, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Plåster (mix)', quantity: 1, unit: 'förpackning', days_remaining: 1825, is_msb: true },
    { name: 'Kompress (sterila)', quantity: 10, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Förband (elastisk)', quantity: 2, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Värktabletter', quantity: 1, unit: 'förpackning', days_remaining: 730, is_msb: true },
    { name: 'Febernedsättande', quantity: 1, unit: 'förpackning', days_remaining: 730, is_msb: true },
    { name: 'Receptbelagda mediciner', quantity: 90, unit: 'dagars dos', days_remaining: 90, is_msb: true },
    { name: 'Handsprit', quantity: 1, unit: 'flaska', days_remaining: 730, is_msb: true },
    { name: 'Sårvätska', quantity: 1, unit: 'flaska', days_remaining: 730, is_msb: false },
    { name: 'Salva (antiseptisk)', quantity: 1, unit: 'tub', days_remaining: 730, is_msb: false },
    { name: 'Allergi-medicin', quantity: 1, unit: 'förpackning', days_remaining: 730, is_msb: false },
    { name: 'Magesyremedicin', quantity: 1, unit: 'förpackning', days_remaining: 730, is_msb: false },
    { name: 'Impregnerade kompress', quantity: 5, unit: 'st', days_remaining: 1825, is_msb: false },
    { name: 'Sax (medicinsk)', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Pincett', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Termometer', quantity: 1, unit: 'st', days_remaining: 1825, is_msb: false },
  ],
  energy: [
    // MSB Core Recommendations
    { name: 'Batteridriven radio', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Ficklampa (LED)', quantity: 2, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Batterier AA', quantity: 20, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Batterier AAA', quantity: 20, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Powerbank', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Värmeljus', quantity: 20, unit: 'st', days_remaining: 1825, is_msb: true },
    { name: 'Tändstickor', quantity: 3, unit: 'askar', days_remaining: 1825, is_msb: true },
    { name: 'Tändare', quantity: 2, unit: 'st', days_remaining: 1825, is_msb: false },
    { name: 'Stearinljus', quantity: 10, unit: 'st', days_remaining: 1825, is_msb: false },
    { name: 'Pannlampa', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Laddningsbart batteri (9V)', quantity: 4, unit: 'st', days_remaining: 1825, is_msb: false },
    { name: 'Solcellsladdare', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'USB-C kabel', quantity: 2, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'USB laddare', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
  ],
  tools: [
    // MSB Core Recommendations
    { name: 'Gasolvårmare', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Gasoltub', quantity: 2, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Sovsäck (varm)', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Filt', quantity: 2, unit: 'st', days_remaining: 99999, is_msb: true },
    { name: 'Kontanter', quantity: 1000, unit: 'kr', days_remaining: 99999, is_msb: true },
    { name: 'Toalettpapper', quantity: 4, unit: 'rullar/vecka', days_remaining: 30, is_msb: true },
    { name: 'Tvål', quantity: 2, unit: 'st', days_remaining: 90, is_msb: true },
    { name: 'Tandborste', quantity: 2, unit: 'st', days_remaining: 90, is_msb: false },
    { name: 'Tandkräm', quantity: 2, unit: 'tuber', days_remaining: 180, is_msb: false },
    { name: 'Schampo', quantity: 1, unit: 'flaska', days_remaining: 90, is_msb: false },
    { name: 'Damhygien', quantity: 1, unit: 'paket', days_remaining: 90, is_msb: false },
    { name: 'Blöjor', quantity: 1, unit: 'paket/vecka', days_remaining: 30, is_msb: false },
    { name: 'Rakhyvel', quantity: 2, unit: 'st', days_remaining: 180, is_msb: false },
    { name: 'Handduk', quantity: 2, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Soppåsar', quantity: 1, unit: 'rulle', days_remaining: 365, is_msb: false },
    { name: 'Aluminiumfolie', quantity: 1, unit: 'rulle', days_remaining: 365, is_msb: false },
    { name: 'Plastpåsar (fryspåsar)', quantity: 1, unit: 'paket', days_remaining: 365, is_msb: false },
    { name: 'Konservöppnare', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Flasköppnare', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Kniv (universalkniv)', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Reptejp', quantity: 1, unit: 'rulle', days_remaining: 365, is_msb: false },
    { name: 'Skruvmejsel-set', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
  ],
  machinery: [
    // Fuel & Consumables
    { name: 'Bensin', quantity: 20, unit: 'liter', days_remaining: 180, is_msb: false },
    { name: 'Diesel', quantity: 20, unit: 'liter', days_remaining: 365, is_msb: false },
    { name: 'Alkylatbensin', quantity: 5, unit: 'liter', days_remaining: 730, is_msb: false },
    { name: 'Tvåtaktsolja', quantity: 1, unit: 'liter', days_remaining: 730, is_msb: false },
    { name: 'Motorolja', quantity: 2, unit: 'liter', days_remaining: 730, is_msb: false },
    { name: 'Kedjeolja', quantity: 1, unit: 'liter', days_remaining: 365, is_msb: false },
    // Agricultural & Power Equipment
    { name: 'Motordrivet elverk', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Bensindriven pump', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Motorsåg', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Gräsklippare', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Röjsåg', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Jordbearbetningsmaskin', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Släpkärra', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Traktor', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'ATV/terränghjuling', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Snöslunga', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Vattenpump', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Kompressor', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Svetsapparat', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Kapmaskin', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Slagborrmaskin', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
  ],
  other: [
    // MSB Core Recommendations
    { name: 'Dokument (kopior)', quantity: 1, unit: 'mapp', days_remaining: 99999, is_msb: true },
    { name: 'Identitetshandlingar', quantity: 1, unit: 'set', days_remaining: 99999, is_msb: true },
    { name: 'Försäkringsbrev', quantity: 1, unit: 'kopia', days_remaining: 99999, is_msb: true },
    { name: 'Viktiga telefonnummer', quantity: 1, unit: 'lista', days_remaining: 99999, is_msb: true },
    { name: 'Kortlek', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Sällskapsspel', quantity: 1, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Bok', quantity: 3, unit: 'st', days_remaining: 99999, is_msb: false },
    { name: 'Anteckningsblock', quantity: 1, unit: 'st', days_remaining: 365, is_msb: false },
    { name: 'Pennor', quantity: 5, unit: 'st', days_remaining: 365, is_msb: false },
    { name: 'Hundmat (torrfoder)', quantity: 2, unit: 'kg', days_remaining: 365, is_msb: false },
    { name: 'Kattmat (burkar)', quantity: 10, unit: 'burkar', days_remaining: 730, is_msb: false },
  ]
};

interface SimpleAddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function SimpleAddResourceModal({
  isOpen,
  onClose,
  userId,
  onSuccess
}: SimpleAddResourceModalProps) {
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [selectedMsbItem, setSelectedMsbItem] = useState<typeof msbRecommendations[CategoryKey][0] | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    unit: 'st',
    days_remaining: 365,
    is_filled: false,
    is_msb_recommended: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedMsbItem(null);
    setUseCustom(false);
    setForm({
      name: '',
      quantity: 1,
      unit: 'st',
      days_remaining: 365,
      is_filled: false,
      is_msb_recommended: false
    });
    setError(null);
    setSuccess(false);
  };

  const handleCategorySelect = (category: CategoryKey) => {
    setSelectedCategory(category);
    setStep('details');
    setUseCustom(false);
    setSelectedMsbItem(null);
    setForm(prev => ({ ...prev, name: '', is_msb_recommended: false }));
  };

  const handleMsbItemSelect = (item: typeof msbRecommendations[CategoryKey][0]) => {
    setSelectedMsbItem(item);
    setUseCustom(false);
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      days_remaining: item.days_remaining,
      is_filled: false,
      is_msb_recommended: item.is_msb
    });
  };

  const handleCustomToggle = () => {
    setUseCustom(true);
    setSelectedMsbItem(null);
    setForm({
      name: '',
      quantity: 1,
      unit: 'st',
      days_remaining: 365,
      is_filled: false,
      is_msb_recommended: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !selectedCategory) {
      setError('Fyll i alla obligatoriska fält');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resourceService.addResource({
        user_id: userId,
        name: form.name,
        category: selectedCategory,
        quantity: form.quantity,
        unit: form.unit,
        days_remaining: form.days_remaining,
        is_msb_recommended: form.is_msb_recommended,
        is_filled: form.is_filled
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error adding resource:', err);
      setError('Kunde inte lägga till resurs. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] rounded-xl flex items-center justify-center">
              <Plus size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Lägg till resurs
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'category' ? 'Steg 1 av 2: Välj kategori' : `Steg 2 av 2: ${categoryConfig[selectedCategory!].label}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Resurs tillagd!
              </h3>
              <p className="text-gray-600">
                {form.name} har lagts till i din beredskapslista
              </p>
            </div>
          ) : step === 'category' ? (
            <>
              {/* Category Selection */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Vilken typ av resurs vill du lägga till?
                </h3>
                <p className="text-sm text-gray-600">
                  Välj kategori så får du hjälp med MSB:s rekommendationer
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(Object.keys(categoryConfig) as CategoryKey[]).map((cat) => {
                  const config = categoryConfig[cat];
                  const itemCount = msbRecommendations[cat].length;
                  const msbCount = msbRecommendations[cat].filter(i => i.is_msb).length;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#3D4A2B] hover:bg-[#3D4A2B]/5 transition-all active:scale-95"
                    >
                      <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                        {config.emoji}
                      </div>
                      <div className="font-bold text-gray-900 mb-1">
                        {config.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {itemCount} resurser ({msbCount} MSB)
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Details Step */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              {/* MSB Recommendations Dropdown */}
              {!useCustom && selectedCategory && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Välj resurs från listan
                    </label>
                    <button
                      onClick={handleCustomToggle}
                      className="text-sm text-[#3D4A2B] hover:text-[#2A331E] underline font-medium"
                    >
                      Eller skriv egen →
                    </button>
                  </div>

                  <select
                    value={selectedMsbItem ? msbRecommendations[selectedCategory].indexOf(selectedMsbItem) : -1}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (idx >= 0) {
                        handleMsbItemSelect(msbRecommendations[selectedCategory][idx]);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent bg-white"
                  >
                    <option value={-1}>Välj en resurs...</option>
                    {msbRecommendations[selectedCategory].map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.is_msb ? '⭐ ' : ''}{item.name} ({item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                  
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Shield size={12} className="text-[#556B2F]" />
                    ⭐ = MSB:s officiella rekommendationer
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {useCustom && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-blue-600" />
                      <p className="text-sm text-blue-900">
                        <strong>Tips:</strong> Lägg till din egen resurs här. Du kan alltid ändra detaljer senare.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Namn på resurs *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="T.ex. Vatten, Konserver, Ficklampa..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Antal *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enhet *
                    </label>
                    <input
                      type="text"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      placeholder="st, kg, liter..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hållbarhet (dagar) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.days_remaining === 0 ? '' : form.days_remaining}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, days_remaining: val === '' ? 0 : parseInt(val) });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    T.ex. 365 = 1 år, 730 = 2 år, 99999 = obegränsad
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('category');
                      setSelectedCategory(null);
                      setUseCustom(false);
                      setSelectedMsbItem(null);
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Tillbaka
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.name.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Lägger till...
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Lägg till resurs
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

