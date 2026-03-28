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
  return `You are an expert business model strategist specializing in Costa Rica. You have deep knowledge of consumer trends, demographics, shopping habits, cultural nuances, and the competitive landscape in Costa Rica.

A user has this business idea: "${idea}"

Generate a coherent, interconnected business model canvas where every section responds directly to the business idea and connects logically to all other sections. The cost structure must reflect the key resources and activities. The revenue streams must map to the segments and value proposition. The competitive landscape must explain why this model wins.

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
        "description": "2 sentences: what this partner provides and how it enables scaling or reduces risk."
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
        "description": "2 sentences: why this is essential to delivering the value proposition."
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
        "description": "2 sentences: why this resource is essential and what makes it unique or hard to replicate."
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
  },
  "costStructure": {
    "summary": "One sentence describing the overall cost philosophy of this business (cost-driven vs value-driven).",
    "costs": [
      {
        "name": "Cost item name",
        "type": "Fixed | Variable | Semi-variable",
        "description": "2 sentences: what this cost covers, why it is significant, and how it connects to the key activities or resources."
      },
      {
        "name": "Cost item name",
        "type": "Fixed | Variable | Semi-variable",
        "description": "2 sentences."
      },
      {
        "name": "Cost item name",
        "type": "Fixed | Variable | Semi-variable",
        "description": "2 sentences."
      }
    ]
  },
  "revenueStreams": {
    "summary": "One sentence describing how this business captures value financially from its segments.",
    "streams": [
      {
        "name": "Revenue stream name",
        "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other",
        "pricing": "Fixed | Dynamic",
        "segment": "Which customer segment this targets",
        "description": "2 sentences: how this stream generates revenue, what triggers payment, and why this pricing model fits this segment in Costa Rica."
      },
      {
        "name": "Revenue stream name",
        "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other",
        "pricing": "Fixed | Dynamic",
        "segment": "Which customer segment this targets",
        "description": "2 sentences."
      },
      {
        "name": "Revenue stream name",
        "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other",
        "pricing": "Fixed | Dynamic",
        "segment": "Which customer segment this targets",
        "description": "2 sentences."
      }
    ]
  },
  "competitiveLandscape": {
    "summary": "One sentence describing the overall competitive position of this business in Costa Rica.",
    "competitors": [
      {
        "name": "Competitor name",
        "type": "Direct | Indirect",
        "description": "2 sentences: what this competitor offers, who they serve, and their key weakness that this business exploits."
      },
      {
        "name": "Competitor name",
        "type": "Direct | Indirect",
        "description": "2 sentences."
      },
      {
        "name": "Competitor name",
        "type": "Direct | Indirect",
        "description": "2 sentences."
      }
    ],
    "advantage": "2 sentences: the unique competitive advantage this business has over all identified competitors, and why it is defensible in the Costa Rican market."
  }
}`;
}