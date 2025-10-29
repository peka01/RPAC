import type { HelpRequest } from '@/lib/services';

export const helpRequestUrgencyConfig: Record<HelpRequest['urgency'], { labelKey: string; badgeClass: string; dotClass: string; pulse?: boolean; }> = {
  low: {
    labelKey: 'community_resources.help.urgency.low',
    badgeClass: 'bg-green-100 text-green-800 border border-green-200',
    dotClass: 'bg-green-500'
  },
  medium: {
    labelKey: 'community_resources.help.urgency.medium',
    badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    dotClass: 'bg-yellow-500'
  },
  high: {
    labelKey: 'community_resources.help.urgency.high',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-200',
    dotClass: 'bg-orange-500'
  },
  critical: {
    labelKey: 'community_resources.help.urgency.critical',
    badgeClass: 'bg-red-100 text-red-800 border border-red-200 animate-pulse',
    dotClass: 'bg-red-600',
    pulse: true
  }
};

export const helpRequestStatusConfig: Record<HelpRequest['status'], { labelKey: string; badgeClass: string; dotClass: string; }> = {
  open: {
    labelKey: 'community_resources.help.status.open',
    badgeClass: 'bg-[#3D4A2B]/10 text-[#3D4A2B] border border-[#3D4A2B]/30',
    dotClass: 'bg-[#3D4A2B]'
  },
  in_progress: {
    labelKey: 'community_resources.help.status.in_progress',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200',
    dotClass: 'bg-blue-500'
  },
  resolved: {
    labelKey: 'community_resources.help.status.resolved',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  closed: {
    labelKey: 'community_resources.help.status.closed',
    badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    dotClass: 'bg-gray-400'
  }
};

export const helpRequestStatusOrder: HelpRequest['status'][] = ['open', 'in_progress', 'resolved', 'closed'];

export const defaultHelpRequestForm: Pick<HelpRequest, 'urgency'> & { title: string; description: string; location?: string } = {
  title: '',
  description: '',
  urgency: 'medium'
};

export const helpStatusFilters: Array<{ id: 'all' | HelpRequest['status']; labelKey: string }> = [
  { id: 'all', labelKey: 'community_resources.help.filters.status_all' },
  { id: 'open', labelKey: 'community_resources.help.filters.status_open' },
  { id: 'in_progress', labelKey: 'community_resources.help.filters.status_in_progress' },
  { id: 'resolved', labelKey: 'community_resources.help.filters.status_resolved' }
];
