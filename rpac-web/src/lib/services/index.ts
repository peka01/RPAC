// Centralized service exports for RPAC
// This reduces import complexity and provides a single source of truth for all services

// Resource Management Services
export { resourceSharingService, type SharedResource, type HelpRequest } from '../resource-sharing-service';
export { communityResourceService, type CommunityResource } from '../community-resource-service';
export { communityActivityService, type CommunityActivity } from '../community-activity-service';

// User & Profile Services
export { useUserProfile, type UserProfile } from '../useUserProfile';
export { SecureStorage } from '../secure-storage';

// Communication Services
export { messagingService } from '../messaging-service';
export { notificationService } from '../notification-service';

// Geographic & Regional Services
export { geographicService } from '../geographic-service';
export { getRegionalStatistics, getCommunitiesInCounty, type RegionalStatistics, type CommunityOverview } from '../regional-service';
export { getLansstyrelsenLinks, getCountyDisplayName, getOfficialCrisisLinks } from '../lansstyrelsen-api';

// AI & Analysis Services
export { OpenAIService, SecureOpenAIService } from '../openai-worker-service';
export { GeminiAIService } from '../gemini-ai';
export { NutritionService } from '../nutrition-service';
export { swedishPlantDatabase } from '../swedish-plant-database';

// Cultivation Services
export { cultivationPlanService } from '../cultivation-plan-service';
export { RemindersContextService } from '../reminders-context-service';
export { RemindersContextService as RemindersContextServiceEnhanced } from '../reminders-context-service-enhanced';

// Utility Services
export { WeatherService } from '../weather-service';
export { TipHistoryService } from '../tip-history-service';
export { validateResource, validateCultivationReminder } from '../validation';

// Database & Core
export { supabase, communityService, resourceService, type LocalCommunity, type Resource } from '../supabase';
export { config } from '../config';
