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
      max_tokens: 6000,
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
  return `You are an expert business model strategist specializing in Costa Rica. You have deep knowledge of consumer trends, demographics, shopping habits, cultural nuances, the competitive landscape, and labor economics in Costa Rica.

A user has this business idea: "${idea}"

Generate a coherent, interconnected business model canvas where every section responds directly to the business idea and connects logically to all other sections.

The current minimum wage in Costa Rica is approximately 383,386 colones per month (2024 official figure). Use this as the baseline for revenue potential scenarios.

Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "rationale": "2-3 sentences explaining why these three segments collectively represent a strong target market in Costa Rica for this specific business idea.",
  "revenuePotential": {
    "intro": "One sentence explaining the revenue potential assessment basis for this specific business idea.",
    "minimumWage": 383386,
    "mostLikelyScenario": "pessimistic | standard | optimistic | outstanding",
    "mostLikelyReason": "One sentence explaining why this scenario is the most realistic for this specific business idea in Costa Rica.",
    "scenarios": [
      {
        "label": "Pessimistic",
        "multiplier": 0.8,
        "monthlyRevenue": 306709,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption that drives this lower-bound scenario, specific to this business idea and the Costa Rican market."
      },
      {
        "label": "Standard",
        "multiplier": 1,
        "monthlyRevenue": 383386,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption that drives the standard scenario, specific to this business idea."
      },
      {
        "label": "Optimistic",
        "multiplier": 3,
        "monthlyRevenue": 1150158,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption that drives the optimistic scenario, specific to this business idea."
      },
      {
        "label": "Outstanding",
        "multiplier": 6,
        "monthlyRevenue": 2300316,
        "currency": "CRC",
        "assumption": "One sentence: the key assumption that drives the outstanding scenario, specific to this business idea."
      }
    ]
  },
  "segments": [
    {
      "name": "Short segment name",
      "profile": "2-3 sentences: age range, location in CR, income level, lifestyle, and why they need this specific business idea.",
      "tags": ["tag1", "tag2", "tag3"],
      "painPoints": [
        "A deep, specific struggle this segment faces with existing solutions in the Costa Rican market.",
        "A second real struggle specific to this segment.",
        "A third significant frustration with how the market currently fails this segment."
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
        "description": "2 sentences: what it is, which pain point it solves, and how it beats existing alternatives.",
        "advantage": "One of: better design, better price, better performance, or more convenient"
      },
      {"name": "", "description": "", "advantage": ""},
      {"name": "", "description": "", "advantage": ""}
    ]
  },
  "customerRelationships": {
    "summary": "One sentence describing the overall relationship philosophy.",
    "strategies": [
      {"name": "", "type": "Acquire", "description": "2 sentences."},
      {"name": "", "type": "Retain", "description": "2 sentences."},
      {"name": "", "type": "Grow", "description": "2 sentences."}
    ]
  },
  "channels": {
    "summary": "One sentence describing how this business reaches its segments.",
    "touchpoints": [
      {"phase": "Awareness", "name": "", "description": "2 sentences."},
      {"phase": "Evaluation", "name": "", "description": "2 sentences."},
      {"phase": "Purchase", "name": "", "description": "2 sentences."},
      {"phase": "Delivery", "name": "", "description": "2 sentences."},
      {"phase": "Post-Purchase", "name": "", "description": "2 sentences."}
    ]
  },
  "keyPartners": {
    "summary": "One sentence describing the overall partnership strategy.",
    "partners": [
      {"name": "", "type": "Supplier | Strategic Alliance | Joint Venture", "description": "2 sentences."},
      {"name": "", "type": "Supplier | Strategic Alliance | Joint Venture", "description": "2 sentences."},
      {"name": "", "type": "Supplier | Strategic Alliance | Joint Venture", "description": "2 sentences."}
    ]
  },
  "keyActivities": {
    "summary": "One sentence describing the most critical operational focus.",
    "activities": [
      {"name": "", "category": "Production | Problem Solving | Platform/Network", "description": "2 sentences."},
      {"name": "", "category": "Production | Problem Solving | Platform/Network", "description": "2 sentences."},
      {"name": "", "category": "Production | Problem Solving | Platform/Network", "description": "2 sentences."}
    ]
  },
  "keyResources": {
    "summary": "One sentence describing the core assets.",
    "resources": [
      {"name": "", "type": "Physical | Financial | Intellectual | Human", "description": "2 sentences."},
      {"name": "", "type": "Physical | Financial | Intellectual | Human", "description": "2 sentences."},
      {"name": "", "type": "Physical | Financial | Intellectual | Human", "description": "2 sentences."}
    ]
  },
  "costStructure": {
    "summary": "One sentence describing the overall cost philosophy.",
    "costs": [
      {"name": "", "type": "Fixed | Variable | Semi-variable", "description": "2 sentences."},
      {"name": "", "type": "Fixed | Variable | Semi-variable", "description": "2 sentences."},
      {"name": "", "type": "Fixed | Variable | Semi-variable", "description": "2 sentences."}
    ]
  },
  "revenueStreams": {
    "summary": "One sentence describing how this business captures value financially.",
    "streams": [
      {"name": "", "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other", "pricing": "Fixed | Dynamic", "segment": "Which segment", "description": "2 sentences."},
      {"name": "", "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other", "pricing": "Fixed | Dynamic", "segment": "Which segment", "description": "2 sentences."},
      {"name": "", "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other", "pricing": "Fixed | Dynamic", "segment": "Which segment", "description": "2 sentences."}
    ]
  },
  "competitiveLandscape": {
    "summary": "One sentence describing the overall competitive position.",
    "competitors": [
      {"name": "", "type": "Direct | Indirect", "description": "2 sentences."},
      {"name": "", "type": "Direct | Indirect", "description": "2 sentences."},
      {"name": "", "type": "Direct | Indirect", "description": "2 sentences."}
    ],
    "advantage": "2 sentences: the unique competitive advantage and why it is defensible in Costa Rica."
  }
}`;
}