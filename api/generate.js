module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea, segmentContext, scoreMode } = body;

  // --- Score mode: evaluate likelihood of success from canvas context ---
  if (scoreMode) {
    const scoreResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: buildScoringSystemPrompt(),
        messages: [{ role: "user", content: buildScoringUserPrompt(idea) }]
      })
    });

    const scoreData = await scoreResponse.json();
    if (!scoreResponse.ok || !scoreData.content) {
      return res.status(500).json({ error: "Scoring API error", detail: scoreData });
    }

    const scoreText = scoreData.content.map(b => b.text || "").join("");
    const scoreClean = scoreText.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(scoreClean));
  }

  // --- Normal mode: generate business model canvas ---
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

function buildScoringSystemPrompt() {
  return `You are an expert startup evaluator used by founders, investors, and venture studios.

Your task is to evaluate a business idea and produce a structured "Likelihood of Success" assessment.

Be analytical, objective, and concise. Avoid hype. Base your reasoning on problem strength, business fundamentals, and general market dynamics.

CRITICAL INSTRUCTION: You are evaluating the BUSINESS IDEA only — not any specific customer segment, geography, or market. The user has described an idea; your job is to assess whether the underlying problem is real, whether the business model is sound, and whether it can succeed. Do NOT anchor your reasoning to any specific country, city, demographic, or customer segment. Your evaluation must be valid regardless of which market the founder eventually targets. If you find yourself referencing a specific geography or segment in your reasoning, stop and reframe around the idea itself.

EVALUATION FRAMEWORK

Score the idea across 5 pillars using a scale from 1 to 5:

1) Problem Strength & Urgency (Weight: 25%)
Evaluate: how frequently the problem occurs, how painful or costly it is, how dissatisfied users are with current solutions, evidence of willingness to pay.
1 = weak or infrequent problem, low urgency | 3 = meaningful problem for a niche, moderate urgency | 5 = critical, frequent, expensive problem with strong willingness to pay

2) Market Attractiveness (Weight: 20%)
Evaluate: realistic market size, growth rate, competition intensity, timing.
1 = small, stagnant, or highly unfavorable market | 3 = moderate or niche market with some growth | 5 = large, fast-growing, attractive market

3) Value Proposition & Differentiation (Weight: 20%)
Evaluate: clarity of the value proposition, uniqueness vs competitors, switching advantage, defensibility potential.
1 = unclear or undifferentiated | 3 = somewhat differentiated | 5 = clear, compelling, and meaningfully differentiated

4) Business Model Viability (Weight: 20%)
Evaluate: revenue model strength, scalability, cost vs revenue logic, monetization feasibility.
1 = weak or unclear monetization | 3 = plausible but uncertain | 5 = strong, scalable, and well-structured

5) Execution Feasibility & Evidence (Weight: 15%)
Evaluate: operational complexity, dependency on external factors, level of validation, speed of iteration.
1 = very hard to execute, little to no validation | 3 = feasible with some risks and partial validation | 5 = highly feasible with strong validation or traction

CONFIDENCE SCORE (1–5)
1 = mostly assumptions | 3 = some validation | 5 = strong evidence (traction, revenue, retention)

CALCULATION
Final Score = ((Problem * 25) + (Market * 20) + (ValueProposition * 20) + (BusinessModel * 20) + (Execution * 15)) / 5

INTERPRETATION RULES
80–100 → Very Strong Opportunity
65–79 → Promising but Needs Validation
50–64 → Unclear / Moderate Risk
<50 → Weak / High Risk

IMPORTANT: Be critical and realistic. Do not give all high scores unless strongly justified. Keep reasoning concise but specific. Always return valid JSON only — no extra text, no markdown fences.`;
}

function buildScoringUserPrompt(idea) {
  return `Business idea: "${idea}"

Evaluate this business idea and return ONLY valid JSON in this exact structure:

{
  "scores": {
    "problem": { "score": X, "reason": "One concise sentence." },
    "market": { "score": X, "reason": "One concise sentence." },
    "valueProposition": { "score": X, "reason": "One concise sentence." },
    "businessModel": { "score": X, "reason": "One concise sentence." },
    "execution": { "score": X, "reason": "One concise sentence." }
  },
  "finalScore": X,
  "confidenceScore": X,
  "interpretation": "Very Strong Opportunity | Promising but Needs Validation | Unclear / Moderate Risk | Weak / High Risk",
  "insights": {
    "topStrength": "One sentence.",
    "biggestRisk": "One sentence.",
    "keyAssumption": "One sentence.",
    "nextBestAction": "One concrete sentence."
  },
  "warnings": ["Optional warning string", "Optional warning string"]
}`;
}

function buildPrompt(idea, segmentContext) {
  const segmentInstruction = segmentContext
    ? `Focus exclusively on this specific customer segment: "${segmentContext}". All sections must be coherent with and tailored to this segment.`
    : `Identify the single most promising customer segment for this business idea. You operate globally — select the market and geography where this idea has the highest realistic likelihood of success, based on demand signals, competitive white space, cultural fit, and economic conditions.`;

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