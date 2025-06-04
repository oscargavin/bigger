-- Messages table for buddy communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL REFERENCES pairings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'celebration', 'encouragement', 'challenge')),
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX idx_messages_pairing_id ON messages(pairing_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Goals table for fitness objectives
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pairing_id UUID REFERENCES pairings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'weight_gain', 'strength', 'endurance', 'consistency', 'body_composition', 'custom')),
  target_value NUMERIC(10, 2),
  target_unit TEXT,
  current_value NUMERIC(10, 2),
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  visibility TEXT DEFAULT 'buddy_only' CHECK (visibility IN ('private', 'buddy_only', 'public')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed')),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for goals
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_pairing_id ON goals(pairing_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_target_date ON goals(target_date);

-- Milestones table for significant achievements
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pairing_id UUID REFERENCES pairings(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('workout_count', 'streak', 'weight_change', 'strength_pr', 'time_based', 'goal_completion', 'anniversary', 'custom')),
  value NUMERIC(10, 2),
  unit TEXT,
  icon TEXT,
  celebrated BOOLEAN DEFAULT FALSE,
  celebrated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for milestones
CREATE INDEX idx_milestones_user_id ON milestones(user_id);
CREATE INDEX idx_milestones_pairing_id ON milestones(pairing_id);
CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_type ON milestones(milestone_type);
CREATE INDEX idx_milestones_achieved_at ON milestones(achieved_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their pairings" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairings 
      WHERE pairings.id = messages.pairing_id 
      AND (pairings.user1_id = auth.uid() OR pairings.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their pairings" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM pairings 
      WHERE pairings.id = messages.pairing_id 
      AND (pairings.user1_id = auth.uid() OR pairings.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals" ON goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view buddy goals if visibility allows" ON goals
  FOR SELECT USING (
    visibility IN ('buddy_only', 'public') AND
    EXISTS (
      SELECT 1 FROM pairings 
      WHERE pairings.id = goals.pairing_id 
      AND (pairings.user1_id = auth.uid() OR pairings.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own goals" ON goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own goals" ON goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own goals" ON goals
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for milestones
CREATE POLICY "Users can view their own milestones" ON milestones
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view buddy milestones in their pairings" ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pairings 
      WHERE pairings.id = milestones.pairing_id 
      AND (pairings.user1_id = auth.uid() OR pairings.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own milestones" ON milestones
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own milestones" ON milestones
  FOR UPDATE USING (user_id = auth.uid());