
import { GoogleGenAI, Type } from "@google/genai";
import { OutreachDraft, Job, UserProfile } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOutreach = async (
  job: Job,
  profile: UserProfile
): Promise<OutreachDraft> => {
  const prompt = `
    Analyze this job posting and my professional profile to write a highly personalized, high-conversion outreach for LinkedIn and Email.
    
    JOB TITLE: ${job.title}
    COMPANY: ${job.company}
    JOB DESCRIPTION: ${job.description}
    
    MY PROFILE:
    NAME: ${profile.name}
    TARGET ROLE: ${profile.targetRole}
    RESUME/EXPERIENCE SUMMARY: ${profile.resumeText}

    TASK & CONSTRAINTS:
    
    1. LinkedIn DM:
       - STRICTURE: Must be under 120 words total.
       - Tone: Sharp, professional, and conversational.
       - Requirement: Reference a specific technical challenge or requirement mentioned in the description.
       - Call to Action: A low-friction question about team culture or a specific project.

    2. Professional Email:
       - STRICTURE: Must be under 180 words. Keep it punchy and impactful.
       - Subject Line: Use an engaging, curiosity-driven format that avoids generic "Application for..." templates. 
         Examples: "Quick question on ${job.company}'s ${job.category} strategy", "Potential fit for the ${job.title} opening", or "Idea for [Specific Requirement] at ${job.company}".
       - Format: Use clear, distinct paragraphs separated by DOUBLE line breaks (\n\n).
       - Structure: 
         - Hook: A sentence showing you've researched the company or the specific role.
         - Value Prop: 1-2 sentences directly mapping your top achievement to their biggest pain point.
         - CTA: A clear, respectful request for a brief conversation.

    OUTPUT FORMAT:
    Return a JSON object matching the requested schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          linkedinMessage: {
            type: Type.STRING,
            description: "The LinkedIn DM text. MUST be under 120 words."
          },
          emailSubject: {
            type: Type.STRING,
            description: "An engaging, non-generic subject line."
          },
          emailBody: {
            type: Type.STRING,
            description: "The Email Body text. Concise (under 180 words) with double line breaks."
          }
        },
        required: ["linkedinMessage", "emailSubject", "emailBody"]
      }
    }
  });

  const text = response.text || "{}";
  const data = JSON.parse(text);
  
  return {
    jobId: job.id,
    linkedinMessage: data.linkedinMessage,
    emailSubject: data.emailSubject,
    emailBody: data.emailBody
  };
};

export const chatWithAssistant = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

/**
 * Uses Search Grounding to find recent info about a company.
 * Model: gemini-3-flash-preview
 */
export const getCompanyInsights = async (companyName: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Give me a 2-sentence summary of ${companyName}'s current business focus and any major recent news from the last 6 months.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

/**
 * Uses Maps Grounding to provide context about a job location.
 * Model: gemini-2.5-flash
 */
export const getLocationInsights = async (location: string, userCoords?: { lat: number, lng: number }) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `What are some notable tech hubs or amenities near ${location}? Briefly mention why this area is good for tech professionals.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: userCoords ? {
        retrievalConfig: {
          latLng: {
            latitude: userCoords.lat,
            longitude: userCoords.lng
          }
        }
      } : undefined
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};
