// src/services/translation.service.js
const axios = require('axios');

class TranslationService {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY;
  }

  async translate(text, sourceLang, targetLang) {
    if (!text || sourceLang === targetLang) {
      return text;
    }

    // Map language codes
    const langMap = {
      'vi': 'vi',
      'km': 'km',  // Khmer
      'en': 'en',
      'zh': 'zh-CN'  // Chinese Simplified
    };

    // Option 1: Google Cloud Translation API
    if (this.apiKey) {
      return this.googleTranslate(text, langMap[sourceLang] || sourceLang, langMap[targetLang] || targetLang);
    }

    // Option 2: Mock - cho development
    console.log(`[Mock Translation] ${sourceLang} → ${targetLang}`);
    return `[${targetLang.toUpperCase()}] ${text}`;
  }

  async googleTranslate(text, sourceLang, targetLang) {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        null,
        {
          params: {
            key: this.apiKey,
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text'
          }
        }
      );
      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Google Translate error:', error.message);
      throw error;
    }
  }
}

module.exports = new TranslationService();