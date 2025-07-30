-- Create swipe_preferences table for AI recommendations
CREATE TABLE IF NOT EXISTS public.swipe_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    preference TEXT NOT NULL CHECK (preference IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- Enable RLS
ALTER TABLE public.swipe_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own swipe preferences" ON public.swipe_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own swipe preferences" ON public.swipe_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own swipe preferences" ON public.swipe_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swipe preferences" ON public.swipe_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.swipe_preferences TO authenticated;
GRANT ALL ON public.swipe_preferences TO service_role;
