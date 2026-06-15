import { GoogleGenAI } from "@google/genai";

/**
 * Checks if the GEMINI_API_KEY environment variable is configured.
 * In a Next.js environment, this should be set in `.env.local`.
 */
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not defined in your environment variables. " +
    "Please create a `.env.local` file at the root of the project and add: " +
    "GEMINI_API_KEY=your_gemini_api_key_here"
  );
}

/**
 * Singleton instance of the Google Gen AI SDK client.
 * Using a singleton pattern ensures we don't recreate the client on every request,
 * which is a recommended practice in Next.js serverless functions / API routes.
 */
export const aiClient = new GoogleGenAI({ apiKey });
