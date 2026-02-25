
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

try {
  if (API_KEY && API_KEY !== 'dummy_api_key_replace_me') {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch (error) {
  console.error('Failed to initialize GoogleGenAI:', error);
  ai = null;
}

// ── Text Generation (GiftBot) ────────────────────────────────────────────────

export const generateGiftSuggestions = async (
  recipient: string,
  interests: string,
  priceRange: string,
  language: 'en' | 'bn'
): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    return language === 'bn'
      ? `আমি নিশ্চিতভাবে ${recipient}-এর জন্য উপহার খুঁজতে সাহায্য করতে পারি! ${interests}-এর উপর ভিত্তি করে, আমি আমাদের শিক্ষামূলক বা আউটডোর ফান বিভাগটি দেখার পরামর্শ দেব। 🎁`
      : `I can definitely help you find a gift for ${recipient}! Based on interests in ${interests}, I'd recommend looking at our Educational or Outdoor Fun categories. 🎁`;
  }

  try {
    const prompt = `You are GiftBot, a helpful assistant for a toy shop named ToyWonder. 
    The user is looking for a gift for: ${recipient}.
    Interests: ${interests}.
    Price Range: ${priceRange}.
    
    Recommend 2-3 specific toys from typical toy categories.
    Reply strictly in ${language === 'bn' ? 'Bengali (Bangla)' : 'English'}.
    Keep the tone cheerful, helpful, and concise (under 100 words). Use emojis.
    Mention at least one product name from this list if relevant: Speed Racer RC, Castle Builder Set, Cuddly Elephant, Mega Art Kit, Super Galactic Robot.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text;
    return text || (language === 'bn' ? "দুঃখিত, আমি এই মুহূর্তে কোন আইডিয়া পাচ্ছি না। 🎁" : "I'm having a little trouble thinking of ideas right now. 🎁");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'bn'
      ? "আমার সংযোগে সমস্যা হচ্ছে। কিন্তু আমি বাজি ধরে বলতে পারি তারা আমাদের 'নতুন কালেকশন' পছন্দ করবে! 🎨"
      : "I'm having a little trouble connecting to my brain right now. 🤖 But I bet they'd love something from our 'New Arrivals' section!";
  }
};

// ── Image Generation ─────────────────────────────────────────────────────────

/**
 * Helper: Try Imagen 3 model first (best quality, works on free tier).
 */
const tryImagenGenerate = async (prompt: string): Promise<string | null> => {
  if (!ai) return null;
  try {
    const response = await (ai.models as any).generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: `${prompt}. Colorful, kid-friendly, toy shop style.`,
      config: { numberOfImages: 1 },
    });
    const images = response?.generatedImages;
    if (images && images.length > 0) {
      const img = images[0].image;
      if (img?.imageBytes) {
        return `data:image/png;base64,${img.imageBytes}`;
      }
    }
    return null;
  } catch (e: any) {
    console.warn('Imagen 3 generation failed:', e.message || e);
    return null;
  }
};

/**
 * Helper: Fallback to Gemini native image output (gemini-2.0-flash-exp).
 */
const tryGeminiImageGenerate = async (prompt: string): Promise<string | null> => {
  if (!ai) return null;

  const models = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
  ];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate a high-quality image of: ${prompt}. Make it colorful, kid-friendly, and suitable for a toy shop.`,
        config: { responseModalities: ['TEXT', 'IMAGE'] as any },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (e: any) {
      console.warn(`Gemini image gen with ${model} failed:`, e.message || e);
    }
  }
  return null;
};

/**
 * Helper: Free AI image generation via Pollinations.ai (no API key needed).
 */
const tryPollinationsGenerate = async (prompt: string, width: number, height: number): Promise<string> => {
  const encoded = encodeURIComponent(`${prompt}, colorful kids toy illustration, bright cheerful, white background`);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${Date.now()}`;

  // Verify the URL actually returns an image
  const res = await fetch(url);
  if (!res.ok) throw new Error('Pollinations API returned an error');
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Did not receive an image');

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateImageWithPrompt = async (
  prompt: string,
  size: '1024x1024' | '2048x2048' | '4096x4096' = '1024x1024'
): Promise<string> => {
  const [w, h] = size.split('x').map(Number);

  // Strategy 1: Imagen 3 API (Google)
  if (ai) {
    const imagenResult = await tryImagenGenerate(prompt);
    if (imagenResult) return imagenResult;

    // Strategy 2: Gemini native image output
    const geminiResult = await tryGeminiImageGenerate(prompt);
    if (geminiResult) return geminiResult;
  }

  // Strategy 3: Pollinations.ai (free, no API key needed)
  try {
    return await tryPollinationsGenerate(prompt, Math.min(w, 1024), Math.min(h, 1024));
  } catch (e: any) {
    console.error('Pollinations fallback also failed:', e);
  }

  throw new Error(
    'Image generation failed. Please check your internet connection and try again.'
  );
};

// ── Image Editing ────────────────────────────────────────────────────────────

/**
 * Helper: Try Imagen editImage API.
 */
const tryImagenEdit = async (base64: string, mimeType: string, prompt: string): Promise<string | null> => {
  if (!ai) return null;
  try {
    const response = await (ai.models as any).editImage({
      model: 'imagen-3.0-capability-001',
      prompt: `${prompt}. Keep it kid-friendly and suitable for a toy shop.`,
      image: { imageBytes: base64, mimeType },
    });
    const images = response?.generatedImages;
    if (images && images.length > 0 && images[0].image?.imageBytes) {
      return `data:image/png;base64,${images[0].image.imageBytes}`;
    }
    return null;
  } catch (e: any) {
    console.warn('Imagen edit failed:', e.message || e);
    return null;
  }
};

/**
 * Helper: Use Gemini multimodal (send image + text, get image back).
 */
const tryGeminiImageEdit = async (base64: string, mimeType: string, prompt: string): Promise<string | null> => {
  if (!ai) return null;

  const models = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
  ];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: `Edit this image: ${prompt}. Keep it kid-friendly and suitable for a toy shop.` },
            ],
          },
        ],
        config: { responseModalities: ['TEXT', 'IMAGE'] as any },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const resMime = part.inlineData.mimeType || 'image/png';
            return `data:${resMime};base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (e: any) {
      console.warn(`Gemini edit with ${model} failed:`, e.message || e);
    }
  }
  return null;
};

export const editImageWithPrompt = async (imageFile: File, prompt: string): Promise<string> => {
  // Convert file to base64
  const arrayBuffer = await imageFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  const mimeType = imageFile.type || 'image/png';

  // Strategy 1: Imagen edit API
  if (ai) {
    const imagenResult = await tryImagenEdit(base64, mimeType, prompt);
    if (imagenResult) return imagenResult;

    // Strategy 2: Gemini multimodal edit
    const geminiResult = await tryGeminiImageEdit(base64, mimeType, prompt);
    if (geminiResult) return geminiResult;
  }

  // Strategy 3: Re-generate a new image from the prompt via Pollinations
  try {
    return await tryPollinationsGenerate(`${prompt}, toy illustration`, 1024, 1024);
  } catch (e: any) {
    console.error('Pollinations edit fallback also failed:', e);
  }

  throw new Error('Image editing failed. Please check your internet connection and try again.');
};

// ── AI-Powered Search Recommendations ────────────────────────────────────────

export const generateSearchRecommendations = async (searchQuery: string, language: 'en' | 'bn' = 'en'): Promise<string[]> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    return ['Educational', 'Plushies', 'Outdoor Fun'];
  }

  try {
    const prompt = `You are an intelligent toy shop assistant. A customer searched for: "${searchQuery}".
    
    Based on this search query, identify the top 3-4 most relevant toy categories from this list:
    [Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts]
    
    Consider:
    - Direct matches (e.g., "robot" → Robots)
    - Related concepts (e.g., "learning" → Educational, "stuffed animal" → Plushies)
    - Age-appropriate categories (e.g., "baby" → Plushies, "teenager" → Robots)
    - Activity types (e.g., "painting" → Arts & Crafts)
    
    Return ONLY the category names separated by commas, ordered by relevance.
    Example: "Robots, Educational, Outdoor Fun"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) return ['Educational', 'Plushies', 'Outdoor Fun'];

    const categories = responseText.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 4);
    return categories.length > 0 ? categories : ['Educational', 'Plushies', 'Outdoor Fun'];
  } catch (error) {
    console.error('AI search recommendation error:', error);
    return ['Educational', 'Plushies', 'Outdoor Fun'];
  }
};

// ── Voice Assistant AI Chat ──────────────────────────────────────────────────

export const generateVoiceResponse = async (userInput: string, language: 'en' | 'bn' = 'en'): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    // Smart fallback responses based on keywords
    const input = userInput.toLowerCase();
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hey there! 👋 Welcome to ToyWonder! I can help you find the perfect toy. What are you looking for today?";
    } else if (input.includes('educational') || input.includes('learning') || input.includes('study')) {
      return "Great choice! Our educational toys include the Castle Builder Set (₹7,999) and Rainbow Stacker (₹1,199) - perfect for developing problem-solving skills. Would you like to know more?";
    } else if (input.includes('plush') || input.includes('stuffed') || input.includes('soft') || input.includes('teddy')) {
      return "We have wonderful plush toys! The Cuddly Elephant (₹1,699) and Cuddly Brown Bear (₹2,199) are customer favorites. They're super soft and safe for all ages! 🧸";
    } else if (input.includes('robot') || input.includes('tech') || input.includes('electronic')) {
      return "Check out our Super Galactic Robot (₹3,999)! It features voice command recognition, LED light shows, and 360° mobility. Perfect for little tech enthusiasts! 🤖";
    } else if (input.includes('outdoor') || input.includes('car') || input.includes('race') || input.includes('rc')) {
      return "Our Speed Racer RC (₹3,499) is a bestseller for outdoor fun! Currently 20% off. We also have the Wooden Express Train (₹2,499) for imaginative play. 🏎️";
    } else if (input.includes('art') || input.includes('craft') || input.includes('draw') || input.includes('paint') || input.includes('color')) {
      return "The Mega Art Kit (₹2,999) is perfect for creative kids! It includes everything for drawing, painting, and crafting. Rated 4.7 stars! 🎨";
    } else if (input.includes('gift') || input.includes('present') || input.includes('birthday') || input.includes('surprise')) {
      return "Our Surprise Gift Box (₹1,699) is a wonderful option! For a more personalized gift, tell me the child's age and interests and I'll recommend the perfect toy! 🎁";
    } else if (input.includes('cheap') || input.includes('budget') || input.includes('affordable') || input.includes('under')) {
      return "We have great budget-friendly options! The Rainbow Stacker (₹1,199), Cuddly Elephant (₹1,699), and Surprise Gift Box (₹1,699) are all under ₹2,000! 💰";
    } else if (input.includes('best') || input.includes('popular') || input.includes('recommend') || input.includes('top')) {
      return "Our top picks right now: 🌟 Castle Builder Set (4.8★), Super Galactic Robot (4.6★), and Mega Art Kit (4.7★). All are customer favorites! Which category interests you?";
    } else if (input.includes('price') || input.includes('cost') || input.includes('how much')) {
      return "Our prices range from ₹1,199 (Rainbow Stacker) to ₹7,999 (Castle Builder Set). Free shipping on orders above ₹2,000! What's your budget?";
    } else if (input.includes('ship') || input.includes('deliver') || input.includes('order')) {
      return "We offer free shipping on orders above ₹2,000! Standard delivery takes 3-5 days. You can also order via WhatsApp for a more personal experience. 📦";
    } else if (input.includes('thank') || input.includes('bye') || input.includes('goodbye')) {
      return "You're welcome! Happy toy shopping! 🎉 Feel free to come back anytime. Have a wonderful day!";
    }
    return "I can help you find the perfect toy! 🎮 We have educational toys, plushies, robots, art kits, RC cars, and gift sets. What age group are you shopping for?";
  }

  try {
    const prompt = `You are a friendly voice assistant for ToyWonder, a children's toy shop. 
    The customer said: "${userInput}"
    
    Available products: Speed Racer RC (₹3,499, Outdoor Fun), Castle Builder Set (₹7,999, Educational), 
    Cuddly Elephant (₹1,699, Plushies), Mega Art Kit (₹2,999, Arts & Crafts), 
    Super Galactic Robot (₹3,999, Robots), Wooden Express Train (₹2,499, Outdoor Fun),
    Cuddly Brown Bear (₹2,199, Plushies), Rainbow Stacker (₹1,199, Educational), 
    Surprise Gift Box (₹1,699, Gifts).
    
    Give a helpful, concise response (under 60 words). Be warm and enthusiastic.
    Recommend specific products when relevant. Reply in ${language === 'bn' ? 'Bengali' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || "I'd love to help you find the perfect toy! Could you tell me more about what you're looking for?";
  } catch (error) {
    console.error('Voice response error:', error);
    return "I'm having a little trouble right now. Try browsing our categories - we have Educational, Plushies, Outdoor Fun, Arts & Crafts, and Robots!";
  }
};