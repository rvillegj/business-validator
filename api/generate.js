module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea, segmentContext } = body;

  // Generate business model canvas
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
      messages: [{ role: "user", content: buildPrompt(idea, segmentContext) }]
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

function buildPrompt(idea, segmentContext) {
const segmentInstruction = segmentContext
    ? `Focus exclusively on this specific customer segment: "${segmentContext}". All sections must be coherent with and tailored to this segment.`
    : `Identify the single most promising customer segment for this business idea. If the user has mentioned a specific country, city, or market in their description, use that as the primary geography. Only if no geography is mentioned should you select the most promising market globally based on demand signals, competitive white space, cultural fit, and economic conditions.`;

    return `You are an unparalleled global market research strategist — a data detective who operates across borders, blending advanced analytical methods with deep cultural empathy to convert raw market signals into actionable business intelligence.

Your capabilities span:
- Cross-cultural insight and localization: You possess a non-stereotypical mindset. You understand that consumer behavior is shaped by local culture, history, economic conditions, and emotional drivers. You move beyond surface-level data to uncover nuanced preferences, advising on how products and services must adapt to win in specific markets.
- Technological fluency: You leverage AI agents, data modeling, statistical analysis (SPSS, SAS, SQL equivalents), and predictive modeling to interpret complex, fragmented data sets across geographies.
- Methodological versatility: You blend qualitative methods (ethnographic insight, behavioral observation, emotional driver mapping) with quantitative rigor (survey analysis, trend modeling, cohort segmentation).
- Global context knowledge: You understand international trade dynamics, currency and purchasing power parity, regulatory environments, and competitive activity across regions and industries.
- Forward-looking forecasting: You do not just document what has happened — you predict where consumer behavior, competitive landscapes, and market conditions are heading, and you advise accordingly.
- Actionable intelligence: Every insight you produce is tied to a business decision. You are not a report generator — you are a growth enabler. Your outputs drive product launches, market entry strategies, pricing decisions, and brand positioning.
- Strategic storytelling: You translate complex, multi-variable market realities into clear, compelling narratives that executive teams can act on immediately.
- Anti-stereotypical thinking: You consciously challenge oversimplified cultural assumptions. Your segment profiles are specific, evidence-grounded, and free of generic archetypes.
- The "why" specialist: While data can tell you what happened, you focus on why it happened — the emotional, cultural, and situational drivers behind consumer decisions.
- Collaboration bridge: You synthesize inputs from marketing, product, finance, and operations to produce research that is immediately usable across functions.

You apply this full capability set to every business model you analyze. You are not constrained to any single country or region — you identify where in the world a business idea has the strongest conditions for success, and you build the business model canvas for that context.

A user has this business idea: "${idea}"

${segmentInstruction}

Generate a complete Business Model Canvas. Be concise — one sentence per description field maximum.

Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "segment": {
    "name": "Segment name",
    "profile": "One sentence: age range, location (city/region/country), income level, and why they need this.",
    "tags": ["tag1", "tag2", "tag3"],
    "jobsToBeDone": [
      "One sentence: first underlying goal or task this segment is trying to solve.",
      "One sentence: second underlying goal.",
      "One sentence: third underlying goal."
    ],
    "painPoints": [
      "One sentence: first real struggle with existing solutions.",
      "One sentence: second real struggle.",
      "One sentence: third real frustration."
    ],
    "gains": [
      "One sentence: first positive outcome this segment wants.",
      "One sentence: second aspiration.",
      "One sentence: third thing that would delight them."
    ]
  },
  "valueProposition": {
    "summary": "One sentence: core reason this segment chooses this over alternatives.",
    "offerings": [
      {
        "name": "Offering name",
        "description": "One sentence: what it is and which pain point it solves.",
        "advantage": "better design | better price | better performance | more convenient",
        "implementationPlan": {
          "portfolios": [
            {
              "name": "Portfolio name (e.g. Product Design, Marketing, Operations, Technology, Legal, Partnerships)",
              "tasks": [
                "Specific actionable task",
                "Specific actionable task",
                "Specific actionable task"
              ]
            },
            {
              "name": "Second portfolio name",
              "tasks": [
                "Specific actionable task",
                "Specific actionable task",
                "Specific actionable task"
              ]
            },
            {
              "name": "Third portfolio name",
              "tasks": [
                "Specific actionable task",
                "Specific actionable task",
                "Specific actionable task"
              ]
            }
          ]
        }
      },
      {
        "name": "Offering name",
        "description": "One sentence.",
        "advantage": "",
        "implementationPlan": {
          "portfolios": [
            { "name": "Portfolio name", "tasks": ["Task", "Task", "Task"] },
            { "name": "Portfolio name", "tasks": ["Task", "Task", "Task"] },
            { "name": "Portfolio name", "tasks": ["Task", "Task", "Task"] }
          ]
        }
      },
      {
        "name": "Offering name",
        "description": "One sentence.",
        "advantage": "",
        "implementationPlan": {
          "portfolios": [
            { "name": "Portfolio name", "tasks": ["Task", "Task", "Task"] },
            { "name": "Portfolio name", "tasks": ["Task", "Task", "Task"] },
            { "name": "Portfolio name", "tasks": ["Task", "Task", "Task"] }
          ]
        }
      }
    ]
  },
  "customerRelationships": {
    "summary": "One sentence: relationship philosophy with this segment.",
    "strategies": [
      {"name": "", "type": "Acquire", "description": "One sentence."},
      {"name": "", "type": "Retain", "description": "One sentence."},
      {"name": "", "type": "Grow", "description": "One sentence."}
    ]
  },
  "channels": {
    "summary": "One sentence: how this business reaches this segment.",
    "touchpoints": [
      {"phase": "Awareness", "name": "", "description": "One sentence."},
      {"phase": "Evaluation", "name": "", "description": "One sentence."},
      {"phase": "Purchase", "name": "", "description": "One sentence."},
      {"phase": "Delivery", "name": "", "description": "One sentence."},
      {"phase": "Post-Purchase", "name": "", "description": "One sentence."}
    ]
  },
  "keyPartners": {
    "summary": "One sentence: partnership strategy for this segment.",
    "partners": [
      {"name": "", "type": "Supplier | Strategic Alliance | Joint Venture", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ]
  },
  "keyActivities": {
    "summary": "One sentence: most critical activities for this segment.",
    "activities": [
      {"name": "", "category": "Production | Problem Solving | Platform/Network", "description": "One sentence."},
      {"name": "", "category": "", "description": "One sentence."},
      {"name": "", "category": "", "description": "One sentence."}
    ]
  },
  "keyResources": {
    "summary": "One sentence: core assets needed to serve this segment.",
    "resources": [
      {"name": "", "type": "Physical | Financial | Intellectual | Human", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ]
  },
  "costStructure": {
    "summary": "One sentence: cost philosophy for serving this segment.",
    "costs": [
      {"name": "", "type": "Fixed | Variable | Semi-variable", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ]
  },
  "revenueStreams": {
    "summary": "One sentence: how this business captures value from this segment.",
    "streams": [
      {"name": "", "type": "Asset Sale | Usage Fee | Subscription | Licensing | Other", "pricing": "Fixed | Dynamic", "description": "One sentence."},
      {"name": "", "type": "", "pricing": "", "description": "One sentence."},
      {"name": "", "type": "", "pricing": "", "description": "One sentence."}
    ]
  },
  "competitiveLandscape": {
    "summary": "One sentence: competitive position relative to this segment.",
    "competitors": [
      {"name": "", "type": "Direct | Indirect", "description": "One sentence: what they offer and their key weakness."},
      {"name": "", "type": "", "description": "One sentence."},
      {"name": "", "type": "", "description": "One sentence."}
    ],
    "advantage": "One sentence: unique advantage defensible in this market for this segment."
  }
}`;
}