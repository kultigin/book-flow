-- Seed demo business for testing
-- Password is "demo123" hashed with bcrypt

-- Insert demo business (matching actual schema)
INSERT INTO businesses (id, name, slug, default_slot_duration, timezone)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Demo Peluqueria',
  'demo-business',
  30,
  'Europe/Madrid'
) ON CONFLICT (slug) DO NOTHING;

-- Insert demo admin account (password: demo123)
-- Note: In production, use proper password hashing
INSERT INTO account_holders (id, business_id, email, password_hash, name, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'admin@demo.com',
  '$2a$10$rQEY7tK3aGGH3LJO2hqJVOYzY2YGY4aV6gJX7cNWqYzYpYcYaYcYa',
  'Admin Demo',
  'admin'
) ON CONFLICT DO NOTHING;

-- Insert demo staff account
INSERT INTO account_holders (id, business_id, email, password_hash, name, role)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'staff@demo.com',
  '$2a$10$rQEY7tK3aGGH3LJO2hqJVOYzY2YGY4aV6gJX7cNWqYzYpYcYaYcYa',
  'Staff Demo',
  'staff'
) ON CONFLICT DO NOTHING;

-- Insert availability for demo business (Monday to Friday, 9:00-18:00)
INSERT INTO availability (business_id, day_of_week, start_time, end_time, slot_duration)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 1, '09:00', '18:00', 30),
  ('b0000000-0000-0000-0000-000000000001', 2, '09:00', '18:00', 30),
  ('b0000000-0000-0000-0000-000000000001', 3, '09:00', '18:00', 30),
  ('b0000000-0000-0000-0000-000000000001', 4, '09:00', '18:00', 30),
  ('b0000000-0000-0000-0000-000000000001', 5, '09:00', '18:00', 30),
  ('b0000000-0000-0000-0000-000000000001', 6, '10:00', '14:00', 30)
ON CONFLICT DO NOTHING;
