// src/services/apiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Agent } from "../types"; // Assuming your types are in src/types.ts

// Module-level instances for the SDKs
let geminiAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

/**
 * Initializes the Gemini Service with an API key.
 * @param apiKey The Google AI Studio API key.
 */
export const initGeminiService = (apiKey: string) => {
  if (!apiKey) {
    console.error("Attempted to initialize Gemini Service with an empty API key.");
    geminiAI = null;
    return;
  }
  geminiAI = new GoogleGenerativeAI(apiKey);
};

/**
 * Initializes the OpenAI Service with an API key.
 * @param apiKey The OpenAI API key.
 */
export const initOpenAIService = (apiKey: string) => {
  if (!apiKey) {
    console.error("Attempted to initialize OpenAI Service with an empty API key.");
    openai = null;
    return;
  }
  // This setup is required for browser environments to prevent a default credential check.
  openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

/**
 * Processes a prompt using the model specified in the agent.
 * @param agent The agent containing the prompt and selected model.
 * @param documentContent The context document.
 * @returns The string response from the selected API.
 */
export const processAgentPrompt = async (agent: Agent, documentContent: string): Promise<string> => {
  const [provider, modelName] = agent.model.split('/');

  const fullPrompt = `DOCUMENT CONTENT:\n---\n${documentContent}\n---\n\nTASK:\n${agent.prompt}`;

  if (provider === 'gemini') {
    if (!geminiAI) throw new Error("Gemini API key is not configured.");
    try {
      const model = geminiAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error with Gemini API:", error);
      if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('403'))) {
        throw new Error('The provided Gemini API key is not valid. Please check it.');
      }
      throw new Error("Failed to get response from Gemini API.");
    }
  }

  if (provider === 'openai') {
    if (!openai) throw new Error("OpenAI API key is not configured.");
    try {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: fullPrompt }],
      });
      return completion.choices[0]?.message?.content ?? "";
    } catch (error) {
      console.error("Error with OpenAI API:", error);
       if (error instanceof OpenAI.APIError && error.status === 401) {
        throw new Error('The provided OpenAI API key is not valid. Please check it.');
      }
      throw new Error("Failed to get response from OpenAI API.");
    }
  }

  throw new Error(`Unsupported provider: ${provider}`);
};


/**
 * Performs OCR using the Gemini Vision model.
 * Note: For simplicity, OCR is kept to Gemini as in the original code.
 * @param imageDataBase64 The base64 encoded image data.
 * @returns The transcribed text.
 */
export const performOcr = async (imageDataBase64: string): Promise<string> => {
  if (!geminiAI) {
    throw new Error("Gemini API key is not configured for OCR. Please set it first.");
  }

  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageDataBase64 } };
  const textPart = { text: "Perform OCR on this image. Extract all text accurately." };
  
  try {
    const model = geminiAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Vision model
    const result = await model.generateContent([textPart, imagePart]);
    return result.response.text();
  } catch (error) {
    console.error("Error performing OCR:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('403'))) {
        throw new Error('The provided Gemini API key is not valid. Please check it.');
    }
    throw new Error("Failed to perform OCR with Gemini API.");
  }
};
