module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea } = body;

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
      messages: [{ role: "user", content: buildPrompt(idea) }]
    })
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    return res.status(500).json({ error: "Anthropic API error", detail: data });
  }

  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  res.status(200).json(JSON.parse(clean));
};

function buildPrompt(idea) {
  return `You are an expert market research analyst specializing in Costa Rica. You have deep knowledge of:
- Current consumer trends in Costa Rica (2024-2025)
- Demographics: ages, income levels, geographic distribution (GAM, coastal, rural)
- Shopping habits, preferred brands, lifestyle segments
- Cultural nuances, purchasing power, digital adoption rates

A user has this business idea: "${idea}"

Identify the THREE most promising customer segments in Costa Rica for this business idea. Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

Format:
{
  "rationale": "A 2-3 sentence statement explaining why these three segments collectively represent a strong target market for this idea in Costa Rica.",
  "segments": [
    {
      "name": "Short segment name",
      "profile": "2-3 sentences describing who they are: age range, location in CR, income level, lifestyle, and why they need this product/service.",
      "tags": ["tag1", "tag2", "tag3"]
    },
    {},
    {}
  ]
}

Be specific to Costa Rica. Reference real cities, income brackets in colones, and cultural context where relevant.`;
}