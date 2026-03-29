module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea, canvasData } = body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: buildPrompt(idea, canvasData) }]
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

function buildPrompt(idea, canvasData) {
  return `You are an expert startup evaluator used by founders, investors, and venture studios.

Your task is to evaluate a business idea based on its Business Model Canvas and produce a structured "Likelihood of Success" assessment.

Be analytical, objective, and concise. Avoid hype. Base your reasoning on market dynamics, problem strength, and business fundamentals. Be candid and realistic — this assessment helps people make informed investment decisions.

BUSINESS IDEA: "${idea}"

BUSINESS MODEL CANVAS DATA:
${JSON.stringify(canvasData, null, 2)}

EVALUATION FRAMEWORK

Score the idea across 5 pillars using a scale from 1 to 5:

1) Problem Strength & Urgency (Weight: 25%)
- How frequently the problem occurs
- How painful or costly it is
- How dissatisfied users are with current solutions
- Evidence of willingness to pay
1 = weak or infrequent problem | 3 = meaningful problem, moderate urgency | 5 = critical, frequent, expensive problem

2) Market Attractiveness (Weight: 20%)
- Realistic market size in Costa Rica
- Growth rate and timing
- Competition intensity
1 = small, stagnant, unfavorable | 3 = moderate niche with some growth | 5 = large, fast-growing, attractive

3) Value Proposition & Differentiation (Weight: 20%)
- Clarity and uniqueness vs competitors
- Switching advantage and defensibility
1 = unclear or undifferentiated | 3 = somewhat differentiated | 5 = clear, compelling, meaningfully differentiated

4) Business Model Viability (Weight: 20%)
- Revenue model strength and scalability
- Cost vs revenue logic and monetization feasibility
1 = weak or unclear monetization | 3 = plausible but uncertain | 5 = strong, scalable, well-structured

5) Execution Feasibility (Weight: 15%)
- Operational complexity and dependencies
- Level of validation and speed of iteration
1 = very hard to execute, no validation | 3 = feasible with some risks | 5 = highly feasible with strong validation

CONFIDENCE SCORE (1-5):
1 = mostly assumptions | 3 = some validation | 5 = strong evidence

CALCULATION:
Final Score = ((Problem * 25) + (Market * 20) + (ValueProp * 20) + (BusinessModel * 20) + (Execution * 15)) / 5

INTERPRETATION:
80-100 = Very Strong Opportunity
65-79 = Promising but Needs Validation
50-64 = Unclear / Moderate Risk
<50 = Weak / High Risk

Return ONLY valid JSON — no markdown fences, no explanation:

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
    "topStrength": "One concise sentence.",
    "biggestRisk": "One concise sentence.",
    "keyAssumption": "One concise sentence.",
    "nextBestAction": "One concise sentence."
  },
  "warnings": ["One warning sentence if relevant.", "Second warning if needed."]
}`;
}