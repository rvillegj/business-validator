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
      max_tokens: 2500,
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
  return `You are an expert business model strategist specializing in Costa Rica. You have deep knowledge of consumer trends, demographics, shopping habits, cultural nuances, and the competitive landscape in Costa Rica.

A user has this business idea: "${idea}"

Your job is to generate a coherent, interconnected business model canvas where every section responds directly to the business idea and connects logically to the other sections. The pain points must inform the value proposition. The value proposition must shape the customer relationships.

Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "rationale": "2-3 sentences explaining why these three segments collectively represent a strong target market in Costa Rica for this specific business idea.",
  "segments": [
    {
      "name": "Short segment name",
      "profile": "2-3 sentences: age range, location in CR, income level, lifestyle, and why they need this specific business idea.",
      "tags": ["tag1", "tag2", "tag3"],
      "painPoints": [
        "A deep, specific struggle this segment faces with existing solutions in the Costa Rican market for this type of business. Not generic — rooted in real local experience.",
        "A second real struggle specific to this segment's daily life or work related to this business idea.",
        "A third significant frustration with how the market currently fails this segment for this type of business."
      ]
    },
    {
      "name": "Short segment name",
      "profile": "2-3 sentences.",
      "tags": ["tag1", "tag2", "tag3"],
      "painPoints": ["pain1", "pain2", "pain3"]
    },
    {
      "name": "Short segment name",
      "profile": "2-3 sentences.",
      "tags": ["tag1", "tag2", "tag3"],
      "painPoints": ["pain1", "pain2", "pain3"]
    }
  ],
  "valueProposition": {
    "summary": "One compelling sentence: the core reason customers choose this business over existing alternatives in Costa Rica.",
    "offerings": [
      {
        "name": "Product or service name",
        "description": "2 sentences: what it is, which specific pain point from the segments it solves, and how it beats existing alternatives.",
        "advantage": "One of: better design, better price, better performance, or more convenient"
      },
      {
        "name": "Product or service name",
        "description": "2 sentences.",
        "advantage": "One of: better design, better price, better performance, or more convenient"
      },
      {
        "name": "Product or service name",
        "description": "2 sentences.",
        "advantage": "One of: better design, better price, better performance, or more convenient"
      }
    ]
  },
  "customerRelationships": {
    "summary": "One sentence describing the overall relationship philosophy that connects this business to its segments.",
    "strategies": [
      {
        "name": "Strategy name",
        "type": "Acquire",
        "description": "2 sentences: how this strategy attracts the target segments, why it works for this specific business idea in Costa Rica."
      },
      {
        "name": "Strategy name",
        "type": "Retain",
        "description": "2 sentences: how this strategy keeps customers coming back, how it builds trust and loyalty specific to this value proposition."
      },
      {
        "name": "Strategy name",
        "type": "Grow",
        "description": "2 sentences: how this strategy increases customer lifetime value, reduces churn, and expands revenue from existing customers."
      }
    ]
  }
}`;
}