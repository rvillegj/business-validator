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
      max_tokens: 4000,
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

Generate a coherent, interconnected business model canvas. Every section must respond directly to the business idea. Be concise — one sentence per description field maximum.

The current minimum wage in Costa Rica is approximately 383,386 colones per month (2024 official figure).

Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "rationale": "One sentence explaining why these three segments represent a strong target market in Costa Rica.",
  "revenuePotential": {
    "intro": "One sentence explaining the revenue potential assessment basis.",
    "minimumWage": 383386,
    "mostLikelyScenario": "pessimistic | standard | optimistic | outstanding",
    "mostLikelyReason": "One sentence explaining why this scenario is most realistic.",
    "scenarios": [
      {
        "label": "Pessimistic",
        "multiplier": 0.8,
        "monthlyRevenue": 306709,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption driving this scenario."
      },
      {
        "label": "Standard",
        "multiplier": 1,
        "monthlyRevenue": 383386,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption driving this scenario."
      },
      {
        "label": "Optimistic",
        "multiplier": 3,
        "monthlyRevenue": 1150158,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption driving this scenario."
      },
      {
        "label": "Outstanding",
        "multiplier": 6,
        "monthlyRevenue": 2300316,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption driving this scenario."
      }
    ]
  },
  "segments": [
    {
      "name": "Segment name",
      "profile": "One sentence: age range, location in CR, income level, and why they need this.",
      "tags": ["tag1", "tag2", "tag3"],
      "painPoints": [
        "One sentence: first real struggle with existing solutions.",
        "One sentence: second real struggle.",
        "One sentence: third real frustration."
      ]
    },
    {"name": "", "profile": "", "tags": [], "painPoints": ["", "", ""]},
    {"name": "", "profile": "", "tags": [], "painPoints": ["", "", ""]}
  ],
  "valueProposition": {
    "summary": "One sentence: core reason customers choose this over alternatives.",
    "offerings": [
      {"name": "", "description": "One sentence: what it is and which pain point it solves.", "advantage": "better design | better price | better performance | more convenient"},
      {"name": "", "description": "One sentence.", "advantage": ""},
      {"name": "", "description": "One sentence.", "advantage": ""}
    ]
  },
  "customerRelationships": {
    "summary": "One sentence: overall relationship philosophy.",
    "strategies": [
      {"name": "", "type": "Acquire", "description": "One sentence."},
      {"name": "", "type": "Retain", "description": "One sentence."},
      {"name": "", "type": "Grow", "description": "One sentence."}
    ]
  },
  "channels": {
    "summary": "One sentence: how this business reaches its segments.",
    "touchpoints": [
      {"phase": "Awareness", "name": "", "description": "One sentence."},
      {"phase": "Evaluation", "name": "", "description": "One sentence."},
      {"phase": "Purchase", "name": "", "description": "One sentence."},
      {"phase": "Delivery", "name": "", "description": "One sentence."},
      {"phase": "Post-Purchase", "name": "", "description": "One sentence."}
    ]
  },
  "keyPartners": {
    "summary": "One sentence: overall partnership strategy.",
    "partners": [
      {"name": "", "type": "Supplier | Strategic Alliance | Joint Venture", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ]
  },
  "keyActivities": {
    "summary": "One sentence: most critical operational focus.",
    "activities": [
      {"name": "", "category": "Production | Problem Solving | Platform/Network", "description": "One sentence."},
      {"name": "", "category": "", "description": "One sentence."},
      {"name": "", "category": "", "description": "One sentence."}
    ]
  },
  "keyResources": {
    "summary": "One sentence: core assets that make this business possible.",
    "resources": [
      {"name": "", "type": "Physical | Financial | Intellectual | Human", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ]
  },
  "costStructure": {
    "summary": "One sentence: overall cost philosophy.",
    "costs": [
      {"name": "", "type": "Fixed | Variable | Semi-variable", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ]
  },
  "revenueStreams": {
    "summary": "One sentence: how this business captures value financially.",
    "streams": [
      {"name": "", "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other", "pricing": "Fixed | Dynamic", "segment": "Which segment", "description": "One sentence."},
      {"name": "", "type": "", "pricing": "", "segment": "", "description": "One sentence."},
      {"name": "", "type": "", "pricing": "", "segment": "", "description": "One sentence."}
    ]
  },
  "competitiveLandscape": {
    "summary": "One sentence: overall competitive position.",
    "competitors": [
      {"name": "", "type": "Direct | Indirect", "description": "One sentence: what they offer and their key weakness."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ],
    "advantage": "One sentence: unique competitive advantage and why it is defensible in Costa Rica."
  }
}`;
}