
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateGiftSuggestions = async (
  recipient: string,
  interests: string,
  priceRange: string,
  language: 'en' | 'bn'
): Promise<string> => {
  if (!process.env.API_KEY) {
    // Fallback if API key is missing during demo/dev
    return language === 'bn' 
      ? `আমি নিশ্চিতভাবে ${recipient}-এর জন্য উপহার খুঁজতে সাহায্য করতে পারি! ${interests}-এর উপর ভিত্তি করে, আমি আমাদের শিক্ষামূলক বা আউটডোর ফান বিভাগটি দেখার পরামর্শ দেব।`
      : `I can definitely help you find a gift for ${recipient}! Based on interests in ${interests}, I'd recommend looking at our Educational or Outdoor Fun categories.`;
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
      model: 'gemini-3-flash-preview',
      contents: [{ text: prompt }], // Corrected format
    });

    return response.text || (language === 'bn' ? "দুঃখিত, আমি এই মুহূর্তে কোন আইডিয়া পাচ্ছি না।" : "I'm having a little trouble thinking of ideas right now. 🎁");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'bn' 
      ? "আমার সংযোগে সমস্যা হচ্ছে। কিন্তু আমি বাজি ধরে বলতে পারি তারা আমাদের 'নতুন কালেকশন' পছন্দ করবে!"
      : "I'm having a little trouble connecting to my brain right now. 🤖 But I bet they'd love something from our 'New Arrivals' section!";
  }
};