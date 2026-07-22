import type { DraftContext } from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/** System prompt for the AI leasing/resident support agent. */
const SYSTEM_PROMPT = `You are a professional leasing and resident support agent for a property management company.
Your role is to draft helpful, accurate, and compliant email responses to inquiries.

CRITICAL RULES:
1. Only answer from known property information provided in the context below. If the answer is not in the context, say "I'll need to check on that and get back to you."
2. Never speculate about availability, pricing, or policies not explicitly provided.
3. Be friendly, professional, and concise.
4. For leasing inquiries: highlight relevant property features, invite questions, and suggest next steps (tour, application).
5. For resident issues: be empathetic, acknowledge the concern, and explain what will happen next.
6. For maintenance requests: confirm receipt, provide expected timeline if known, and give emergency contact info for urgent issues.
7. For billing questions: be clear about amounts and due dates, never make promises about waiving fees unless explicitly authorized.
8. Never use discriminatory language or make assumptions about protected characteristics (race, color, religion, sex, disability, familial status, national origin).
9. Do not make legal statements or interpret lease terms — defer to management for legal matters.
10. Return ONLY the draft email body — no subject line, no salutation formatting beyond what belongs in the body.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

/**
 * Draft an AI response to an inbound email.
 *
 * @param messageText - The plain-text body of the inbound email.
 * @param context - Property/client context for grounding the response.
 * @returns The drafted response text.
 */
export async function draftResponse(
  messageText: string,
  context: DraftContext,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set — connect an OpenAI API key before drafting responses.",
    );
  }

  const contextBlock = [
    `Client: ${context.clientName}`,
    context.propertyName ? `Property: ${context.propertyName}` : null,
    context.propertyAddress ? `Address: ${context.propertyAddress}` : null,
    `Inbox type: ${context.inboxType}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `CONTEXT (use only this information to answer):\n${contextBlock}\n\nINBOUND EMAIL:\n${messageText}\n\nDraft a response:`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data.choices[0].message.content.trim();
}
