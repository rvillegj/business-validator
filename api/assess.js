module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea } = body;

  try {
    // Pass 1: Research and reasoning with web search
    const pass1Response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `You are an expert startup evaluator. A user has this business idea for the Costa Rican market: "${idea}"

Search the web to find current, real evidence about:
1. The size and growth of this market in Costa Rica and Latin America
2. Existing competitors or similar businesses operating in Costa Rica
3. Recent consumer trends relevant to this idea in Costa Rica
4. Any evidence of willingness to pay or validated demand for this type of solution
5. Barriers to entry or execution risks specific to Costa Rica

After researching, write a structured analysis covering these 5 pillars. Be candid and evidence-based. Clearly distinguish between what you found from real sources versus what you are inferring.

For each pillar write 2-3 sentences of honest reasoning:

PROBLEM STRENGTH & URGENCY:
[your evidence-based reasoning]

MARKET ATTRACTIVENESS:
[your evidence-based reasoning]

VALUE PROPOSITION & DIFFERENTIATION:
[your evidence-based reasoning]

BUSINESS MODEL VIABILITY:
[your evidence-based reasoning]

EXECUTION FEASIBILITY:
[your evidence-based reasoning]

OVERALL CONFIDENCE NOTE:
[state honestly how much real evidence exists vs assumptions, and rate confidence 1-5]`
        }]
      })
    });

    const pass1Data = await pass1Response.json();

    if (!pass1Response.ok) {
      return res.status(500).json({ error: "Pass 1 API error", detail: pass1Data });
    }

    const content = pass1Data.content || [];
    const reasoning = content
      .filter(b => b && b.type === "text")
      .map(b => b.text || "")
      .join("\n")
      .trim();

    const finalReasoning = reasoning.length > 50
      ? reasoning
      : "Limited research available. Assessment based on general market knowledge.";

    // Pass 2: Score strictly based on reasoning from Pass 1
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
          content: `You are a startup evaluator. Based STRICTLY on the following research and reasoning — do not add new information — assign scores and produce the final assessment.

BUSINESS IDEA: "${idea}"

RESEARCH AND REASONING:
${finalReasoning}

SCORING RULES:
- Score each pillar 1-5 based ONLY on the reasoning above
- Do not give high scores without evidence
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
      return res.status(500).json({ error: "Pass 2 API error", detail: errData });
    }

    const pass2Data = await pass2Response.json();
    const text = (pass2Data.content || []).map(b => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    res.status(200).json(JSON.parse(clean));

  } catch (err) {
    res.status(500).json({ error: "Assessment failed", message: err.message });
  }
};