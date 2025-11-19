import { GoogleGenAI, Type } from "@google/genai";
import { Subscription, AnalysisResult, Category } from "../types";

let aiClientInstance: GoogleGenAI | null = null;
let hasWarned = false;

const getAIClient = () => {
  if (aiClientInstance) return aiClientInstance;

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    if (!hasWarned) {
      console.warn("API Key is missing. AI features will be disabled. Please provide process.env.API_KEY");
      hasWarned = true;
    }
    return null;
  }

  try {
    aiClientInstance = new GoogleGenAI({ apiKey });
    return aiClientInstance;
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
    return null;
  }
};

export const analyzeSubscriptions = async (subscriptions: Subscription[]): Promise<AnalysisResult | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  if (subscriptions.length === 0) return null;

  const subsData = subscriptions.map(s => ({
    name: s.name,
    cost: s.price,
    currency: s.currency,
    frequency: s.cycle,
    category: s.category
  }));

  const prompt = `
    Analyze the following subscription data for a user. 
    The data may contain different currencies (USD, EUR, TRY).
    1. Calculate the equivalent total monthly cost (approximate yearly by dividing by 12, weekly by multiplying by 4). Return the total as a single number assuming 1 USD = 34 TRY and 1 EUR = 36 TRY if conversion is needed for a combined total, or just return the main currency total.
    2. Provide a brief, friendly insight about their spending habits.
    3. Provide 3 specific, actionable short tips to save money or manage subscriptions better based on this specific list.
    
    Data: ${JSON.stringify(subsData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalMonthly: { type: Type.NUMBER, description: "Total estimated monthly cost in the user's dominant currency" },
            totalYearly: { type: Type.NUMBER },
            insight: { type: Type.STRING },
            savingsTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["totalMonthly", "totalYearly", "insight", "savingsTips"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing subscriptions:", error);
    return null;
  }
};

export const suggestCategory = async (name: string): Promise<Category> => {
  const ai = getAIClient();
  if (!ai) return Category.OTHER;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Categorize the subscription service "${name}" into one of these exact categories: Entertainment, Utilities, Software, Fitness, Food, Other. Return only the category name.`,
    });
    
    const text = response.text?.trim();
    // Simple mapping check
    if (text && Object.values(Category).includes(text as Category)) {
      return text as Category;
    }
    return Category.OTHER;
  } catch (e) {
    console.warn("AI categorization failed, falling back to OTHER.");
    return Category.OTHER;
  }
}