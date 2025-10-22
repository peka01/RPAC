'use client';

import Link from 'next/link';
import { t } from '@/lib/locales';
import { 
  Key, 
  ChevronLeft,
  Package,
  AlertCircle
} from 'lucide-react';

export default function LicenseManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/super-admin" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ChevronLeft className="w-5 h-5" />
            {t('admin.actions.back')}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-10 h-10" />
            <h1 className="text-3xl font-bold">{t('admin.license_management.title')}</h1>
          </div>
          <p className="text-white/80 text-lg">
            {t('admin.license_management.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Coming Soon Message */}
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Licenshantering kommer snart
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Licenshanteringssystemet är förberett i databasen och väntar på integration med betalningslösning (Stripe/Swish).
            Detta kommer att aktiveras när affärsmodellen rullas ut.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm text-blue-800">
                <p className="font-semibold mb-2">Förberedd funktionalitet:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Licenstyper (Privatperson, Samhällesansvarig)</li>
                  <li>Licenshistorik och förnyelser</li>
                  <li>Utgångsdatum och automatiska varningar</li>
                  <li>Betalningsintegrering (Stripe/Swish)</li>
                  <li>Testperioder och rabattkoder</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

