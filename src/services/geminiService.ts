import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, UploadedFile } from "../types";

function getAI() {
  // Use API_KEY if available (from selection dialog), fallback to GEMINI_API_KEY
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure GEMINI_API_KEY or API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeAssets(reference: UploadedFile, character: UploadedFile): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Analyze these two assets. The first is a motion reference (video or image), and the second is a character key asset. Extract the character's visual identity, the artistic style, the scene environment, the specific kinetic action being performed, and any text visible. Return the result in JSON format.",
          },
          {
            inlineData: {
              mimeType: reference.type,
              data: reference.data.split(",")[1],
            },
          },
          {
            inlineData: {
              mimeType: character.type,
              data: character.data.split(",")[1],
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterDescription: { type: Type.STRING },
          style: { type: Type.STRING },
          scene: { type: Type.STRING },
          action: { type: Type.STRING },
          text: { type: Type.STRING },
        },
        required: ["characterDescription", "style", "scene", "action", "text"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function optimizePrompt(character: UploadedFile, instruction: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: instruction },
          {
            inlineData: {
              mimeType: character.type,
              data: character.data.split(",")[1],
            },
          },
        ],
      },
    ],
  });

  return response.text;
}

export async function generateBaseFrame(character: UploadedFile, prompt: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: character.type,
            data: character.data.split(",")[1],
          },
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}

export async function editFrame(baseImage: string, editPrompt: string): Promise<string> {
  const ai = getAI();
  const [header, data] = baseImage.split(",");
  const mimeType = header.split(":")[1].split(";")[0];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: editPrompt },
        {
          inlineData: {
            mimeType,
            data,
          },
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}

export async function generateVideo(base64Data: string, mimeType: string, prompt: string): Promise<string> {
  const ai = getAI();
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  let operation = await ai.models.generateVideos({
    model: "veo-3.1-lite-generate-preview",
    prompt: prompt,
    image: {
      imageBytes: base64Data,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: "1080p",
      aspectRatio: "16:9",
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed: No download link found");
  }

  const response = await fetch(downloadLink, {
    method: "GET",
    headers: {
      "x-goog-api-key": apiKey!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
