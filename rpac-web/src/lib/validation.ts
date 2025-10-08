import { z } from 'zod';

// User Profile Validation Schema
export const userProfileSchema = z.object({
  display_name: z.string()
    .min(1, 'Namn är obligatoriskt')
    .max(100, 'Namn får inte vara längre än 100 tecken')
    .trim()
    .regex(/^[a-zA-ZåäöÅÄÖ\s\-']+$/, 'Namn får endast innehålla bokstäver, mellanslag, bindestreck och apostrofer'),
  
  email: z.string()
    .email('Ogiltig e-postadress')
    .max(255, 'E-postadress får inte vara längre än 255 tecken'),
  
  phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Ogiltigt telefonnummer')
    .max(20, 'Telefonnummer får inte vara längre än 20 tecken')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(200, 'Adress får inte vara längre än 200 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  postal_code: z.string()
    .regex(/^\d{5}$/, 'Postnummer måste vara 5 siffror')
    .optional()
    .or(z.literal('')),
  
  city: z.string()
    .max(50, 'Stad får inte vara längre än 50 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  county: z.enum([
    'stockholm', 'uppsala', 'sodermanland', 'ostergotland', 'jonkoping',
    'kronoberg', 'kalmar', 'blekinge', 'skane', 'halland', 'vastra_gotaland',
    'varmland', 'orebro', 'vastmanland', 'dalarna', 'gavleborg',
    'vasternorrland', 'jamtland', 'vasterbotten', 'norrbotten'
  ], { errorMap: () => ({ message: 'Ogiltigt län' }) }),
  
  emergency_contact_name: z.string()
    .max(100, 'Nödkontaktnamn får inte vara längre än 100 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  emergency_contact_phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Ogiltigt nödkontakttelefonnummer')
    .max(20, 'Nödkontakttelefonnummer får inte vara längre än 20 tecken')
    .optional()
    .or(z.literal('')),
  
  emergency_contact_relation: z.string()
    .max(50, 'Relation får inte vara längre än 50 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  medical_conditions: z.string()
    .max(500, 'Medicinska tillstånd får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  medications: z.string()
    .max(500, 'Mediciner får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  allergies: z.string()
    .max(500, 'Allergier får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Ogiltig blodgrupp' })
  }).optional().or(z.literal('')),
  
  special_needs: z.string()
    .max(500, 'Särskilda behov får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  household_size: z.number()
    .int('Hushållsstorlek måste vara ett heltal')
    .min(1, 'Hushållsstorlek måste vara minst 1')
    .max(20, 'Hushållsstorlek får inte vara mer än 20'),
  
  has_children: z.boolean().optional(),
  has_elderly: z.boolean().optional(),
  has_pets: z.boolean().optional(),
  
  pet_types: z.string()
    .max(100, 'Djursorter får inte vara längre än 100 tecken')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Resource Validation Schema
export const resourceSchema = z.object({
  name: z.string()
    .min(1, 'Resursnamn är obligatoriskt')
    .max(255, 'Resursnamn får inte vara längre än 255 tecken')
    .trim()
    .regex(/^[a-zA-ZåäöÅÄÖ0-9\s\-\.]+$/, 'Resursnamn får endast innehålla bokstäver, siffror, mellanslag, bindestreck och punkter'),
  
  category: z.enum(['food', 'water', 'medicine', 'energy', 'tools', 'other'], {
    errorMap: () => ({ message: 'Ogiltig resurskategori' })
  }),
  
  quantity: z.number()
    .positive('Kvantitet måste vara positivt')
    .max(999999, 'Kvantitet får inte vara mer än 999999'),
  
  unit: z.string()
    .min(1, 'Enhet är obligatorisk')
    .max(50, 'Enhet får inte vara längre än 50 tecken')
    .trim()
    .regex(/^[a-zA-ZåäöÅÄÖ0-9\s\-\.]+$/, 'Enhet får endast innehålla bokstäver, siffror, mellanslag, bindestreck och punkter'),
  
  days_remaining: z.number()
    .int('Dagar kvar måste vara ett heltal')
    .min(0, 'Dagar kvar får inte vara negativt')
    .max(9999, 'Dagar kvar får inte vara mer än 9999'),
  
  is_msb_recommended: z.boolean().optional(),
  msb_priority: z.enum(['high', 'medium', 'low']).optional(),
  is_filled: z.boolean().optional(),
  
  notes: z.string()
    .max(500, 'Anteckningar får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Message Validation Schema
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Meddelandeinnehåll är obligatoriskt')
    .max(1000, 'Meddelande får inte vara längre än 1000 tecken')
    .trim()
    .regex(/^[^<>]*$/, 'Meddelande får inte innehålla HTML-taggar'),
  
  receiver_id: z.string()
    .uuid('Ogiltigt mottagar-ID'),
  
  message_type: z.enum(['text', 'image', 'file', 'emergency'], {
    errorMap: () => ({ message: 'Ogiltig meddelandetyp' })
  }).default('text'),
  
  is_emergency: z.boolean().optional().default(false)
});

// Community Validation Schema
export const communitySchema = z.object({
  community_name: z.string()
    .min(1, 'Samhällsnamn är obligatoriskt')
    .max(100, 'Samhällsnamn får inte vara längre än 100 tecken')
    .trim()
    .regex(/^[a-zA-ZåäöÅÄÖ0-9\s\-\.]+$/, 'Samhällsnamn får endast innehålla bokstäver, siffror, mellanslag, bindestreck och punkter'),
  
  description: z.string()
    .max(500, 'Beskrivning får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal('')),
  
  location: z.string()
    .min(1, 'Plats är obligatorisk')
    .max(100, 'Plats får inte vara längre än 100 tecken')
    .trim(),
  
  postal_code: z.string()
    .regex(/^\d{5}$/, 'Postnummer måste vara 5 siffror')
    .optional()
    .or(z.literal('')),
  
  county: z.enum([
    'stockholm', 'uppsala', 'sodermanland', 'ostergotland', 'jonkoping',
    'kronoberg', 'kalmar', 'blekinge', 'skane', 'halland', 'vastra_gotaland',
    'varmland', 'orebro', 'vastmanland', 'dalarna', 'gavleborg',
    'vasternorrland', 'jamtland', 'vasterbotten', 'norrbotten'
  ], { errorMap: () => ({ message: 'Ogiltigt län' }) }),
  
  is_public: z.boolean().optional().default(true)
});

// Help Request Validation Schema
export const helpRequestSchema = z.object({
  title: z.string()
    .min(1, 'Titel är obligatorisk')
    .max(200, 'Titel får inte vara längre än 200 tecken')
    .trim()
    .regex(/^[^<>]*$/, 'Titel får inte innehålla HTML-taggar'),
  
  description: z.string()
    .min(1, 'Beskrivning är obligatorisk')
    .max(1000, 'Beskrivning får inte vara längre än 1000 tecken')
    .trim()
    .regex(/^[^<>]*$/, 'Beskrivning får inte innehålla HTML-taggar'),
  
  category: z.enum(['food', 'water', 'medicine', 'energy', 'tools', 'other'], {
    errorMap: () => ({ message: 'Ogiltig hjälpkategori' })
  }),
  
  urgency: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Ogiltig brådska' })
  }),
  
  location: z.string()
    .max(100, 'Plats får inte vara längre än 100 tecken')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Cultivation Reminder Validation Schema
export const cultivationReminderSchema = z.object({
  reminder_type: z.enum(['sowing', 'planting', 'watering', 'harvesting', 'maintenance'], {
    errorMap: () => ({ message: 'Ogiltig påminnelsetyp' })
  }),
  
  crop_name: z.string()
    .min(1, 'Grödanamn är obligatoriskt')
    .max(100, 'Grödanamn får inte vara längre än 100 tecken')
    .trim()
    .regex(/^[a-zA-ZåäöÅÄÖ0-9\s\-\.]+$/, 'Grödanamn får endast innehålla bokstäver, siffror, mellanslag, bindestreck och punkter'),
  
  reminder_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum måste vara i format YYYY-MM-DD'),
  
  is_recurring: z.boolean().optional().default(false),
  
  recurrence_pattern: z.enum(['weekly', 'monthly', 'seasonal']).optional(),
  
  notes: z.string()
    .max(500, 'Anteckningar får inte vara längre än 500 tecken')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Utility functions for validation
export function validateUserProfile(data: unknown) {
  return userProfileSchema.parse(data);
}

export function validateResource(data: unknown) {
  return resourceSchema.parse(data);
}

export function validateMessage(data: unknown) {
  return messageSchema.parse(data);
}

export function validateCommunity(data: unknown) {
  return communitySchema.parse(data);
}

export function validateHelpRequest(data: unknown) {
  return helpRequestSchema.parse(data);
}

export function validateCultivationReminder(data: unknown) {
  return cultivationReminderSchema.parse(data);
}

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
