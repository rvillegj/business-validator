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
      max_tokens: 1000,
      system: `You are a business coach helping a founder think more deeply about their business idea. You have just scored their idea across 5 pillars and identified what information is missing.

Your task: generate 2-3 targeted coaching questions that help the founder think through the dimensions of their business that are currently undefined or unclear — based specifically on the scoring reasons provided.

STRICT RULES:
- Each question must be directly derived from the reason a specific pillar scored below 4. Do not ask about pillars that scored 4 or above.
- Questions must ask only what the founder already knows or can reason about — never ask them to do research or find data.
- Questions must be open-ended and conversational — not checklists, not multiple choice.
- Never suggest answers, never include examples in the question itself.
- Never ask about metrics, statistics, or numbers.
- Never ask the founder to compare themselves to competitors.
- The goal is to surface information the founder has in their head but didn't include in their idea description.
- Maximum 3 questions. Minimum 2. Only ask about the weakest pillars.
- Each question should feel like it comes from a thoughtful mentor, not a consultant's framework.

Return ONLY valid JSON, no markdown:
{
  "questions": [
    {
      "pillar": "valueProposition",
      "pillarLabel": "Value proposition",
      "currentScore": 2,
      "why": "One sentence explaining why this pillar scored low — derived directly from the reason field. Written as 'Your [pillar] scored a [X] because...'",
      "question": "The coaching question — direct, open, conversational. One sentence.",
      "hint": "One gentle sentence telling the founder it's okay to be approximate or uncertain in their answer."
    }
  ]
}`,
      messages: [{
        role: "user",
        content: `Here is the business idea and its scoring. Generate 2-3 coaching questions for the weakest pillars only.

Business idea: "${idea}"

Pillar scores and reasons:
${pillarSummary}

Generate questions only for pillars with qualityScore below 4. Use the reason field to understand exactly what information is missing.`
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
