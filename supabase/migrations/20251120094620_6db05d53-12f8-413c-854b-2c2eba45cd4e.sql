-- Create meal cards table
CREATE TABLE public.meal_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_card_number TEXT NOT NULL,
  university TEXT NOT NULL,
  campus TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'taken')),
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  taken_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.meal_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view available meal cards" 
ON public.meal_cards 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can share their own meal cards" 
ON public.meal_cards 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update meal cards to take them" 
ON public.meal_cards 
FOR UPDATE 
TO authenticated
USING (status = 'available')
WITH CHECK (auth.uid() = taken_by AND status = 'taken');

-- Create index for faster queries
CREATE INDEX idx_meal_cards_status ON public.meal_cards(status);
CREATE INDEX idx_meal_cards_shared_by ON public.meal_cards(shared_by);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();