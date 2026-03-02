import { RequestHandler } from "express";

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

function parseMoney(raw: string, unit?: string | null) {
  const n = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const u = (unit || "").toLowerCase();
  if (u === "k") return Math.round(n * 1_000);
  if (u === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
}

function generateDemoAssistantResponse(extracted: Record<string, any>): string {
  const missingService = !extracted.service_category;
  const missingState = !extracted.project_state;
  const missingZip = !extracted.project_zip;

  const missingProblem = !extracted.description;
  const missingTitle = !extracted.title;
  const requirementsText = String(extracted.special_requirements || "");
  const missingUrgency = !/\bUrgency:\b/i.test(requirementsText);
  const missingImpact = !/\bImpact:\b/i.test(requirementsText);
  const missingEngagement = !/\bEngagement:\b/i.test(requirementsText);
  const missingCompanySize = !extracted.business_size;
  const missingRequirements = !/\bRequirements:\b/i.test(requirementsText);

  // Step 1 — Industry & Location
  if (missingService) {
    return "Step 1/3 — Industry & Location: What industry are you in, and what service do you need? (Example: ‘Healthcare — IT support’)";
  }

  if (missingState || missingZip) {
    return "Step 1/3 — Where do you need the service? Please share City + State + ZIP (and tell me if the scope is City / Statewide / National / Remote).";
  }

  // Step 2 — Problem & Urgency
  if (missingProblem) {
    return "Step 2/3 — What problem are you trying to solve?";
  }

  if (missingUrgency) {
    return "Step 2/3 — How urgent is this? (ASAP / Within 30 days / Within 90 days / Flexible)";
  }

  if (missingImpact) {
    return "Step 2/3 — What happens if this doesn’t get fixed?";
  }

  // Step 3 — Project Details
  if (missingTitle) {
    return "Step 3/3 — What’s a short title for this project? (Example: ‘Payroll setup for 25 employees’)";
  }

  if (missingEngagement) {
    return "Step 3/3 — Is this a one-time project or ongoing work?";
  }

  if (missingCompanySize) {
    return "Step 3/3 — What’s your company size? (1–10 / 10–50 / 50–200 / 200+)";
  }

  if (missingRequirements) {
    return "Step 3/3 — Any specific requirements? (Certifications / Insurance / Compliance / Other notes)";
  }

  const budgetLine =
    extracted.budget_min && extracted.budget_max
      ? `\n- Budget: $${Number(extracted.budget_min).toLocaleString()}–$${Number(extracted.budget_max).toLocaleString()}`
      : "";

  return `Thanks — here’s what I have so far:\n\n- Service: ${extracted.service_category}\n- Location: ${extracted.project_state} ${extracted.project_zip}${budgetLine}\n\nIf that looks right, you can submit the project from the summary panel.`;
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
        model: "gpt-4o-mini",
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

  const latestUserMessage =
    [...history].reverse().find((m) => m.role === "user")?.content?.trim() || "";
  const previousAssistantMessage =
    [...history].reverse().find((m) => m.role === "assistant")?.content?.trim() || "";

  const appendSpecial = (line: string) => {
    const current = String(extracted.special_requirements || "").trim();
    if (!line.trim()) return;
    if (current.toLowerCase().includes(line.toLowerCase())) return;
    extracted.special_requirements = current ? `${current}\n${line}` : line;
  };

  // Combine all messages for context
  const conversationText = [
    ...history.map((m) => m.content),
    lastMessage,
  ].join(" ");

  const serviceMatchers: Array<{ name: string; keywords: string[] }> = [
    { name: "Payroll Services", keywords: ["payroll", "pay roll"] },
    { name: "Accounting Services", keywords: ["accounting", "bookkeeping", "book keeping"] },
    { name: "Legal Services", keywords: ["legal", "lawyer", "contract"] },
    { name: "IT Services", keywords: ["it", "tech support", "network", "cybersecurity", "security"] },
    { name: "Consulting", keywords: ["consulting", "advisor", "strategy"] },
    { name: "Marketing Services", keywords: ["marketing", "seo", "ads", "advertising", "social media"] },
    { name: "Construction", keywords: ["construction", "build", "renovation", "remodel"] },
    { name: "Cleaning Services", keywords: ["cleaning", "janitorial"] },
    { name: "HVAC", keywords: ["hvac", "heating", "cooling", "air conditioning"] },
    { name: "Electrical", keywords: ["electrical", "electrician"] },
  ];

  for (const service of serviceMatchers) {
    if (service.keywords.some((k) => conversationText.toLowerCase().includes(k))) {
      extracted.service_category = service.name;
      break;
    }
  }

  // Extract budget amounts (avoid accidentally reading ZIP codes / dates)
  const rangeMatch = conversationText.match(
    /\$?\s*([\d,.]+)\s*(k|m)?\s*(?:to|-|–)\s*\$?\s*([\d,.]+)\s*(k|m)?/i
  );
  if (rangeMatch) {
    const min = parseMoney(rangeMatch[1], rangeMatch[2]);
    const max = parseMoney(rangeMatch[3], rangeMatch[4]);
    if (min != null && max != null) {
      extracted.budget_min = Math.min(min, max);
      extracted.budget_max = Math.max(min, max);
    }
  } else {
    const dollarMatches = [...conversationText.matchAll(/\$\s*([\d,.]+)\s*(k|m)?/gi)];
    if (dollarMatches.length >= 1) {
      const first = parseMoney(dollarMatches[0][1], dollarMatches[0][2]);
      const second = dollarMatches.length >= 2 ? parseMoney(dollarMatches[1][1], dollarMatches[1][2]) : null;
      if (first != null && second != null) {
        extracted.budget_min = Math.min(first, second);
        extracted.budget_max = Math.max(first, second);
      } else if (first != null) {
        extracted.budget_min = first;
        extracted.budget_max = first;
      }
    } else {
      const budgetWordMatch = conversationText.match(
        /(?:budget|spend|cost|around|approx(?:imately)?|up to)\s*\$?\s*([\d,.]+)\s*(k|m)?/i
      );
      if (budgetWordMatch) {
        const amt = parseMoney(budgetWordMatch[1], budgetWordMatch[2]);
        if (amt != null) {
          extracted.budget_min = amt;
          extracted.budget_max = amt;
        }
      }
    }
  }

  // Extract ZIP code
  const zipMatch = conversationText.match(/\b(\d{5})\b/);
  if (zipMatch) {
    extracted.project_zip = zipMatch[1];
  }

  // Extract state (prefer full state names; only accept 2-letter abbreviations when they appear as uppercase tokens)
  const stateAbbrevs = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  ];

  const stateNameToAbbrev: Record<string, string> = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
  };

  const lower = conversationText.toLowerCase();
  const stateName = Object.keys(stateNameToAbbrev).find((name) => lower.includes(name));
  if (stateName) {
    extracted.project_state = stateNameToAbbrev[stateName];
  } else {
    const upperTokens = conversationText.match(/\b[A-Z]{2}\b/g) || [];
    const abbrev = upperTokens.find((t) => stateAbbrevs.includes(t));
    if (abbrev) {
      extracted.project_state = abbrev;
    }
  }

  // Extract company size (employee count range)
  const sizeMatch = conversationText.match(
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:employee|person|person|staff|team member)/i
  );
  if (sizeMatch) {
    extracted.business_size = `${sizeMatch[1]}-${sizeMatch[2]}`;
  } else {
    const sizeOption = conversationText.match(/\b(1\s*[–-]\s*10|10\s*[–-]\s*50|50\s*[–-]\s*200|200\s*\+)\b/);
    if (sizeOption) {
      extracted.business_size = sizeOption[1].replace(/\s+/g, "").replace("–", "-");
    }
  }

  // Context-aware captures based on what the assistant just asked
  const promptLower = previousAssistantMessage.toLowerCase();
  if (promptLower.includes("industry") && latestUserMessage) {
    // We don't have a dedicated industry field in the project schema yet,
    // so store it in special requirements for now.
    appendSpecial(`Industry: ${latestUserMessage}`);
  }

  if ((promptLower.includes("short title") || promptLower.includes("project title")) && latestUserMessage) {
    if (!extracted.title) {
      extracted.title = latestUserMessage;
    }
  }

  if ((promptLower.includes("what problem") || promptLower.includes("trying to solve")) && latestUserMessage) {
    if (!extracted.description) {
      extracted.description = latestUserMessage;
    }
  }

  if (promptLower.includes("how urgent") && latestUserMessage) {
    const lower = latestUserMessage.toLowerCase();
    const urgency =
      lower.includes("asap")
        ? "ASAP"
        : lower.includes("30")
          ? "Within 30 days"
          : lower.includes("90")
            ? "Within 90 days"
            : lower.includes("flex")
              ? "Flexible"
              : null;
    if (urgency) appendSpecial(`Urgency: ${urgency}`);
  }

  if (promptLower.includes("what happens if") && latestUserMessage) {
    appendSpecial(`Impact: ${latestUserMessage}`);
  }

  if ((promptLower.includes("one-time") || promptLower.includes("one time") || promptLower.includes("ongoing")) && latestUserMessage) {
    const lower = latestUserMessage.toLowerCase();
    const engagement =
      lower.includes("one") && (lower.includes("time") || lower.includes("once"))
        ? "One-time"
        : lower.includes("ongoing") || lower.includes("recurring") || lower.includes("retainer")
          ? "Ongoing"
          : null;
    if (engagement) appendSpecial(`Engagement: ${engagement}`);
  }

  if (promptLower.includes("requirements") || promptLower.includes("certification") || promptLower.includes("insurance") || promptLower.includes("compliance")) {
    if (latestUserMessage) {
      appendSpecial(`Requirements: ${latestUserMessage}`);
    }
  }

  if (promptLower.includes("where do you need") && latestUserMessage) {
    const lower = latestUserMessage.toLowerCase();
    const scope = lower.includes("remote")
      ? "Remote"
      : lower.includes("national")
        ? "National"
        : lower.includes("state")
          ? "Statewide"
          : lower.includes("city") || lower.includes("local")
            ? "City"
            : null;
    if (scope) appendSpecial(`Scope: ${scope}`);
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

    // Build the messages array for OpenAI
    const messages: Message[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // If no OpenAI key is configured, keep the intake flow usable in a deterministic
    // (non-AI) demo mode instead of hard-failing.
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key-here") {
      const extractedData = extractProjectData(userMessage, messages);
      const response = generateDemoAssistantResponse(extractedData);
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        response,
        extractedData,
        success: true,
        demoMode: true,
      });
    }

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
