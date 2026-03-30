module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea } = body;

  if (!idea) return res.status(400).json({ error: "idea is required" });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an expert startup evaluator used by founders, investors, and venture studios.

Your sole task is to evaluate a business idea — the concept itself — and produce a structured "Likelihood of Success" assessment.

CRITICAL: You are evaluating the BUSINESS IDEA only. You must not reference, infer, or reason about any specific customer segment, geography, country, city, or demographic. Your evaluation must assess the underlying problem strength, business model logic, and general market potential — independent of any particular target market. If you catch yourself mentioning a country, city, or specific segment in your reasoning, stop and reframe around the idea itself.

Be analytical, objective, and concise. Avoid hype. Be critical and realistic — do not give high scores unless strongly justified.

EVALUATION FRAMEWORK — score each pillar 1 to 5:

1) Problem Strength & Urgency (Weight: 25%)
How frequently does the problem occur? How painful or costly is it? How dissatisfied are users with current solutions? Is there evidence of willingness to pay?
1 = weak or infrequent problem | 3 = meaningful problem, moderate urgency | 5 = critical, frequent, expensive problem with strong willingness to pay

2) Market Attractiveness (Weight: 20%)
What is the realistic addressable market size? What is the growth trajectory? How intense is competition? Is the timing favorable?
1 = small, stagnant, or unfavorable | 3 = moderate niche with some growth | 5 = large, fast-growing, attractive market

3) Value Proposition & Differentiation (Weight: 20%)
How clear is the value proposition? How unique is it versus existing alternatives? Is there switching advantage? Can it be defended?
1 = unclear or undifferentiated | 3 = somewhat differentiated | 5 = clear, compelling, meaningfully differentiated

4) Business Model Viability (Weight: 20%)
How strong is the revenue model? How scalable is it? Does the cost vs revenue logic hold? Is monetization feasible?
1 = weak or unclear monetization | 3 = plausible but uncertain | 5 = strong, scalable, well-structured

5) Execution Feasibility (Weight: 15%)
How complex is execution? How dependent is it on external factors? What level of validation exists? How fast can it iterate?
1 = very hard to execute, no validation | 3 = feasible with manageable risks | 5 = highly feasible with strong validation

CONFIDENCE SCORE (1–5): How much evidence exists to support this evaluation?
1 = mostly assumptions | 3 = some validation | 5 = strong traction or revenue

CALCULATION:
Final Score = ((Problem * 25) + (Market * 20) + (ValueProposition * 20) + (BusinessModel * 20) + (Execution * 15)) / 5

INTERPRETATION:
80–100 → Very Strong Opportunity
65–79 → Promising but Needs Validation
50–64 → Unclear / Moderate Risk
<50 → Weak / High Risk

Return ONLY valid JSON — no markdown fences, no explanation, nothing else.`,
      messages: [{
        role: "user",
        content: `Evaluate this business idea: "${idea}"

Return ONLY valid JSON in this exact structure:

{
  "scores": {
    "problem": { "score": X, "reason": "One concise sentence about the idea's problem strength — no geography, no segment." },
    "market": { "score": X, "reason": "One concise sentence about general market potential — no geography, no segment." },
    "valueProposition": { "score": X, "reason": "One concise sentence about differentiation — no geography, no segment." },
    "businessModel": { "score": X, "reason": "One concise sentence about revenue model strength — no geography, no segment." },
    "execution": { "score": X, "reason": "One concise sentence about execution complexity — no geography, no segment." }
  },
  "finalScore": X,
  "confidenceScore": X,
  "interpretation": "Very Strong Opportunity | Promising but Needs Validation | Unclear / Moderate Risk | Weak / High Risk",
  "insights": {
    "topStrength": "One sentence about the idea's strongest point.",
    "biggestRisk": "One sentence about the idea's biggest risk.",
    "keyAssumption": "One sentence about the most critical unvalidated assumption.",
    "nextBestAction": "One concrete sentence — the single most important thing to do next."
  },
  "warnings": [
    "Optional warning if a specific risk pattern is detected.",
    "Optional second warning."
  ]
}`
      }]
    })
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    return res.status(500).json({ error: "Scoring API error", detail: data });
  }

  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: "JSON parse error", raw: clean });
  }
};