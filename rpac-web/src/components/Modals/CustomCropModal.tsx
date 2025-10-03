import { X } from 'lucide-react';

interface CustomCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCropName: string;
  setCustomCropName: (name: string) => void;
  customCropDescription: string;
  setCustomCropDescription: (description: string) => void;
  customCropData: any;
  isValidatingCrop: boolean;
  isEditing?: boolean;
  onValidate: () => void;
  onAdd: () => void;
}

export function CustomCropModal({
  isOpen,
  onClose,
  customCropName,
  setCustomCropName,
  customCropDescription,
  setCustomCropDescription,
  customCropData,
  isValidatingCrop,
  isEditing = false,
  onValidate,
  onAdd
}: CustomCropModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Redigera anpassad gröda' : 'Lägg till egen gröda'}
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
              Grödans namn
            </label>
            <input
              type="text"
              value={customCropName}
              onChange={(e) => setCustomCropName(e.target.value)}
              placeholder="T.ex. Quinoa, Amarant, etc."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)' }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Beskrivning (valfritt)
            </label>
            <textarea
              value={customCropDescription}
              onChange={(e) => setCustomCropDescription(e.target.value)}
              placeholder="Beskriv grödan, dess egenskaper eller varför du vill odla den..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)' }}
            />
          </div>

          {customCropData && (
            <div className={`p-4 rounded-lg ${customCropData.localTips?.[0]?.includes('finns redan') ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {customCropData.localTips?.[0]?.includes('finns redan') ? 'Gröda hittades i systemet:' : 'AI-analys av grödan:'}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Vetenskapligt namn:</strong> {customCropData.scientificName}</p>
                <p><strong>Beskrivning:</strong> {customCropData.description}</p>
                <p><strong>Svårighetsgrad:</strong> {customCropData.difficulty === 'beginner' ? 'Nybörjare' : customCropData.difficulty === 'intermediate' ? 'Medel' : 'Avancerad'}</p>
                <p><strong>Lämplighet:</strong> {customCropData.suitability === 'excellent' ? 'Utmärkt' : customCropData.suitability === 'good' ? 'Bra' : customCropData.suitability === 'fair' ? 'Okej' : 'Dålig'}</p>
                <p><strong>Såtid:</strong> {customCropData.sowingMonths?.join(', ')}</p>
                <p><strong>Skördetid:</strong> {customCropData.harvestingMonths?.join(', ')}</p>
                {customCropData.localTips && customCropData.localTips.length > 0 && (
                  <div>
                    <strong>Lokala tips:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {customCropData.localTips.map((tip: string, index: number) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={onValidate}
            disabled={!customCropName.trim() || isValidatingCrop}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            {isValidatingCrop ? 'Analyserar...' : 'Analysera med AI'}
          </button>
          {customCropData && (
            <button
              onClick={onAdd}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              {isEditing ? 'Uppdatera gröda' : (customCropData.localTips?.[0]?.includes('finns redan') ? 'Lägg till ändå' : 'Lägg till gröda')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


