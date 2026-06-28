
import { GoogleGenAI } from "@google/genai";
import { products } from '../data';
import { Product } from '../types';

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

// ── Product Catalog for AI Context ───────────────────────────────────────────

const buildProductCatalog = (): string => {
  return products.map(p => {
    const parts = [`${p.name} (₹${p.price}${p.originalPrice ? `, was ₹${p.originalPrice}` : ''})`,
    `Category: ${p.category}`,
    `Rating: ${p.rating}★ (${p.reviews} reviews)`,
    `Stock: ${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}`];
    if (p.badge) parts.push(`Badge: ${p.badge}`);
    if (p.description) parts.push(`Description: ${p.description}`);
    return parts.join(' | ');
  }).join('\n');
};

const PRODUCT_CATALOG = buildProductCatalog();

const SYSTEM_PROMPT = `You are GiftBot, the friendly AI shopping assistant for SarkarBrothers — a cheerful, colorful children's toy shop.

YOUR ROLE:
- Help customers find the perfect toy or gift
- Answer questions about products, prices, categories, and availability
- Make personalized recommendations based on age, interests, budget, and occasion
- Be warm, enthusiastic, and concise (under 100 words per response)
- Use relevant emojis to keep the tone playful and kid-friendly

PRODUCT CATALOG:
${PRODUCT_CATALOG}

CATEGORIES: Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts

SHOP POLICIES:
- Free shipping on orders above ₹499
- Standard delivery: 3-5 business days
- Easy returns within 7 days
- Safe, BPA-free materials

RULES:
- Always recommend products FROM the catalog above — never invent products
- Mention specific product names and prices when recommending
- If a query is unrelated to toys/gifts, politely redirect to toy shopping
- If a product is out of stock, say so and suggest alternatives
- For gift queries, ask about the recipient's age and interests if not provided
- Keep responses concise, helpful, and action-oriented`;

// ── Chat Message Type ────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// ── Smart Local Fallback (no API key needed) ─────────────────────────────────

const localChatFallback = (message: string, language: 'en' | 'bn'): string => {
  const input = message.toLowerCase();
  const bn = language === 'bn';

  // Price-based queries
  const priceMatch = input.match(/under\s*₹?\s*(\d+)|below\s*₹?\s*(\d+)|budget\s*₹?\s*(\d+)|within\s*₹?\s*(\d+)/);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4]);
    const affordable = products.filter(p => p.price <= maxPrice && p.stock > 0).sort((a, b) => b.rating - a.rating);
    if (affordable.length > 0) {
      const top = affordable.slice(0, 3).map(p => `**${p.name}** (₹${p.price})`).join(', ');
      return bn ? `₹${maxPrice}-এর মধ্যে আমাদের সেরা পণ্য: ${top}! 🎁` : `Great options under ₹${maxPrice}: ${top}! 🎁`;
    }
    return bn ? `দুঃখিত, এই বাজেটে কোন পণ্য নেই।` : `Sorry, we don't have products in that budget range. Our most affordable option is the Rainbow Stacker at ₹1,199! 🌈`;
  }

  // Category-based matching
  const categoryKeywords: Record<string, string[]> = {
    'Educational': ['educational', 'learning', 'study', 'teach', 'school', 'brain', 'puzzle', 'build', 'castle', 'stack'],
    'Plushies': ['plush', 'stuffed', 'soft', 'teddy', 'bear', 'elephant', 'cuddly', 'hug', 'cute'],
    'Robots': ['robot', 'tech', 'electronic', 'galactic', 'mech', 'ai', 'smart', 'future'],
    'Outdoor Fun': ['outdoor', 'car', 'race', 'rc', 'remote', 'train', 'vehicle', 'speed', 'racer'],
    'Arts & Crafts': ['art', 'craft', 'draw', 'paint', 'color', 'creative', 'design', 'sketch'],
    'Gifts': ['gift', 'present', 'birthday', 'surprise', 'party', 'occasion', 'special'],
  };

  let matchedCategory: string | null = null;
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(k => input.includes(k)).length;
    if (matches > maxMatches) { maxMatches = matches; matchedCategory = cat; }
  }

  if (matchedCategory) {
    const catProducts = products.filter(p => p.category === matchedCategory && p.stock > 0)
      .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
    if (catProducts.length > 0) {
      const top = catProducts.slice(0, 3).map(p => `**${p.name}** (₹${p.price}, ${p.rating}★)`).join(', ');
      return bn
        ? `${matchedCategory} বিভাগে আমাদের সেরা পণ্য: ${top}! কোনটি পছন্দ হলো? 🎉`
        : `Great picks from ${matchedCategory}: ${top}! Want to know more about any of these? 🎉`;
    }
  }

  // Age-based queries
  if (input.match(/\b(baby|infant|toddler|1\s*year|2\s*year|0-2)\b/)) {
    return bn ? `ছোট বাচ্চাদের জন্য: **Rainbow Stacker** (₹1,199) এবং **Cuddly Elephant** (₹1,699) অসাধারণ! নিরাপদ এবং রঙিন। 🧸` : `For little ones, I'd recommend **Rainbow Stacker** (₹1,199) and **Cuddly Elephant** (₹1,699) — safe, colorful, and perfect for tiny hands! 🧸`;
  }
  if (input.match(/\b(3|4|5|6|preschool|kindergarten)\b.*\b(year|বছর)\b/) || input.match(/\b(year|বছর)\b.*\b(3|4|5|6)\b/)) {
    return bn ? `৩-৬ বছরের বাচ্চাদের জন্য: **Castle Builder Set** (₹7,999), **Mega Art Kit** (₹2,999), **Surprise Gift Box** (₹1,699)! 🏰🎨` : `For ages 3-6: **Castle Builder Set** (₹7,999) for problem-solving, **Mega Art Kit** (₹2,999) for creativity, or **Surprise Gift Box** (₹1,699) for delightful surprises! 🏰🎨`;
  }
  if (input.match(/\b(7|8|9|10|11|12|kid|older|school\s*age)\b/)) {
    return bn ? `বড় বাচ্চাদের জন্য: **Super Galactic Robot** (₹3,999), **Speed Racer RC** (₹3,499), **Medieval Castle** (₹3,899)! 🤖🏎️` : `For older kids: **Super Galactic Robot** (₹3,999) with voice commands, **Speed Racer RC** (₹3,499) for thrills, or **Medieval Castle** (₹3,899) for creative play! 🤖🏎️`;
  }

  // Greetings
  if (input.match(/\b(hi|hello|hey|howdy)\b/) || input.match(/(নমস্কার|হ্যালো|হাই)/)) {
    return bn ? `নমস্কার! 👋 আমি গিফটবট। আপনাকে কীভাবে সাহায্য করতে পারি? আমাদের কাছে শিক্ষামূলক খেলনা, প্লাশি, রোবট, আর্ট কিট এবং আরও অনেক কিছু আছে!` : `Hey there! 👋 Welcome to SarkarBrothers! I can help you find the perfect toy. We have educational toys, plushies, robots, art kits, RC cars, and gift sets. What are you looking for?`;
  }

  // Thank you / bye
  if (input.match(/\b(thank|bye|goodbye)\b/) || input.match(/(ধন্যবাদ|বিদায়)/)) {
    return bn ? `আপনাকে ধন্যবাদ! 🎉 SarkarBrothers-এ কেনাকাটা করায় খুশি হলাম। আবার আসবেন!` : `You're welcome! 🎉 Happy toy shopping at SarkarBrothers! Come back anytime!`;
  }

  // Bestsellers / popular
  if (input.match(/\b(best|popular|top|recommend|bestseller|trending)\b/)) {
    const bestSellers = products.filter(p => p.stock > 0).sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews)).slice(0, 3);
    const list = bestSellers.map(p => `**${p.name}** (₹${p.price}, ${p.rating}★)`).join(', ');
    return bn ? `আমাদের সেরা বিক্রিত পণ্য: ${list}! 🌟` : `Our top sellers right now: ${list}! 🌟 Would you like details on any of these?`;
  }

  // Shipping / delivery
  if (input.match(/\b(ship|deliver|order|return|refund)\b/)) {
    return bn ? `₹৪৯৯-এর উপরে অর্ডারে বিনামূল্যে ডেলিভারি! ৩-৫ কার্যদিবসে পৌঁছে যাবে। ৭ দিনের মধ্যে সহজ রিটার্ন। 📦` : `Free shipping on orders above ₹499! Standard delivery takes 3-5 business days. Easy returns within 7 days. You can also order via WhatsApp! 📦`;
  }

  // Default helpful response
  const topPicks = products.filter(p => p.stock > 0).sort((a, b) => b.rating - a.rating).slice(0, 3);
  const list = topPicks.map(p => `**${p.name}** (₹${p.price})`).join(', ');
  return bn
    ? `দুঃখিত, আমি ঠিক বুঝতে পারিনি। তবে আমাদের জনপ্রিয় পণ্যগুলো দেখুন: ${list}! আমাকে বয়স, বাজেট বা পছন্দের বিষয় জানান, আমি সেরা পণ্য খুঁজে দেব! 🎁`
    : `I'd love to help! Here are some popular picks: ${list}. Tell me the recipient's age, interests, or budget and I'll find the perfect match! 🎁`;
};

// ── Text Generation (GiftBot Chat) ──────────────────────────────────────────

export const generateGiftSuggestions = async (
  message: string,
  history: ChatMessage[],
  language: 'en' | 'bn'
): Promise<string> => {
  // If no API key, use smart local fallback
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    return localChatFallback(message, language);
  }

  try {
    // Build conversation contents for Gemini
    const langInstruction = language === 'bn' ? '\n\nIMPORTANT: Reply strictly in Bengali (Bangla) language.' : '';
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + langInstruction }] },
      { role: 'model', parts: [{ text: language === 'bn' ? "নমস্কার! 👋 আমি গিফটবট। আমাকে বলুন কীভাবে সাহায্য করতে পারি!" : "Hi there! 👋 I'm GiftBot, ready to help you find the perfect toy! What can I do for you today?" }] },
    ];

    // Add conversation history (last 10 exchanges to stay within context limits)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Add current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
    });

    const text = response.text?.trim();
    if (text && text.length > 0) return text;

    // Empty response — use local fallback instead of generic message
    return localChatFallback(message, language);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // On API error, still try to give a useful response via local fallback
    return localChatFallback(message, language);
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
 * Returns the image URL directly — validated via Image element preload.
 */
const tryPollinationsGenerate = async (prompt: string, width: number, height: number): Promise<string> => {
  const encoded = encodeURIComponent(`${prompt}, colorful kids toy illustration, bright cheerful, white background`);
  const clampedW = Math.min(width, 1024);
  const clampedH = Math.min(height, 1024);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${clampedW}&height=${clampedH}&nologo=true&seed=${Date.now()}`;

  // Validate URL loads as an image using an Image element
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const img = new window.Image();
    // Do NOT set crossOrigin — Pollinations may not support CORS headers,
    // but we only need to confirm the URL loads (we render via <img src>)
    img.onload = () => {
      if (!settled) { settled = true; resolve(url); }
    };
    img.onerror = () => {
      if (!settled) { settled = true; reject(new Error('Pollinations image failed to load')); }
    };
    img.src = url;
    // Timeout after 60 seconds (Pollinations generation can be slow on first call)
    setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('Image generation timed out')); }
    }, 60000);
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
    return await tryPollinationsGenerate(prompt, w, h);
  } catch (e: any) {
    console.error('Pollinations fallback also failed:', e);
  }

  throw new Error(
    'All image generation services are currently unavailable. Please try again in a moment.'
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
    return localChatFallback(userInput, language);
  }

  try {
    const prompt = `${SYSTEM_PROMPT}

The customer said (via voice): "${userInput}"

Give a helpful, concise response (under 60 words). Be warm and enthusiastic.
Recommend specific products with prices when relevant. Reply in ${language === 'bn' ? 'Bengali' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text?.trim();
    if (text && text.length > 0) return text;
    return localChatFallback(userInput, language);
  } catch (error) {
    console.error('Voice response error:', error);
    return localChatFallback(userInput, language);
  }
};

// ── Gemini Live API Voice Response ───────────────────────────────────────────

const LIVE_MODEL_ID = 'gemini-live-2.5-flash-preview';

export const generateVoiceResponseLive = async (userInput: string, language: 'en' | 'bn' = 'en'): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    return localChatFallback(userInput, language);
  }

  return new Promise<string>(async (resolve, reject) => {
    let session: any = null;
    let resolved = false;
    let aggregatedText = '';

    const cleanup = () => {
      try {
        session?.close?.();
      } catch {
      }
    };

    const finalize = (text?: string) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      const finalText = text?.trim();
      if (finalText) {
        resolve(finalText);
      } else {
        resolve(localChatFallback(userInput, language));
      }
    };

    const fail = (err: unknown) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(err);
    };

    const timeoutId = setTimeout(() => {
      finalize(aggregatedText);
    }, 18000);

    try {
      session = await (ai as any).live.connect({
        model: LIVE_MODEL_ID,
        config: {
          responseModalities: ['TEXT'],
        },
        callbacks: {
          onmessage: (event: any) => {
            if (resolved) return;
            if (event?.text) {
              aggregatedText += event.text;
            }
            if (event?.serverContent?.turnComplete) {
              clearTimeout(timeoutId);
              finalize(aggregatedText);
            }
          },
          onerror: (event: any) => {
            clearTimeout(timeoutId);
            fail(event?.error || new Error('Gemini Live connection error'));
          },
          onclose: () => {
            clearTimeout(timeoutId);
            if (!resolved) {
              finalize(aggregatedText);
            }
          },
        },
      });

      const langInstruction = language === 'bn'
        ? 'Reply strictly in Bengali language.'
        : 'Reply strictly in English language.';

      session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{
            text: `${SYSTEM_PROMPT}\n\n${langInstruction}\nCustomer said (voice): "${userInput}"\nKeep response concise (under 60 words) and include specific product suggestions with prices when relevant.`,
          }],
        }],
        turnComplete: true,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      fail(error);
    }
  });
};