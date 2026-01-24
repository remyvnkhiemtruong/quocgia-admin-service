// src/services/tts.service.js
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TTSService {
  constructor() {
    this.audioDir = path.join(__dirname, '../../uploads/audio');
    this.googleApiKey = process.env.GOOGLE_API_KEY;
    this.voiceRssApiKey = process.env.VOICERSS_API_KEY;

    // Voice config cho Google TTS
    this.googleVoiceConfig = {
      'vi': { languageCode: 'vi-VN', name: 'vi-VN-Standard-A', ssmlGender: 'FEMALE' },
      'km': { languageCode: 'km-KH', name: 'km-KH-Standard-A', ssmlGender: 'FEMALE' },
      'en': { languageCode: 'en-US', name: 'en-US-Standard-C', ssmlGender: 'FEMALE' },
      'zh': { languageCode: 'cmn-CN', name: 'cmn-CN-Standard-A', ssmlGender: 'FEMALE' },
    };

    // Language codes cho VoiceRSS
    this.voiceRssLangCodes = {
      'vi': 'vi-vn',
      'km': 'en-us',
      'en': 'en-us',
      'zh': 'zh-cn',
    };
  }

  async generateAudio(text, lang, filename) {
    if (!text) return null;

    // Đảm bảo thư mục tồn tại
    await fs.mkdir(this.audioDir, { recursive: true });

    console.log(`[TTS] Generating audio for ${lang}: "${text.substring(0, 50)}..."`);

    // Option 1: Google Cloud TTS
    if (this.googleApiKey) {
      console.log(`[TTS] Using Google Cloud TTS`);
      return this.googleTTS(text, lang, filename);
    }

    // Option 2: VoiceRSS
    if (this.voiceRssApiKey) {
      console.log(`[TTS] Using VoiceRSS`);
      return this.voiceRssTTS(text, lang, filename);
    }

    // Option 3: ResponsiveVoice (miễn phí cho non-commercial)
    console.log(`[TTS] Using ResponsiveVoice (free)`);
    return this.responsiveVoiceTTS(text, lang, filename);
  }

  // Google Cloud TTS (trả phí)
  async googleTTS(text, lang, filename) {
    const voice = this.googleVoiceConfig[lang] || this.googleVoiceConfig['en'];

    try {
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleApiKey}`,
        {
          input: { text },
          voice: voice,
          audioConfig: {
            audioEncoding: 'MP3',
            sampleRateHertz: 22050
          }
        }
      );

      const audioContent = Buffer.from(response.data.audioContent, 'base64');
      const mp3Filename = filename.replace('.wav', '.mp3');
      const filePath = path.join(this.audioDir, mp3Filename);
      await fs.writeFile(filePath, audioContent);

      console.log(`[TTS] ✓ Generated: ${mp3Filename}`);
      return `/uploads/audio/${mp3Filename}`;
    } catch (error) {
      console.error(`[TTS] Google TTS error:`, error.response?.data || error.message);
      throw error;
    }
  }

  // VoiceRSS TTS (free: 350 requests/day)
  async voiceRssTTS(text, lang, filename) {
    const langCode = this.voiceRssLangCodes[lang] || 'en-us';

    try {
      const response = await axios.get('https://api.voicerss.org/', {
        params: {
          key: this.voiceRssApiKey,
          hl: langCode,
          src: text.substring(0, 1000), // Limit text length
          c: 'MP3',
          f: '22khz_16bit_mono'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Check if response is error message (text) instead of audio
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text')) {
        throw new Error('VoiceRSS returned error: ' + Buffer.from(response.data).toString());
      }

      const mp3Filename = filename.replace('.wav', '.mp3');
      const filePath = path.join(this.audioDir, mp3Filename);
      await fs.writeFile(filePath, Buffer.from(response.data));

      console.log(`[TTS] ✓ Generated: ${mp3Filename}`);
      return `/uploads/audio/${mp3Filename}`;
    } catch (error) {
      console.error(`[TTS] VoiceRSS error:`, error.message);
      throw error;
    }
  }

  // ResponsiveVoice TTS (miễn phí cho non-commercial)
  async responsiveVoiceTTS(text, lang, filename) {
    // Map language to ResponsiveVoice voice names
    const voiceMap = {
      'vi': 'Vietnamese Female',
      'km': 'US English Female', // Khmer không hỗ trợ
      'en': 'US English Female',
      'zh': 'Chinese Female',
    };
    const voice = voiceMap[lang] || 'US English Female';

    try {
      const encodedText = encodeURIComponent(text.substring(0, 500));
      const encodedVoice = encodeURIComponent(voice);
      const url = `https://texttospeech.responsivevoice.org/v1/text:synthesize?text=${encodedText}&lang=${lang}&engine=g1&name=${encodedVoice}&pitch=0.5&rate=0.5&volume=1&key=FREE_DEMO_API_KEY&gender=female`;

      console.log(`[TTS] Requesting ResponsiveVoice for ${lang}...`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        }
      });

      if (response.data.byteLength < 1000) {
        throw new Error('Response too small, likely an error');
      }

      const mp3Filename = filename.replace('.wav', '.mp3');
      const filePath = path.join(this.audioDir, mp3Filename);
      await fs.writeFile(filePath, Buffer.from(response.data));

      console.log(`[TTS] ✓ Generated: ${mp3Filename} (${response.data.byteLength} bytes)`);
      return `/uploads/audio/${mp3Filename}`;
    } catch (error) {
      console.error(`[TTS] ResponsiveVoice error:`, error.message);
      
      // Last fallback: try StreamElements TTS
      return this.streamElementsTTS(text, lang, filename);
    }
  }

  // StreamElements TTS (fallback - miễn phí)
  async streamElementsTTS(text, lang, filename) {
    // StreamElements chỉ hỗ trợ một số voice
    const voiceMap = {
      'vi': 'vi-VN-Standard-A',
      'km': 'en-US-Standard-C',
      'en': 'en-US-Standard-C',
      'zh': 'cmn-CN-Standard-A',
    };
    const voice = voiceMap[lang] || 'en-US-Standard-C';

    try {
      const encodedText = encodeURIComponent(text.substring(0, 500));
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodedText}`;

      console.log(`[TTS] Trying StreamElements for ${lang}...`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (response.data.byteLength < 500) {
        throw new Error('Response too small');
      }

      const mp3Filename = filename.replace('.wav', '.mp3');
      const filePath = path.join(this.audioDir, mp3Filename);
      await fs.writeFile(filePath, Buffer.from(response.data));

      console.log(`[TTS] ✓ Generated: ${mp3Filename} (${response.data.byteLength} bytes)`);
      return `/uploads/audio/${mp3Filename}`;
    } catch (error) {
      console.error(`[TTS] StreamElements error:`, error.message);
      console.error(`[TTS] ✗ All TTS methods failed for ${lang}`);
      
      // Trả về null, không tạo file giả
      return null;
    }
  }
}

module.exports = new TTSService();