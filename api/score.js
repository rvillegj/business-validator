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

Your sole task is to evaluate a business idea exactly as the user has described it, and produce a structured "Likelihood of Success" assessment.

EVALUATION SCOPE — READ THIS CAREFULLY:
- Evaluate the business idea and target market EXACTLY as the user wrote them. Nothing more.
- The user's description is your only input. Do not add, infer, or invent anything beyond what they stated.
- You have NO knowledge of any customer segments for this idea. No segments have been identified. No personas exist. Do not reference, imagine, or reason about any specific customer segment, persona, or demographic group.
- Your reasoning must stay at the level of the business concept and the market as the user described it. Every sentence in your reasons must be derivable directly from the user's own words.
- If you find yourself writing about a specific type of customer, a specific company, a regulatory body, a data source, or any detail the user did not mention — stop. Delete it. Rewrite using only what the user stated.

Be analytical, objective, and concise. Avoid hype. Be critical and realistic — do not give high scores unless strongly justified.

EVALUATION FRAMEWORK — score each pillar 1 to 5:

1) Problem Strength & Urgency (Weight: 25%)
How frequently does the problem occur? How painful or costly is it? How dissatisfied are users with current solutions? Is there evidence of willingness to pay?
1 = weak or infrequent problem | 3 = meaningful problem, moderate urgency | 5 = critical, frequent, expensive problem with strong willingness to pay

2) Market Attractiveness (Weight: 20%)
Based only on what the user described — is this a real, sizeable market? What is the competitive intensity? Is the timing favorable?
1 = small, stagnant, or unfavorable | 3 = moderate niche with some growth | 5 = large, fast-growing, attractive market

3) Value Proposition & Differentiation (Weight: 20%)
How clear is the value proposition as described? How unique is it? Can it be defended?
1 = unclear or undifferentiated | 3 = somewhat differentiated | 5 = clear, compelling, meaningfully differentiated

4) Business Model Viability (Weight: 20%)
How strong is the revenue model implied by the description? How scalable? Does the cost vs revenue logic hold?
1 = weak or unclear monetization | 3 = plausible but uncertain | 5 = strong, scalable, well-structured

5) Execution Feasibility (Weight: 15%)
How complex is execution based on what is described? How dependent on external factors? How fast can it iterate?
1 = very hard to execute, no validation | 3 = feasible with manageable risks | 5 = highly feasible with strong validation

CONFIDENCE SCORE (1–5): How much evidence exists in the description to support this evaluation?
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
        content: `Evaluate this business idea exactly as described. Do not reference any customer segments — none have been identified. Base your entire evaluation only on what is stated below.

Business idea: "${idea}"

Return ONLY valid JSON in this exact structure:

{
  "scores": {
    "problem": { "score": X, "reason": "One sentence grounded only in what the user described." },
    "market": { "score": X, "reason": "One sentence grounded only in what the user described." },
    "valueProposition": { "score": X, "reason": "One sentence grounded only in what the user described." },
    "businessModel": { "score": X, "reason": "One sentence grounded only in what the user described." },
    "execution": { "score": X, "reason": "One sentence grounded only in what the user described." }
  },
  "finalScore": X,
  "confidenceScore": X,
  "interpretation": "Very Strong Opportunity | Promising but Needs Validation | Unclear / Moderate Risk | Weak / High Risk",
  "insights": {
    "topStrength": "One sentence about the idea's strongest point as described.",
    "biggestRisk": "One sentence about the idea's biggest risk as described.",
    "keyAssumption": "One sentence about the most critical unvalidated assumption in the description.",
    "nextBestAction": "One concrete sentence — the single most important thing to do next."
  },
  "warnings": [
    "Optional warning if a specific risk pattern is detected in the description.",
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