'use client';

import { useState } from 'react';
import { createMigrationService } from '@/lib/migration-service';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  User,
  Shield,
  Leaf,
  MessageCircle
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MigrationTestProps {
  user: SupabaseUser | null;
}

export function MigrationTest({ user }: MigrationTestProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    migrationNeeded: boolean;
    localStorageData: boolean;
    supabaseData: boolean;
    testResults: any[];
  } | null>(null);

  const runMigrationTest = async () => {
    if (!user) return;

    setIsTesting(true);
    setTestResults(null);

    try {
      const migrationService = createMigrationService(user);
      
      // Test 1: Check migration status
      const status = await migrationService.getMigrationStatus();
      
      // Test 2: Check if migration is needed
      const needsMigration = await migrationService.checkMigrationNeeded();
      
      // Test 3: Test database connection
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Test 4: Check localStorage data
      const localStorageKeys = [
        `userProfile_${user.id}`,
        'rpac-demo-resources',
        'cultivationReminders',
        'reminderSettings',
        'rpac-demo-communities',
        'rpac-demo-requests'
      ];
      
      const localStorageData = localStorageKeys.some(key => {
        try {
          return localStorage.getItem(key) !== null;
        } catch {
          return false;
        }
      });

      setTestResults({
        migrationNeeded: needsMigration,
        localStorageData,
        supabaseData: !!profileData,
        testResults: [
          {
            name: 'Migration Status Check',
            status: 'success',
            message: `Migration needed: ${needsMigration}`,
            details: status
          },
          {
            name: 'Database Connection',
            status: profileError ? 'error' : 'success',
            message: profileError ? `Error: ${profileError.message}` : 'Connected successfully',
            details: profileData
          },
          {
            name: 'LocalStorage Data',
            status: localStorageData ? 'success' : 'info',
            message: localStorageData ? 'Found localStorage data' : 'No localStorage data found',
            details: localStorageKeys.filter(key => {
              try {
                return localStorage.getItem(key) !== null;
              } catch {
                return false;
              }
            })
          }
        ]
      });

    } catch (error) {
      setTestResults({
        migrationNeeded: false,
        localStorageData: false,
        supabaseData: false,
        testResults: [
          {
            name: 'Test Error',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null
          }
        ]
      });
    } finally {
      setIsTesting(false);
    }
  };

  const runFullMigration = async () => {
    if (!user) return;

    setIsTesting(true);
    setTestResults(null);

    try {
      const migrationService = createMigrationService(user);
      const results = await migrationService.migrateAllData();
      
      setTestResults({
        migrationNeeded: false,
        localStorageData: false,
        supabaseData: true,
        testResults: results.map(result => ({
          name: result.step,
          status: result.completed ? 'success' : 'error',
          message: result.error || 'Completed successfully',
          details: result.data
        }))
      });

    } catch (error) {
      setTestResults({
        migrationNeeded: false,
        localStorageData: false,
        supabaseData: false,
        testResults: [
          {
            name: 'Migration Error',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: null
          }
        ]
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Database className="w-5 h-5 text-blue-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />;
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'user_profile':
        return <User className="w-4 h-4" />;
      case 'resources':
        return <Shield className="w-4 h-4" />;
      case 'cultivation':
        return <Leaf className="w-4 h-4" />;
      case 'community':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">No user authenticated for migration testing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Migration Test Suite
        </h2>
        <p className="text-gray-600">
          Test and verify the migration from localStorage to Supabase
        </p>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Current User</h3>
        <div className="text-sm text-gray-600">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.user_metadata?.name || 'N/A'}</p>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex space-x-3">
        <button
          onClick={runMigrationTest}
          disabled={isTesting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isTesting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Database className="w-5 h-5" />
          )}
          <span>Test Migration Status</span>
        </button>
        
        <button
          onClick={runFullMigration}
          disabled={isTesting}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isTesting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>Run Full Migration</span>
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Migration Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  testResults.migrationNeeded ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {testResults.migrationNeeded ? (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <p className="text-blue-800">Migration Needed</p>
                <p className="font-medium">{testResults.migrationNeeded ? 'Yes' : 'No'}</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  testResults.localStorageData ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Database className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-blue-800">LocalStorage Data</p>
                <p className="font-medium">{testResults.localStorageData ? 'Found' : 'None'}</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  testResults.supabaseData ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Database className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-blue-800">Supabase Data</p>
                <p className="font-medium">{testResults.supabaseData ? 'Found' : 'None'}</p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Test Results</h3>
            {testResults.testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStepIcon(result.name.toLowerCase())}
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          This test suite helps verify that the migration from localStorage to Supabase works correctly.
        </p>
      </div>
    </div>
  );
}
