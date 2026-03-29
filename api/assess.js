module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
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
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `You are a startup evaluator. Evaluate this business idea for the Costa Rican market: "${idea}"

Return ONLY valid JSON:

{
  "scores": {
    "problem": { "score": 3, "reason": "One sentence." },
    "market": { "score": 3, "reason": "One sentence." },
    "valueProposition": { "score": 3, "reason": "One sentence." },
    "businessModel": { "score": 3, "reason": "One sentence." },
    "execution": { "score": 3, "reason": "One sentence." }
  },
  "finalScore": 60,
  "confidenceScore": 2,
  "interpretation": "Promising but Needs Validation",
  "insights": {
    "topStrength": "One sentence.",
    "biggestRisk": "One sentence.",
    "keyAssumption": "One sentence.",
    "nextBestAction": "One sentence."
  },
  "warnings": ["One warning."]
}`
        }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    res.status(200).json(JSON.parse(clean));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};