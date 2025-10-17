-- PlanifyAI Database Setup
-- Run this script in phpMyAdmin or MySQL command line

-- Create database
CREATE DATABASE IF NOT EXISTS planifyai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE planifyai;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_priority (priority)
);

-- Create time_blocks table
CREATE TABLE IF NOT EXISTS time_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    block_type ENUM('focus', 'break', 'meeting', 'personal') DEFAULT 'focus',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_type (block_type)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_preference (user_id, preference_key)
);

-- Create productivity_metrics table
CREATE TABLE IF NOT EXISTS productivity_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    focus_time INT DEFAULT 0,
    meeting_time INT DEFAULT 0,
    break_time INT DEFAULT 0,
    productivity_score FLOAT DEFAULT 0.0,
    tasks_completed INT DEFAULT 0,
    tasks_planned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    confidence_score FLOAT DEFAULT 0.0,
    data TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (insight_type),
    INDEX idx_applied (is_applied)
);

-- Create calendar_sync table
CREATE TABLE IF NOT EXISTS calendar_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(200),
    event_id INT,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status ENUM('pending', 'synced', 'error') DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_provider (provider),
    INDEX idx_status (sync_status)
);

-- Insert sample data for demonstration
INSERT INTO events (title, description, date, start_time, end_time, category, priority) VALUES
('Team Standup', 'Daily team synchronization meeting', CURDATE(), '09:00', '09:30', 'meeting', 'medium'),
('Project Planning', 'Plan next sprint activities', CURDATE(), '10:00', '11:30', 'meeting', 'high'),
('Focus Work', 'Deep work on core features', CURDATE(), '14:00', '16:00', 'work', 'high'),
('Client Call', 'Weekly client check-in', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00', '16:00', 'meeting', 'high'),
('Code Review', 'Review team pull requests', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00', '12:00', 'work', 'medium'),
('Lunch Break', 'Lunch with team', CURDATE(), '12:00', '13:00', 'break', 'low');

-- Insert sample time blocks
INSERT INTO time_blocks (title, date, start_time, end_time, block_type, description) VALUES
('Morning Focus Block', CURDATE(), '08:00', '10:00', 'focus', 'Dedicated time for deep work'),
('Afternoon Meetings', CURDATE(), '14:00', '17:00', 'meeting', 'Block for scheduled meetings'),
('Planning Time', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '10:00', 'focus', 'Weekly planning session');

-- Insert sample user preferences
INSERT INTO user_preferences (user_id, preference_key, preference_value) VALUES
('default_user', 'work_start_time', '09:00'),
('default_user', 'work_end_time', '17:00'),
('default_user', 'preferred_meeting_duration', '60'),
('default_user', 'break_frequency', '120'),
('default_user', 'focus_block_duration', '90'),
('default_user', 'notification_preferences', '{"email": true, "push": true, "sms": false}');

-- Insert sample productivity metrics
INSERT INTO productivity_metrics (date, focus_time, meeting_time, break_time, productivity_score, tasks_completed, tasks_planned) VALUES
(CURDATE(), 240, 120, 60, 85.5, 8, 10),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 180, 180, 45, 72.3, 6, 9),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 300, 90, 30, 92.1, 12, 12);

-- Insert sample AI insights
INSERT INTO ai_insights (insight_type, title, description, confidence_score, data, is_applied) VALUES
('pattern', 'Morning Productivity Peak', 'You are most productive between 9 AM and 11 AM', 0.87, '{"peak_hours": [9, 10, 11], "productivity_score": 92}', FALSE),
('suggestion', 'Meeting Clustering', 'Consider clustering meetings in the afternoon to preserve morning focus time', 0.75, '{"suggested_time": "14:00-17:00", "benefit": "3 hours morning focus"}', FALSE),
('optimization', 'Break Scheduling', 'Add 15-minute breaks between long work sessions', 0.82, '{"break_duration": 15, "frequency": 90}', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_events_date_time ON events(date, start_time);
CREATE INDEX idx_time_blocks_date_time ON time_blocks(date, start_time);
CREATE INDEX idx_productivity_date ON productivity_metrics(date);
CREATE INDEX idx_insights_created ON ai_insights(created_at);

-- Create views for common queries
CREATE VIEW daily_schedule AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.start_time,
    e.end_time,
    e.category,
    e.priority,
    'event' as type
FROM events e
UNION ALL
SELECT 
    tb.id,
    tb.title,
    tb.description,
    tb.date,
    tb.start_time,
    tb.end_time,
    tb.block_type as category,
    'medium' as priority,
    'time_block' as type
FROM time_blocks tb
ORDER BY date, start_time;

CREATE VIEW productivity_summary AS
SELECT 
    DATE_FORMAT(date, '%Y-%m') as month,
    AVG(productivity_score) as avg_productivity,
    SUM(focus_time) as total_focus_time,
    SUM(meeting_time) as total_meeting_time,
    SUM(tasks_completed) as total_tasks_completed,
    COUNT(*) as days_tracked
FROM productivity_metrics 
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON planifyai.* TO 'planifyai_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;

-- Show tables to verify creation
SHOW TABLES;