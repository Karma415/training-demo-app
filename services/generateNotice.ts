import { GoogleGenerativeAI } from "@google/generative-ai";
import { HabitabilityRule } from "../types";

/**
 * Service to generate a formal 'Notice of Substandard Condition' using Gemini AI Tosh.
 */

export const generateNotice = async (complaint: string, rule: HabitabilityRule): Promise<string> => {
  console.log("Key exists:", !!import.meta.env.VITE_GEMINI_API_KEY);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `
    You are a San Francisco Tenant Advocate and Housing Rights Expert. 
    Your goal is to assist tenants in communicating professionally and legally with their landlords/management.
    
    TASK:
    Generate a formal 'Notice of Substandard Condition' (Template 1) addressed to 'Building Management'.
    The notice must use professional, firm, yet objective language.
    
    INPUT DATA:
    - Raw Tenant Complaint: "${complaint}"
    - Issue Name: "${rule.issue_name}"
    - Legal Citation: "${rule.legal_citation}"
    - Repair Timeframe: ${rule.repair_clock_hours} hours
    - Oversight Body: ${rule.oversight_body}
    
    STRUCTURE:
    1. Header: 'NOTICE OF SUBSTANDARD CONDITION' (Formal and centered in thought).
    2. Salutation: 'To Building Management,'
    3. Body Paragraph 1: State the issue clearly, professionalizing the raw complaint. Mention the date/time (leave a [DATE] placeholder).
    4. Body Paragraph 2: Explicitly cite the law: "${rule.legal_citation}". State that this condition constitutes a violation of San Francisco housing standards.
    5. Body Paragraph 3: State the required action and timeframe: "Pursuant to local regulations, this repair must be completed within ${rule.repair_clock_hours} hours of this notice."
    6. Closing: 'Sincerely, [TENANT NAME]' and 'Unit [UNIT NUMBER]'.
    
    STRICT RULES:
    - DO NOT include any conversational text from the AI.
    - DO NOT use markdown headers or bolding that might break jspdf simple text rendering unless requested (keep it clean).
    - Provide ONLY the text of the letter.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text()?.trim() || "Error: AI returned empty response.";
  } catch (error) {
    console.error("Error generating notice with Gemini:", error);
    return `Error: Failed to generate notice. ${error instanceof Error ? error.message : String(error)}`;
  }
};
