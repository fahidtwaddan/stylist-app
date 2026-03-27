import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 40000, // 40s — fail fast before Next.js/browser timeout
});

function extractJSON(text: string): string {
  // Strip markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Find JSON array or object
  const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) return jsonMatch[1];
  return text;
}

// Attempt to repair truncated JSON arrays (common when Claude hits max_tokens)
function repairTruncatedJSON(text: string): string {
  try {
    JSON.parse(text);
    return text; // Already valid
  } catch {
    // Try to fix truncated array — find last complete object and close the array
    let repaired = text;

    // Count open vs close braces/brackets
    let braceDepth = 0;
    let bracketDepth = 0;
    let lastCompleteObj = -1;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;

      if (ch === "{") braceDepth++;
      if (ch === "}") {
        braceDepth--;
        if (braceDepth === 0 && bracketDepth === 1) {
          lastCompleteObj = i; // End of a top-level object in the array
        }
      }
      if (ch === "[") bracketDepth++;
      if (ch === "]") bracketDepth--;
    }

    // If we have at least one complete object, truncate there and close
    if (lastCompleteObj > 0) {
      repaired = repaired.substring(0, lastCompleteObj + 1) + "]";
      try {
        JSON.parse(repaired);
        return repaired;
      } catch {
        // Still broken
      }
    }

    return text; // Return original, let caller handle the error
  }
}

export async function analyzePhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
) {
  const { STYLE_ANALYSIS_PROMPT } = await import("./prompts");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: STYLE_ANALYSIS_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return JSON.parse(extractJSON(textBlock.text));
}

export async function generateOutfits(
  profileJson: string,
  occasion: string
) {
  const { OUTFIT_GENERATION_PROMPT } = await import("./prompts");

  const prompt = OUTFIT_GENERATION_PROMPT.replace("{PROFILE}", profileJson).replace(
    "{OCCASION}",
    occasion
  );

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const raw = extractJSON(textBlock.text);
  const repaired = repairTruncatedJSON(raw);
  const outfits = JSON.parse(repaired);

  // If truncation gave us fewer than 6, that's fine — return what we have
  return Array.isArray(outfits) ? outfits : [outfits];
}
