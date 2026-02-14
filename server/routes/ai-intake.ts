import { RequestHandler } from "express";
import { OPENAI_API_KEY } from "../config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IntakeRequest {
  userMessage: string;
  conversationHistory: Message[];
  systemPrompt: string;
}

interface IntakeResponse {
  response: string;
  extractedData?: Record<string, any>;
}

// Helper to call OpenAI API
async function callOpenAI(
  systemPrompt: string,
  messages: Message[]
): Promise<{ response: string; extractedData?: Record<string, any> }> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  try {
    // Call OpenAI chat completion
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("OpenAI API error response:", errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        const textError = await response.text();
        console.error("OpenAI API error text:", textError);
      }
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error("No message content in OpenAI response:", data);
      throw new Error("No response content from OpenAI");
    }

    // Extract structured data from the conversation
    const extractedData = extractProjectData(assistantMessage, messages);

    return {
      response: assistantMessage,
      extractedData,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("OpenAI API call failed:", error.message);
      throw error;
    }
    throw new Error(`OpenAI API call failed: ${String(error)}`);
  }
}

// Helper to extract structured project data from conversation
function extractProjectData(
  lastMessage: string,
  history: Message[]
): Record<string, any> {
  const extracted: Record<string, any> = {};

  // Combine all messages for context
  const conversationText = [
    ...history.map((m) => m.content),
    lastMessage,
  ].join(" ");

  // Service categories to match
  const services = [
    "Payroll Services",
    "Accounting Services",
    "Legal Services",
    "IT Services",
    "Consulting",
    "Marketing Services",
    "Construction",
    "Cleaning Services",
    "HVAC",
    "Electrical",
  ];

  // Extract service category (case-insensitive)
  for (const service of services) {
    if (conversationText.toLowerCase().includes(service.toLowerCase())) {
      extracted.service_category = service;
      break;
    }
  }

  // Extract budget amounts
  const budgetMatch = conversationText.match(/\$?([\d,]+)\s*(?:to|-|\s)\s*\$?([\d,]+)/i);
  if (budgetMatch) {
    extracted.budget_min = parseInt(budgetMatch[1].replace(/,/g, ""));
    extracted.budget_max = parseInt(budgetMatch[2].replace(/,/g, ""));
  } else {
    // Try to find single budget
    const singleBudgetMatch = conversationText.match(/\$?([\d,]+)/);
    if (singleBudgetMatch) {
      const amount = parseInt(singleBudgetMatch[1].replace(/,/g, ""));
      extracted.budget_min = amount;
      extracted.budget_max = amount;
    }
  }

  // Extract ZIP code
  const zipMatch = conversationText.match(/\b(\d{5})\b/);
  if (zipMatch) {
    extracted.project_zip = zipMatch[1];
  }

  // Extract state (two-letter abbreviation)
  const stateMatch = conversationText.match(
    /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i
  );
  if (stateMatch) {
    extracted.project_state = stateMatch[0].toUpperCase();
  }

  // Extract company size (employee count range)
  const sizeMatch = conversationText.match(
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:employee|person|person|staff|team member)/i
  );
  if (sizeMatch) {
    extracted.business_size = `${sizeMatch[1]}-${sizeMatch[2]}`;
  }

  // Extract timeline dates
  const dateMatch = conversationText.match(
    /(?:from\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:to|until|through)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
  );
  if (dateMatch) {
    extracted.timeline_start = dateMatch[1];
    extracted.timeline_end = dateMatch[2];
  }

  // Try to extract a project title from the first substantive user message
  // or generate one from service category
  if (extracted.service_category && !extracted.title) {
    const userMessages = history.filter((m) => m.role === "user");
    if (userMessages.length > 0) {
      // Use first few words of first user message as title
      const firstUserMessage = userMessages[0].content;
      const words = firstUserMessage.split(" ").slice(0, 5);
      if (words.length > 0) {
        extracted.title = words.join(" ");
      } else {
        extracted.title = `${extracted.service_category} Project`;
      }
    }
  }

  return extracted;
}

export const handleAIIntake: RequestHandler = async (req, res) => {
  try {
    const { userMessage, conversationHistory, systemPrompt }: IntakeRequest =
      req.body;

    if (!userMessage || !conversationHistory || !systemPrompt) {
      return res.status(400).json({
        error: "Missing required fields: userMessage, conversationHistory, systemPrompt",
      });
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      console.error("OpenAI API key is missing or using placeholder value");
      return res.status(500).json({
        error: "Configuration Error",
        message: "The OpenAI API key is not configured. Please set a valid OPENAI_API_KEY in your .env file.",
        isConfigError: true
      });
    }

    // Build the messages array for OpenAI
    const messages: Message[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // Call OpenAI
    const { response, extractedData } = await callOpenAI(systemPrompt, messages);

    // Return response with proper headers
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      response,
      extractedData,
      success: true,
    });
  } catch (error) {
    console.error("AI Intake error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Return proper error response
    res.status(500).json({
      error: message,
      success: false,
      details: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
};
