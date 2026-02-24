CREATE TABLE geography (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT,
  terrain TEXT,
  area TEXT,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geography_data (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,                 -- Tên địa danh/khu vực
    location_text VARCHAR(255),                 -- Tên xã/tỉnh (human readable)
    latitude DECIMAL(10,8),                     -- Tọa độ
    longitude DECIMAL(11,8),

    terrain_type VARCHAR(100) NOT NULL,         -- Sông/Núi/Biển/Đồng bằng...

    natural_features TEXT,                      -- Đặc điểm tự nhiên (khí hậu, hệ sinh thái, địa chất)
    significance TEXT,                          -- Giá trị/ý nghĩa tổng quát

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geography_measurement (
    id BIGSERIAL PRIMARY KEY,

    geography_id BIGINT NOT NULL,

    measurement_type VARCHAR(100) NOT NULL,  -- area, length, height...
    value NUMERIC(15,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,               -- km2, km, m...

    CONSTRAINT fk_geography_measurement
        FOREIGN KEY (geography_id)
        REFERENCES geography_data(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS geography_significance (
    id BIGSERIAL PRIMARY KEY,

    geography_id BIGINT NOT NULL,

    category VARCHAR(100) NOT NULL,   -- du_lich, kinh_te, lich_su, van_hoa, moi_truong
    description TEXT NOT NULL,

    CONSTRAINT fk_geography_significance
        FOREIGN KEY (geography_id)
        REFERENCES geography_data(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS geography_media (
    id BIGSERIAL PRIMARY KEY,

    geography_id BIGINT NOT NULL,

    media_type VARCHAR(50) NOT NULL 
        CHECK (media_type IN ('image', 'map', 'google_maps', 'pdf')),

    file_url TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_geography_media
        FOREIGN KEY (geography_id)
        REFERENCES geography_data(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS geography_source (
    id BIGSERIAL PRIMARY KEY,

    geography_id BIGINT NOT NULL,

    title TEXT,
    source_url TEXT,

    CONSTRAINT fk_geography_source
        FOREIGN KEY (geography_id)
        REFERENCES geography_data(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_geography_name
ON geography_data(name);

CREATE INDEX IF NOT EXISTS idx_geography_terrain
ON geography_data(terrain_type);

CREATE INDEX IF NOT EXISTS idx_measurement_geo_id
ON geography_measurement(geography_id);

CREATE INDEX IF NOT EXISTS idx_media_geo_id
ON geography_media(geography_id);


CREATE OR REPLACE FUNCTION update_updated_at_column_geography()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at_geography
BEFORE UPDATE ON geography_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_geography();