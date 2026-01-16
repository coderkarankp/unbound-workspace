
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeDocument = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Please provide a high-level professional summary of the following document. 
    Focus on key achievements, core competencies, and professional narrative. 
    Use a clean, executive style with bullet points for key takeaways. \n\n${text}`,
    config: {
      temperature: 0.7,
    }
  });
  return response.text;
};

export const performOCR = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Extract all text from this document. CRITICAL: Preserve the visual hierarchy. Maintain all bullet points and list structures exactly as they appear." }
      ]
    }
  });
  return response.text;
};

export const extractTableData = async (base64Data: string, mimeType: string = 'application/pdf') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Find all tables in this document. Extract them and format the output as a valid CSV. If multiple tables exist, separate them with a double newline. Only provide the CSV data." }
      ]
    }
  });
  return response.text;
};

export const extractJSON = async (base64Data: string, mimeType: string = 'application/pdf') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Extract structured data from this document. Include title, author, key dates, main topics, and a structured list of sections." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          dates: { type: Type.ARRAY, items: { type: Type.STRING } },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          sections: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["heading"]
            }
          }
        }
      }
    }
  });
  return response.text;
};

export const scanBarcodes = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Scan this document and find all barcodes, QR codes, or data matrices. For each one detected, identify: 1. Symbology/Type, 2. Decoded Value. Format as a markdown list." }
      ]
    }
  });
  return response.text;
};

export const reconstructAsWord = async (base64Data: string, mimeType: string = 'application/pdf') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Reconstruct this document into a structured text format suitable for a Word processor. Preserve alignment and professional hierarchy." }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  return response.text;
};

export const translateText = async (text: string, targetLanguage: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following document to ${targetLanguage}. Preserve formatting. \n\n${text}`,
  });
  return response.text;
};
