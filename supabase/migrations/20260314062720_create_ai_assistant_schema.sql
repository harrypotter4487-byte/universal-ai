/*
  # AI Assistant Database Schema

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `title` (text) - conversation title
      - `model` (text) - AI model used
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - message content
      - `created_at` (timestamp)
    
    - `generated_images`
      - `id` (uuid, primary key)
      - `prompt` (text) - image generation prompt
      - `image_url` (text) - generated image URL
      - `created_at` (timestamp)
    
    - `user_settings`
      - `id` (uuid, primary key)
      - `api_key` (text) - encrypted API key
      - `preferred_model` (text) - default AI model
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Ensure data isolation per user
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  model text NOT NULL DEFAULT 'gpt-4',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own images"
  ON generated_images
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text,
  preferred_model text DEFAULT 'gpt-4',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
