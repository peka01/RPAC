-- RPAC Database Schema
-- Run this in your Supabase SQL editor to create the necessary tables

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools')) NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  days_remaining INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plant_diagnoses table
CREATE TABLE public.plant_diagnoses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plant_name TEXT NOT NULL,
  health_status TEXT CHECK (health_status IN ('healthy', 'disease', 'pest', 'nutrient')) NOT NULL,
  confidence INTEGER NOT NULL,
  description TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create local_community table
CREATE TABLE public.local_community (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  community_name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_sharing table
CREATE TABLE public.resource_sharing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  shared_quantity INTEGER NOT NULL,
  available_until TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('available', 'requested', 'taken')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create help_requests table
CREATE TABLE public.help_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools', 'other')) NOT NULL,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  location TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_community ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Resources policies
CREATE POLICY "Users can view own resources" ON public.resources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resources" ON public.resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resources" ON public.resources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resources" ON public.resources
  FOR DELETE USING (auth.uid() = user_id);

-- Plant diagnoses policies
CREATE POLICY "Users can view own plant diagnoses" ON public.plant_diagnoses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plant diagnoses" ON public.plant_diagnoses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Local community policies (users can view all communities)
CREATE POLICY "Users can view all communities" ON public.local_community
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own community" ON public.local_community
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own community" ON public.local_community
  FOR UPDATE USING (auth.uid() = user_id);

-- Resource sharing policies (users can view all shared resources)
CREATE POLICY "Users can view all shared resources" ON public.resource_sharing
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own shared resources" ON public.resource_sharing
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared resources" ON public.resource_sharing
  FOR UPDATE USING (auth.uid() = user_id);

-- Help requests policies (users can view all help requests)
CREATE POLICY "Users can view all help requests" ON public.help_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own help requests" ON public.help_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own help requests" ON public.help_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_local_community_updated_at BEFORE UPDATE ON public.local_community
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_sharing_updated_at BEFORE UPDATE ON public.resource_sharing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON public.help_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_resources_user_id ON public.resources(user_id);
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_plant_diagnoses_user_id ON public.plant_diagnoses(user_id);
CREATE INDEX idx_resource_sharing_status ON public.resource_sharing(status);
CREATE INDEX idx_help_requests_status ON public.help_requests(status);
CREATE INDEX idx_help_requests_urgency ON public.help_requests(urgency);
