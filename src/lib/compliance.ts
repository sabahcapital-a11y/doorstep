import type { ComplianceResult } from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/** System prompt for fair housing compliance screening. */
const COMPLIANCE_PROMPT = `You are a fair housing compliance auditor. Review the following draft email response for potential fair housing violations.

Protected classes under the Fair Housing Act:
- Race
- Color
- Religion
- Sex (including gender identity and sexual orientation)
- Disability
- Familial status (presence of children under 18, pregnancy)
- National origin

Screen for these categories of violation:

1. STEERING LANGUAGE — Language that guides or limits a prospect's housing choice based on protected class (e.g., "perfect for families," "not suitable for children," "great for singles," references to neighborhood demographics).

2. DISCRIMINATORY TONE — Language that is less welcoming, more restrictive, or otherwise different in tone based on protected characteristics.

3. DISPARATE TREATMENT INDICATORS — Offering different terms, conditions, or information to different people (implied or explicit).

4. PROTECTED CLASS REFERENCES — Any mention of race, color, religion, sex, disability, familial status, or national origin that is not legally required (e.g., accessibility features described properly is OK; "no kids allowed" is not).

5. DISABILITY ACCESS DISCOURAGEMENT — Language that discourages reasonable accommodation requests or implies disability is unwelcome.

Respond with a JSON object:
{
  "passed": true or false,
  "flags": ["list of specific flagged phrases or issues found"],
  "reasoning": "brief explanation of each flag or why it passed"
}

Only flag REAL issues — do not flag neutral, professional language. False positives erode trust in the system.`;

interface ComplianceAIResponse {
  passed: boolean;
  flags: string[];
  reasoning: string;
}

/**
 * Screen a draft response for fair housing compliance issues.
 *
 * @param draftText - The AI-drafted response text to screen.
 * @returns ComplianceResult with pass/fail and any flags.
 */
export async function screenResponse(
  draftText: string,
): Promise<ComplianceResult> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set — connect an OpenAI API key before screening responses.",
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: COMPLIANCE_PROMPT },
        {
          role: "user",
          content: `Screen this draft email response for fair housing compliance:\n\n---\n${draftText}\n---`,
        },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      `OpenAI compliance API error (${response.status}): ${err}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const result = JSON.parse(
    data.choices[0].message.content,
  ) as ComplianceAIResponse;

  return {
    passed: result.passed,
    flags: result.flags,
  };
}
