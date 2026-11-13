import { GoogleGenAI, Type } from "@google/genai";

export async function generateAITripItinerary(ai: GoogleGenAI, params: {
  origin: string;
  destination: string;
  duration: string;
  travelers: number;
  budget: string;
  interests: string[];
  transportMode: string;
}) {
  const { origin, destination, duration, travelers, budget, interests, transportMode } = params;

  const systemInstruction = `You are the AI Trip Genie, an expert travel architect for SUPERAI MAPS. 
Your goal is to design immersive, efficient, and memorable travel itineraries.
You have access to global geospatial data and local knowledge.

Output a structured JSON itinerary with day-by-day activities, including coordinates (lat/lng) for each major stop.
Ensure the route is logical and minimizes travel time.
Include "hidden gems" that match the user's interests.

Response Format:
{
  "title": "Trip Title",
  "description": "Brief overview",
  "totalDistance": "Estimated km",
  "totalDuration": "Estimated travel time",
  "days": [
    {
      "day": 1,
      "theme": "Day Theme",
      "activities": [
        {
          "time": "09:00",
          "locationName": "Place Name",
          "description": "Activity description",
          "lat": number,
          "lng": number,
          "type": "sightseeing|dining|rest|activity"
        }
      ]
    }
  ]
}`;

  const prompt = `Plan a trip from ${origin} to ${destination} for ${duration}. 
Number of travelers: ${travelers}. 
Budget: ${budget}. 
Interests: ${interests.join(', ')}. 
Transport Mode: ${transportMode}.

Provide a detailed itinerary with coordinates for each stop so I can render them on a map.`;

  const modelsToTry = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              totalDistance: { type: Type.STRING },
              totalDuration: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.NUMBER },
                    theme: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          locationName: { type: Type.STRING },
                          description: { type: Type.STRING },
                          lat: { type: Type.NUMBER },
                          lng: { type: Type.NUMBER },
                          type: { type: Type.STRING }
                        },
                        required: ["time", "locationName", "description", "lat", "lng", "type"]
                      }
                    }
                  },
                  required: ["day", "theme", "activities"]
                }
              }
            },
            required: ["title", "description", "days"]
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[MapsTripGenie] Model ${model} failed:`, err?.message || err);
    }
  }

  throw new Error(lastError?.message || "Failed to generate itinerary");
}
