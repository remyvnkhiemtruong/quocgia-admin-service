-- init.sql

-- Bảng chính lưu thông tin di sản (không cần dịch)
CREATE TABLE heritages (
    id SERIAL PRIMARY KEY,
    
    year_built INT,
    year_ranked INT,
    ranking_type VARCHAR(100),
    
    -- Địa chỉ
    address VARCHAR(255),
    commune VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100),
    
    -- Ảnh đại diện
    image_url VARCHAR(500),
    
    -- Ghi chú
    notes TEXT,
    
    -- Ngôn ngữ gốc khi nhập
    original_lang VARCHAR(5) DEFAULT 'vi',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng lưu nội dung đa ngôn ngữ (4 ngôn ngữ: vi, km, en, zh)
CREATE TABLE heritage_translations (
    id SERIAL PRIMARY KEY,
    heritage_id INT REFERENCES heritages(id) ON DELETE CASCADE,
    lang VARCHAR(5) NOT NULL,       -- vi, km, en, zh
    
    name VARCHAR(255) NOT NULL,
    information TEXT,
    
    -- Audio được tạo tự động từ information
    audio_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(heritage_id, lang)
);

-- Bảng lưu nhiều ảnh (nếu cần)
CREATE TABLE heritage_images (
    id SERIAL PRIMARY KEY,
    heritage_id INT REFERENCES heritages(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: Add heritage_media table for multiple images and YouTube links
-- Run this SQL in your PostgreSQL database


CREATE TABLE IF NOT EXISTS heritage_media (
  id SERIAL PRIMARY KEY,
  heritage_id INTEGER NOT NULL REFERENCES heritages(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'youtube')),
  media_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_heritage_media_heritage_id ON heritage_media(heritage_id);
CREATE INDEX idx_heritage_media_type ON heritage_media(media_type);
CREATE INDEX idx_heritage_media_order ON heritage_media(heritage_id, display_order);

-- Add comment for documentation
COMMENT ON TABLE heritage_media IS 'Stores multiple images and YouTube video links for each heritage site';
COMMENT ON COLUMN heritage_media.media_type IS 'Type of media: image (gallery photos) or youtube (video links)';
COMMENT ON COLUMN heritage_media.display_order IS 'Order in which media should be displayed';

-- Indexes
CREATE INDEX idx_translations_heritage_lang ON heritage_translations(heritage_id, lang);
CREATE INDEX idx_images_heritage ON heritage_images(heritage_id);
CREATE INDEX idx_heritages_province ON heritages(province);