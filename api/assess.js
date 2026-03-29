module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea } = body;

  try {
    // Pass 1: Research and reasoning (no web search)
    const pass1Response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `You are an expert startup evaluator with deep knowledge of the Costa Rican market.

A user has this business idea: "${idea}"

Write a structured analysis covering these 5 pillars. Be candid, critical, and realistic. Base your reasoning on your knowledge of Costa Rica's market dynamics, consumer behavior, competition, and business fundamentals. Clearly note where you are uncertain.

PROBLEM STRENGTH & URGENCY:
[2-3 sentences: how frequent, painful, and costly is this problem? Is there evidence of willingness to pay?]

MARKET ATTRACTIVENESS:
[2-3 sentences: what is the realistic market size in Costa Rica? Is it growing? How competitive is it?]

VALUE PROPOSITION & DIFFERENTIATION:
[2-3 sentences: how unique is this? What makes it better than existing alternatives in Costa Rica?]

BUSINESS MODEL VIABILITY:
[2-3 sentences: how strong is the monetization logic? Is it scalable? Do costs and revenues align?]

EXECUTION FEASIBILITY:
[2-3 sentences: how hard is this to execute? What are the key dependencies and risks?]

CONFIDENCE NOTE:
[1 sentence: rate your confidence 1-5 and explain why]`
        }]
      })
    });

    const pass1Data = await pass1Response.json();

    if (!pass1Response.ok || !pass1Data.content) {
      return res.status(500).json({ error: "Pass 1 failed", detail: pass1Data });
    }

    const reasoning = pass1Data.content
      .map(b => b.text || "")
      .join("\n")
      .trim();

    // Pass 2: Score based strictly on Pass 1 reasoning
    const pass2Response = await fetch("https://api.anthropic.com/v1/messages", {
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
          content: `You are a startup evaluator. Based STRICTLY on the following reasoning — do not add new information — assign scores and produce the final assessment.

BUSINESS IDEA: "${idea}"

RESEARCH AND REASONING:
${reasoning}

SCORING RULES:
- Score each pillar 1-5 based ONLY on the reasoning above
- Do not give high scores without clear justification in the reasoning
- If confidence is 1 or 2, interpretation must be "Unclear / Moderate Risk" or "Weak / High Risk"

WEIGHTS:
- Problem Strength: 25%
- Market Attractiveness: 20%
- Value Proposition: 20%
- Business Model: 20%
- Execution Feasibility: 15%

Final Score = ((Problem * 25) + (Market * 20) + (ValueProp * 20) + (BusinessModel * 20) + (Execution * 15)) / 5

INTERPRETATION:
80-100 = Very Strong Opportunity
65-79 = Promising but Needs Validation
50-64 = Unclear / Moderate Risk
<50 = Weak / High Risk

Return ONLY valid JSON — no markdown fences, no explanation:

{
  "scores": {
    "problem": { "score": 3, "reason": "One concise sentence from the reasoning." },
    "market": { "score": 3, "reason": "One concise sentence from the reasoning." },
    "valueProposition": { "score": 3, "reason": "One concise sentence from the reasoning." },
    "businessModel": { "score": 3, "reason": "One concise sentence from the reasoning." },
    "execution": { "score": 3, "reason": "One concise sentence from the reasoning." }
  },
  "finalScore": 60,
  "confidenceScore": 2,
  "interpretation": "Promising but Needs Validation",
  "insights": {
    "topStrength": "One concise sentence.",
    "biggestRisk": "One concise sentence.",
    "keyAssumption": "One concise sentence.",
    "nextBestAction": "One concise sentence."
  },
  "warnings": ["One warning if relevant."]
}`
        }]
      })
    });

    if (!pass2Response.ok) {
      const errData = await pass2Response.json();
      return res.status(500).json({ error: "Pass 2 failed", detail: errData });
    }

    const pass2Data = await pass2Response.json();
    const text = (pass2Data.content || []).map(b => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    res.status(200).json(JSON.parse(clean));

  } catch (err) {
    res.status(500).json({ error: "Assessment failed", message: err.message });
  }
};