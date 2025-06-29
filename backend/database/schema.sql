-- Road App Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) DEFAULT 'user' CHECK (user_type IN ('user', 'admin', 'moderator')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    avatar_url VARCHAR(255),
    push_token VARCHAR(255), -- For Expo push notifications
    notification_preferences JSONB DEFAULT '{"road_signs": true, "road_state": true, "reports": true, "proximity_radius": 10}', -- User notification preferences
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Road signs categories
CREATE TABLE IF NOT EXISTS sign_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Road signs (reference data)
CREATE TABLE IF NOT EXISTS road_signs (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES sign_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    meaning TEXT,
    traffic_impact VARCHAR(50) CHECK (traffic_impact IN ('none', 'low', 'medium', 'high', 'severe')),
    speed_limit_affected BOOLEAN DEFAULT FALSE,
    lane_restrictions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Road sign instances (actual signs in the field)
CREATE TABLE IF NOT EXISTS road_sign_instances (
    id SERIAL PRIMARY KEY,
    sign_id INTEGER REFERENCES road_signs(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'missing', 'damaged', 'vandalized', 'maintenance', 'removed')),
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5), -- 1=poor, 5=excellent
    installation_date DATE,
    last_inspection_date DATE,
    next_inspection_date DATE,
    speed_limit INTEGER, -- if applicable
    additional_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Road state notifications (for real-time road conditions)
CREATE TABLE IF NOT EXISTS road_state_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('construction', 'accident', 'hazard', 'traffic', 'weather', 'maintenance', 'event', 'sign_issue')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
    affected_area_radius DECIMAL(8, 2), -- in kilometers
    estimated_duration INTEGER, -- in minutes
    speed_limit_reduction INTEGER, -- in km/h
    lane_closures TEXT,
    detour_info TEXT,
    related_sign_instance_id INTEGER REFERENCES road_sign_instances(id) ON DELETE SET NULL,
    images TEXT[], -- Array of image URLs
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    report_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    related_sign_instance_id INTEGER REFERENCES road_sign_instances(id) ON DELETE SET NULL,
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table (for user-specific notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'report', 'status_update', 'construction', 'accident', 'hazard', 'alert', 'sign_issue', 'sign_maintenance')),
    is_read BOOLEAN DEFAULT FALSE,
    related_report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
    related_road_notification_id INTEGER REFERENCES road_state_notifications(id) ON DELETE SET NULL,
    related_sign_instance_id INTEGER REFERENCES road_sign_instances(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User locations (for tracking)
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    radius_km DECIMAL(8, 2) DEFAULT 10.0, -- Notification radius in kilometers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Insert sample data
INSERT INTO sign_categories (name, description) VALUES
('Warning Signs', 'Signs that warn of potential hazards'),
('Regulatory Signs', 'Signs that regulate traffic'),
('Informational Signs', 'Signs that provide information'),
('Construction Signs', 'Signs related to road construction');

-- Insert sample road signs with enhanced data
INSERT INTO road_signs (category_id, name, description, meaning, traffic_impact, speed_limit_affected, lane_restrictions) VALUES
(1, 'Stop Sign', 'Red octagonal sign', 'Requires all vehicles to stop', 'medium', FALSE, NULL),
(1, 'Yield Sign', 'Red and white triangular sign', 'Requires vehicles to yield to other traffic', 'low', FALSE, NULL),
(2, 'Speed Limit 50', 'White rectangular sign with black numbers', 'Maximum speed limit is 50 km/h', 'none', TRUE, NULL),
(3, 'Hospital', 'Blue square with white H', 'Hospital ahead', 'none', FALSE, NULL),
(4, 'Road Work', 'Orange diamond with black symbol', 'Road construction ahead', 'high', TRUE, 'Lane may be closed'),
(4, 'Construction Zone', 'Orange diamond with construction symbol', 'Active construction zone', 'severe', TRUE, 'Multiple lanes may be closed'),
(1, 'Accident Ahead', 'Red triangle with accident symbol', 'Traffic accident ahead', 'high', TRUE, 'Lane may be blocked'),
(1, 'Slippery Road', 'Red triangle with car skidding', 'Road surface is slippery', 'medium', TRUE, NULL);

-- Insert sample road sign instances
INSERT INTO road_sign_instances (sign_id, location_name, latitude, longitude, status, condition_rating, speed_limit, additional_info) VALUES
(1, 'Main St & Oak Ave Intersection', 4.0511, 9.7679, 'active', 4, NULL, 'Primary intersection with heavy traffic'),
(1, 'Highway 101 Exit 45', 4.0167, 9.7167, 'damaged', 2, NULL, 'Sign partially obscured by vegetation'),
(2, 'Mile 4 Roundabout', 4.1500, 9.2333, 'active', 5, NULL, 'Well-maintained yield sign'),
(3, 'School District Road', 4.0167, 9.7167, 'active', 4, 50, 'School zone speed limit'),
(4, 'Buea Road Junction', 4.0511, 9.7679, 'missing', 1, NULL, 'Sign reported missing by local residents'),
(5, 'Malingo Junction', 4.1500, 9.2333, 'active', 3, NULL, 'Construction zone active'),
(6, 'Mile 17 Highway', 4.0167, 9.7167, 'vandalized', 1, NULL, 'Graffiti on construction zone sign');

-- Insert sample road state notifications
INSERT INTO road_state_notifications (title, description, location, latitude, longitude, notification_type, severity, affected_area_radius, estimated_duration, speed_limit_reduction, lane_closures, detour_info, related_sign_instance_id) VALUES
('Road construction ahead', 'Major road construction on Malingo Junction. Expect delays.', 'Malingo Junction', 4.0511, 9.7679, 'construction', 'high', 2.5, 480, 20, 'Right lane closed', 'Use alternative route via Buea Road', 6),
('Traffic accident reported', 'Multi-vehicle accident causing major delays', 'Mile 4 Roundabout', 4.0167, 9.7167, 'accident', 'critical', 1.0, 120, 30, 'Two lanes blocked', 'Emergency vehicles on scene', 3),
('Road hazard detected', 'Large pothole in the middle of the road', 'Buea Road Junction', 4.1500, 9.2333, 'hazard', 'medium', 0.5, 60, 10, NULL, 'Drive with caution', 5),
('Heavy traffic conditions', 'Rush hour traffic causing significant delays', 'Mile 17 Highway', 4.0167, 9.7167, 'traffic', 'medium', 3.0, 180, 15, NULL, 'Consider alternative routes', 7),
('Stop sign missing', 'Critical stop sign missing at Main St intersection', 'Main St & Oak Ave', 4.0511, 9.7679, 'sign_issue', 'critical', 0.3, 1440, 0, NULL, 'Use extreme caution - treat as 4-way stop', 1);

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_sign_instance_id ON reports(related_sign_instance_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_sign_instance_id ON notifications(related_sign_instance_id);
CREATE INDEX idx_road_state_notifications_type ON road_state_notifications(notification_type);
CREATE INDEX idx_road_state_notifications_severity ON road_state_notifications(severity);
CREATE INDEX idx_road_state_notifications_status ON road_state_notifications(status);
CREATE INDEX idx_road_state_notifications_location ON road_state_notifications(location);
CREATE INDEX idx_road_state_notifications_coordinates ON road_state_notifications(latitude, longitude);
CREATE INDEX idx_road_state_notifications_expires_at ON road_state_notifications(expires_at);
CREATE INDEX idx_road_state_notifications_sign_instance_id ON road_state_notifications(related_sign_instance_id);
CREATE INDEX idx_road_sign_instances_sign_id ON road_sign_instances(sign_id);
CREATE INDEX idx_road_sign_instances_status ON road_sign_instances(status);
CREATE INDEX idx_road_sign_instances_coordinates ON road_sign_instances(latitude, longitude);
CREATE INDEX idx_road_sign_instances_location ON road_sign_instances(location_name);
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_timestamp ON user_locations(timestamp);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_road_signs_category_id ON road_signs(category_id);
CREATE INDEX idx_road_signs_name ON road_signs(name);
CREATE INDEX idx_road_signs_traffic_impact ON road_signs(traffic_impact);
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_preferences_type ON user_notification_preferences(notification_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_road_state_notifications_updated_at BEFORE UPDATE ON road_state_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_road_sign_instances_updated_at BEFORE UPDATE ON road_sign_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 