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

-- Indexes
CREATE INDEX idx_translations_heritage_lang ON heritage_translations(heritage_id, lang);
CREATE INDEX idx_images_heritage ON heritage_images(heritage_id);
CREATE INDEX idx_heritages_province ON heritages(province);

-- =====================
-- Sample Data
-- =====================

INSERT INTO heritages (
    year_built, year_ranked, ranking_type,
    address, commune, district, province,
    image_url, notes, original_lang
) VALUES (
    1949, 2011, 'Quốc gia đặc biệt',
    'Ấp Cây Cui, xã Ninh Thạnh Lợi, tỉnh Bạc Liêu',
    'Xã Ninh Thạnh Lợi', 'Huyện Hồng Dân', 'Bạc Liêu',
    'https://example.com/image.jpg',
    'Di tích Quốc gia Đặc biệt',
    'vi'
);

-- 4 ngôn ngữ: Tiếng Việt, Khmer, English, 中文
INSERT INTO heritage_translations (heritage_id, lang, name, information, audio_url) VALUES
(1, 'vi', 'Di tích căn cứ Cái Chanh', 
 'Căn cứ Cái Chanh là nơi trú đóng và hoạt động của Xứ ủy Nam Bộ trong giai đoạn 1949-1954.', 
 '/uploads/audio/1_vi.wav'),

(1, 'km', 'តំបន់ប្រវត្តិសាស្ត្រ Cái Chanh', 
 'មូលដ្ឋាន Cái Chanh គឺជាកន្លែងស្នាក់ការ និងប្រតិបត្តិការរបស់គណៈកម្មាធិការភាគខាងត្បូង ក្នុងអំឡុងឆ្នាំ 1949-1954។', 
 '/uploads/audio/1_km.wav'),

(1, 'en', 'Cai Chanh Base Historical Site', 
 'Cai Chanh Base served as the headquarters of the Southern Region Committee during 1949-1954.', 
 '/uploads/audio/1_en.wav'),

(1, 'zh', '盖庄历史遗址', 
 '盖庄基地是1949年至1954年间南部地区委员会的总部所在地。', 
 '/uploads/audio/1_zh.wav');