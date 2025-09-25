'use client';

import { useState, useEffect } from 'react';
import { createMigrationService, type MigrationStatus } from '@/lib/migration-service';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database, 
  ArrowRight,
  Shield,
  Users,
  Leaf,
  MessageCircle
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface MigrationWizardProps {
  user: User | null;
  onMigrationComplete?: () => void;
}

export function MigrationWizard({ user, onMigrationComplete }: MigrationWizardProps) {
  const [migrationStatus, setMigrationStatus] = useState<{
    needsMigration: boolean;
    hasLocalStorageData: boolean;
    hasSupabaseData: boolean;
  } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationStatus[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (user) {
      checkMigrationStatus();
    }
  }, [user]);

  const checkMigrationStatus = async () => {
    if (!user) return;

    try {
      const migrationService = createMigrationService(user);
      const status = await migrationService.getMigrationStatus();
      setMigrationStatus(status);
      
      // Show wizard if migration is needed
      if (status.needsMigration) {
        setShowWizard(true);
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const handleStartMigration = async () => {
    if (!user) return;

    setIsMigrating(true);
    setMigrationResults([]);

    try {
      const migrationService = createMigrationService(user);
      const results = await migrationService.migrateAllData();
      
      setMigrationResults(results);
      
      // Check if all steps completed successfully
      const allCompleted = results.every(result => result.completed);
      
      if (allCompleted) {
        // Migration successful
        setTimeout(() => {
          setShowWizard(false);
          onMigrationComplete?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResults([{
        step: 'migration_error',
        completed: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      }]);
    } finally {
      setIsMigrating(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'user_profile':
        return <Users className="w-5 h-5" />;
      case 'resources':
        return <Shield className="w-5 h-5" />;
      case 'cultivation':
        return <Leaf className="w-5 h-5" />;
      case 'community':
        return <MessageCircle className="w-5 h-5" />;
      case 'cleanup':
        return <Database className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'user_profile':
        return 'Användarprofil';
      case 'resources':
        return 'Resursinventering';
      case 'cultivation':
        return 'Odlingsdata';
      case 'community':
        return 'Samhällsdata';
      case 'cleanup':
        return 'Rensning';
      default:
        return step;
    }
  };

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'user_profile':
        return 'Migrerar din profil och inställningar';
      case 'resources':
        return 'Överför resursinventering och MSB-rekommendationer';
      case 'cultivation':
        return 'Migrerar odlingskalender och påminnelser';
      case 'community':
        return 'Överför samhällsdata och hjälpförfrågningar';
      case 'cleanup':
        return 'Rensar lokal data efter lyckad migrering';
      default:
        return 'Bearbetar data...';
    }
  };

  if (!migrationStatus || !showWizard) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('migration.title')}
            </h2>
            <p className="text-gray-600">
              {t('migration.description')}
            </p>
          </div>

          {/* Migration Status */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    {t('migration.status_title')}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {t('migration.status_description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Steps */}
          {migrationResults.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-4">
                {t('migration.progress_title')}
              </h3>
              <div className="space-y-3">
                {migrationResults.map((result, index) => (
                  <div
                    key={result.step}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      result.completed
                        ? 'bg-green-50 border-green-200'
                        : result.error
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${
                      result.completed
                        ? 'text-green-600'
                        : result.error
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                      {result.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : result.error ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getStepIcon(result.step)}
                        <h4 className="font-medium text-gray-900">
                          {getStepTitle(result.step)}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {result.error || getStepDescription(result.step)}
                      </p>
                      {result.data && (
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof result.data === 'object' 
                            ? JSON.stringify(result.data, null, 2)
                            : result.data
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Step */}
          {isMigrating && currentStep && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {t('migration.current_step')}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {getStepDescription(currentStep)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {!isMigrating && migrationResults.length === 0 && (
              <>
                <button
                  onClick={handleStartMigration}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Database className="w-5 h-5" />
                  <span>{t('migration.start_migration')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  {t('migration.skip')}
                </button>
              </>
            )}

            {isMigrating && (
              <div className="flex-1 bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('migration.migrating')}</span>
                </div>
              </div>
            )}

            {!isMigrating && migrationResults.length > 0 && (
              <button
                onClick={() => setShowWizard(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t('migration.complete')}</span>
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('migration.info')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
