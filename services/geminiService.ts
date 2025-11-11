import { GoogleGenerativeAI } from "@google/generative-ai";

let ai: GoogleGenerativeAI | null = null;

/**
 * Initializes the Gemini Service with an API key.
 * This must be called before using other service functions.
 * @param apiKey The Google AI Studio API key.
 */
export const initGeminiService = (apiKey: string) => {
  if (!apiKey) {
    console.error("Attempted to initialize Gemini Service with an empty API key.");
    ai = null; // Reset if an empty key is provided
    return;
  }
  ai = new GoogleGenerativeAI(apiKey);
};

export const processAgentPrompt = async (prompt: string, documentContent: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set it first.");
  }
  
  const fullPrompt = `
    DOCUMENT CONTENT:
    ---
    ${documentContent}
    ---

    TASK:
    ${prompt}
  `;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error processing agent prompt:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('The provided API key is not valid. Please check it and try again.');
    }
    throw new Error("Failed to get response from Gemini API.");
  }
};

export const performOcr = async (imageDataBase64: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set it first.");
  }

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageDataBase64,
    },
  };
  const textPart = {
    text: "Perform OCR on this image. Extract all text accurately, preserving the original line breaks and structure as much as possible. Do not describe the image, only return the transcribed text."
  };
  
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([textPart, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error performing OCR:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('The provided API key is not valid. Please check it and try again.');
    }
    throw new Error("Failed to perform OCR with Gemini API.");
  }
};
