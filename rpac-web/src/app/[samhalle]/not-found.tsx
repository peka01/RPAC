import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { t } from '@/lib/locales';

export default function SamhalleNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-8xl mb-4">🏘️</div>
          <h1 className="text-4xl font-bold text-[#3D4A2B] mb-4">
            {t('homespace.not_found_title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('homespace.not_found_description')}
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="w-full bg-gradient-to-r from-[#5C6B47] to-[#3D4A2B] text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <Home size={20} />
            {t('homespace.back_to_home')}
          </Link>
          
          <Link
            href="/local"
            className="w-full bg-white border-2 border-[#5C6B47] text-[#3D4A2B] px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
          >
            <Search size={20} />
            {t('homespace.find_communities')}
          </Link>
        </div>

        <div className="mt-12 p-6 bg-[#5C6B47]/10 rounded-2xl">
          <h3 className="font-semibold text-[#3D4A2B] mb-2">
            {t('homespace.want_to_create')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('homespace.create_community_benefit')}
          </p>
          <Link
            href="/local?action=create"
            className="inline-block bg-[#3D4A2B] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2A331E] transition-all"
          >
            {t('homespace.create_community')}
          </Link>
        </div>
      </div>
    </div>
  );
}

