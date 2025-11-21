-- Create game_scores table
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'reaction',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view game scores" 
ON public.game_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own scores" 
ON public.game_scores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better leaderboard performance
CREATE INDEX idx_game_scores_score ON public.game_scores(score DESC, created_at DESC);