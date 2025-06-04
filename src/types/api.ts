// User types
export type User = {
  id: string;
  username: string;
  fullName: string;
  full_name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string;
  notificationPreferences?: any;
  notification_preferences?: any;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

// Pairing types
export type Pairing = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'active' | 'ended';
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user1?: User;
  user2?: User;
};

// Workout types
export type Workout = {
  id: string;
  user_id: string;
  pairing_id?: string | null;
  completed_at: string;
  duration_minutes?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  photos?: Photo[];
  user?: User;
};

// Photo types
export type Photo = {
  id: string;
  workout_id: string;
  user_id: string;
  photo_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  created_at?: string;
};

// Helper type to normalize snake_case to camelCase
export type NormalizeUser = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  timezone?: string;
  notificationPreferences?: any;
  createdAt?: string;
  updatedAt?: string;
};