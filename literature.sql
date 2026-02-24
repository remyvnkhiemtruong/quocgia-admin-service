CREATE TABLE IF NOT EXISTS literature (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),

    content TEXT,
    genre VARCHAR(255),
    period VARCHAR(255),

    image_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_literature_updated_at
BEFORE UPDATE ON literature
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();