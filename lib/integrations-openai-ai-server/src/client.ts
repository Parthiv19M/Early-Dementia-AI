import OpenAI from "openai";

const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy";
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "http://localhost:3000";

export const openai = new OpenAI({
  apiKey,
  baseURL,
});
