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

Generate a coherent, interconnected business model canvas where every section responds directly to the business idea and connects logically to all other sections. The pain points inform the value proposition. The value proposition shapes the customer relationships and channels. The key activities, resources, and partners all exist to deliver the value proposition to the identified segments.

Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "rationale": "2-3 sentences explaining why these three segments collectively represent a strong target market in Costa Rica for this specific business idea.",
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
    "summary": "One sentence describing the overall relationship philosophy.",
    "strategies": [
      {
        "name": "Strategy name",
        "type": "Acquire",
        "description": "2 sentences: how this attracts the target segments in Costa Rica."
      },
      {
        "name": "Strategy name",
        "type": "Retain",
        "description": "2 sentences: how this keeps customers coming back."
      },
      {
        "name": "Strategy name",
        "type": "Grow",
        "description": "2 sentences: how this increases customer lifetime value."
      }
    ]
  },
  "channels": {
    "summary": "One sentence describing how this business reaches and delivers value to its segments.",
    "touchpoints": [
      {
        "phase": "Awareness",
        "name": "Channel name",
        "description": "2 sentences: how this channel raises awareness among the target segments in Costa Rica."
      },
      {
        "phase": "Evaluation",
        "name": "Channel name",
        "description": "2 sentences: how this helps customers evaluate the offering."
      },
      {
        "phase": "Purchase",
        "name": "Channel name",
        "description": "2 sentences: how customers buy or access the product/service."
      },
      {
        "phase": "Delivery",
        "name": "Channel name",
        "description": "2 sentences: how the value proposition is delivered to the customer."
      },
      {
        "phase": "Post-Purchase",
        "name": "Channel name",
        "description": "2 sentences: how the business supports customers after purchase."
      }
    ]
  },
  "keyPartners": {
    "summary": "One sentence describing the overall partnership strategy for this business.",
    "partners": [
      {
        "name": "Partner name",
        "type": "Supplier | Strategic Alliance | Joint Venture",
        "description": "2 sentences: what this partner provides, why this business cannot efficiently handle it alone, and how it enables scaling or reduces risk."
      },
      {
        "name": "Partner name",
        "type": "Supplier | Strategic Alliance | Joint Venture",
        "description": "2 sentences."
      },
      {
        "name": "Partner name",
        "type": "Supplier | Strategic Alliance | Joint Venture",
        "description": "2 sentences."
      }
    ]
  },
  "keyActivities": {
    "summary": "One sentence describing the most critical operational focus of this business.",
    "activities": [
      {
        "name": "Activity name",
        "category": "Production | Problem Solving | Platform/Network",
        "description": "2 sentences: why this is essential to delivering the value proposition and maintaining customer relationships."
      },
      {
        "name": "Activity name",
        "category": "Production | Problem Solving | Platform/Network",
        "description": "2 sentences."
      },
      {
        "name": "Activity name",
        "category": "Production | Problem Solving | Platform/Network",
        "description": "2 sentences."
      }
    ]
  },
  "keyResources": {
    "summary": "One sentence describing the core assets that make this business possible.",
    "resources": [
      {
        "name": "Resource name",
        "type": "Physical | Financial | Intellectual | Human",
        "description": "2 sentences: why this resource is essential, how it enables the value proposition, and what makes it unique or hard to replicate."
      },
      {
        "name": "Resource name",
        "type": "Physical | Financial | Intellectual | Human",
        "description": "2 sentences."
      },
      {
        "name": "Resource name",
        "type": "Physical | Financial | Intellectual | Human",
        "description": "2 sentences."
      }
    ]
  }
}`;
}