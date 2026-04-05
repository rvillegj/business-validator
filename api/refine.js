module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea, scores } = body;

  if (!idea || !scores) return res.status(400).json({ error: "idea and scores are required" });

  const pillarSummary = Object.entries(scores).map(([key, val]) => {
    const labels = { problem: "Problem Strength", market: "Market Attractiveness", valueProposition: "Value Proposition", businessModel: "Business Model", execution: "Execution Feasibility" };
    return `- ${labels[key] || key}: Q=${val.qualityScore || val.score || 0}/5, E=${val.evidenceScore || 0}/5. Reason: "${val.reason || "no reason provided"}"`;
  }).join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: `You are a business coach helping a founder think more deeply about their business idea. You have scored their idea and identified what information is missing.

Your task: generate 2-3 targeted coaching questions for the weakest pillars, each with 4 short pre-composed answer options the founder can select from.

STRICT RULES:
- Only ask about pillars with qualityScore below 4.
- Questions must surface information the founder already has in their head but didn't include.
- Never ask them to research or find data. Never suggest metrics or statistics.
- Each question must be derived directly from the reason the pillar scored low.
- Pre-composed options must be short (max 8 words each), realistic, and meaningfully different from each other.
- Options must be plausible answers a real founder might give — not generic framework labels.
- Options must be directly relevant to the specific question being asked.
- Never include "Other" or "None of the above" as an option — there is always a built-in "Something else" escape.
- Maximum 3 questions, minimum 2.

Return ONLY valid JSON, no markdown:
{
  "questions": [
    {
      "pillar": "valueProposition",
      "pillarLabel": "Value proposition",
      "currentScore": 2,
      "why": "One sentence: 'Your [pillar] scored a [X] because [specific reason from the scoring].'",
      "question": "The coaching question — direct, open, one sentence.",
      "hint": "One gentle sentence: it's okay to select all that apply or add your own.",
      "options": [
        "Short option 1 — max 8 words",
        "Short option 2 — max 8 words",
        "Short option 3 — max 8 words",
        "Short option 4 — max 8 words"
      ]
    }
  ]
}`,
      messages: [{
        role: "user",
        content: `Business idea: "${idea}"

Pillar scores and reasons:
${pillarSummary}

Generate 2-3 coaching questions with pre-composed answer options for pillars with qualityScore below 4.`
      }]
    })
  });

  const data = await response.json();
  if (!response.ok || !data.content) {
    return res.status(500).json({ error: "Refine API error", detail: data });
  }

  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: "JSON parse error", raw: clean });
  }
};
