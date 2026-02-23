CREATE TABLE IF NOT EXISTS economic_data (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    
    content TEXT NOT NULL,
    analysis_text TEXT,

    source TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS economic_distribution (
    id BIGSERIAL PRIMARY KEY,

    economic_data_id BIGINT NOT NULL,
    
    component_name VARCHAR(255) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),

    CONSTRAINT fk_economic_data
        FOREIGN KEY (economic_data_id)
        REFERENCES economic_data(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS economic_media (
    id BIGSERIAL PRIMARY KEY,

    economic_data_id BIGINT NOT NULL,

    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('image', 'chart', 'table', 'pdf')),
    file_url TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_media_economic
        FOREIGN KEY (economic_data_id)
        REFERENCES economic_data(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_economic_sector 
ON economic_data(sector);

CREATE INDEX IF NOT EXISTS idx_distribution_economic_id 
ON economic_distribution(economic_data_id);

CREATE INDEX IF NOT EXISTS idx_media_economic_id 
ON economic_media(economic_data_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON economic_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();