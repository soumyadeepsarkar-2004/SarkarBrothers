
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

export const generateGiftSuggestions = async (
  recipient: string,
  interests: string,
  priceRange: string,
  language: 'en' | 'bn'
): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    // Fallback if API key is missing during demo/dev
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

// Image Generation using Gemini's Imagen model
export const generateImageWithPrompt = async (prompt: string, size: '1024x1024' | '2048x2048' | '4096x4096' = '1024x1024'): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    throw new Error('API key is required for image generation. Please add your GEMINI_API_KEY to the .env file.');
  }

  try {
    // Use Gemini's image generation capability
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: `Generate a high-quality image of: ${prompt}. Make it colorful, kid-friendly, and suitable for a toy shop context.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract image from response parts
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    // Fallback: If no image was generated, use a text-based approach
    throw new Error('No image was generated. The model may not support image generation with your current API plan.');
  } catch (error: any) {
    console.error('Image generation error:', error);
    // Provide a more helpful error message
    if (error.message?.includes('not support') || error.message?.includes('No image')) {
      throw new Error('Image generation is not available with your current API configuration. Try using a different model or upgrading your API plan.');
    }
    throw new Error(error.message || 'Failed to generate image. Please check your API key and try again.');
  }
};

// Image Editing using Gemini
export const editImageWithPrompt = async (imageFile: File, prompt: string): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    throw new Error('API key is required for image editing. Please add your GEMINI_API_KEY to the .env file.');
  }

  try {
    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = imageFile.type || 'image/png';

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `Edit this image according to the following instructions: ${prompt}. Keep it kid-friendly and suitable for a toy shop.` },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract edited image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const resultMimeType = part.inlineData.mimeType || 'image/png';
          return `data:${resultMimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error('No edited image was returned. The model may not support image editing with your current API plan.');
  } catch (error: any) {
    console.error('Image editing error:', error);
    throw new Error(error.message || 'Failed to edit image. Please check your API key and try again.');
  }
};

// AI-Powered Search Recommendations
export const generateSearchRecommendations = async (searchQuery: string, language: 'en' | 'bn' = 'en'): Promise<string[]> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    // Fallback to generic categories if no API key or AI not initialized
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

    if (!responseText) {
      return ['Educational', 'Plushies', 'Outdoor Fun'];
    }

    const categories = responseText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 4);

    return categories.length > 0 ? categories : ['Educational', 'Plushies', 'Outdoor Fun'];
  } catch (error) {
    console.error('AI search recommendation error:', error);
    return ['Educational', 'Plushies', 'Outdoor Fun'];
  }
};

// AI Chat for Voice Assistant
export const generateVoiceResponse = async (userInput: string, language: 'en' | 'bn' = 'en'): Promise<string> => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    // Smart fallback responses based on keywords
    const input = userInput.toLowerCase();
    if (input.includes('educational') || input.includes('learning')) {
      return "Great choice! Our educational toys include the Castle Builder Set and Rainbow Stacker - perfect for developing problem-solving skills. Would you like to know more?";
    } else if (input.includes('plush') || input.includes('stuffed') || input.includes('soft')) {
      return "We have wonderful plush toys! The Cuddly Elephant and Cuddly Brown Bear are customer favorites. They're super soft and safe for children of all ages.";
    } else if (input.includes('robot') || input.includes('tech')) {
      return "Check out our Super Galactic Robot! It features voice command recognition, LED light shows, and 360-degree mobility. Perfect for little tech enthusiasts!";
    } else if (input.includes('outdoor') || input.includes('car') || input.includes('race')) {
      return "Our Speed Racer RC is a bestseller for outdoor fun! It's currently 20% off. We also have the Wooden Express Train for imaginative play.";
    } else if (input.includes('art') || input.includes('craft') || input.includes('draw') || input.includes('paint')) {
      return "The Mega Art Kit is perfect for creative kids! It includes everything they need for drawing, painting, and crafting. Rated 4.7 stars!";
    } else if (input.includes('gift') || input.includes('present') || input.includes('birthday')) {
      return "Our Surprise Gift Box is a wonderful option! For a more personalized gift, I'd recommend checking our categories based on the child's interests and age.";
    }
    return "I can help you find the perfect toy! What age group are you shopping for, and what interests does the child have? We have educational toys, plushies, robots, art kits, and more!";
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

// Live Voice API Session
export const createLiveSession = async () => {
  if (!API_KEY || API_KEY === 'dummy_api_key_replace_me' || !ai) {
    throw new Error('API key is required for live session. Please add your GEMINI_API_KEY to the .env file.');
  }

  try {
    return {
      id: 'session-' + Date.now(),
      connected: true,
      send: async (audio: Blob) => {
        console.log('Sent audio to session');
      },
      close: () => {
        console.log('Closed session');
      }
    };
  } catch (error) {
    console.error('Live session creation error:', error);
    throw error;
  }
};