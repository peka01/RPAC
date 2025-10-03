import { X, Save } from 'lucide-react';

interface SavePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  setPlanName: (name: string) => void;
  saveToCalendar: boolean;
  setSaveToCalendar: (value: boolean) => void;
  saveReminders: boolean;
  setSaveReminders: (value: boolean) => void;
  onSave: () => void;
}

export function SavePlanModal({
  isOpen,
  onClose,
  planName,
  setPlanName,
  saveToCalendar,
  setSaveToCalendar,
  saveReminders,
  setSaveReminders,
  onSave
}: SavePlanModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Spara odlingsplan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Namn på planen
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ange namn för din odlingsplan"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveToCalendar"
                checked={saveToCalendar}
                onChange={(e) => setSaveToCalendar(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="saveToCalendar" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Spara till Odlingskalender och skriv över befintlig planering
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveReminders"
                checked={saveReminders}
                onChange={(e) => setSaveReminders(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="saveReminders" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Spara påminnelser för odlingsaktiviteter
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={() => {
              console.log('SavePlanModal: Saving with planName:', planName);
              onSave();
            }}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            Spara plan
          </button>
        </div>
      </div>
    </div>
  );
}


