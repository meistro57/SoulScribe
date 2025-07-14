-- SoulScribe Database Initialization Script
-- This script is automatically run when the PostgreSQL container starts

-- Create database if it doesn't exist (though it's usually created by POSTGRES_DB)
-- SELECT 'CREATE DATABASE soulscribe' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'soulscribe');

-- Connect to the soulscribe database
\c soulscribe;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add any custom functions or initial data here
-- For example, you could add sample data for testing:

-- Sample wisdom themes for story generation
CREATE TABLE IF NOT EXISTS wisdom_themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO wisdom_themes (name, description) VALUES 
    ('Inner Peace', 'Stories about finding tranquility and calm within oneself'),
    ('Forgiveness', 'Tales of letting go and healing through forgiveness'),
    ('Courage', 'Stories about facing fears and finding inner strength'),
    ('Compassion', 'Tales of kindness and understanding towards others'),
    ('Mindfulness', 'Stories about being present and aware in the moment'),
    ('Gratitude', 'Tales of appreciation and thankfulness for life'),
    ('Purpose', 'Stories about finding meaning and direction in life'),
    ('Transformation', 'Tales of personal growth and positive change'),
    ('Unity', 'Stories about connection and oneness with all beings'),
    ('Wisdom', 'Tales of ancient knowledge and understanding')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wisdom_themes_name ON wisdom_themes(name);

-- Add any other initialization queries here
-- This could include setting up initial user roles, permissions, etc.

-- Log successful initialization
INSERT INTO wisdom_themes (name, description) VALUES 
    ('Database Initialized', 'This entry confirms the database was properly initialized at startup')
ON CONFLICT DO NOTHING;