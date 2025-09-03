-- Create suggestions table for user feedback and feature requests
CREATE TABLE IF NOT EXISTS public.suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    suggestion_text TEXT NOT NULL,
    suggestion_type TEXT CHECK (suggestion_type IN ('feature', 'bug', 'ui_ux', 'performance', 'accessibility', 'other')) DEFAULT 'other',
    status TEXT CHECK (status IN ('pending', 'reviewed', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON public.suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can insert their own suggestions
CREATE POLICY "Users can insert their own suggestions" ON public.suggestions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions" ON public.suggestions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own suggestions (only if status is pending)
CREATE POLICY "Users can update their own pending suggestions" ON public.suggestions
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admin users can view all suggestions
CREATE POLICY "Admin users can view all suggestions" ON public.suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'patrickandrewregan@gmail.com'
        )
    );

-- Admin users can update all suggestions
CREATE POLICY "Admin users can update all suggestions" ON public.suggestions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'patrickandrewregan@gmail.com'
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_suggestions_updated_at
    BEFORE UPDATE ON public.suggestions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_suggestions_updated_at();
