module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea, scores, finalScore, baseScore, averageEvidenceScore, evidenceMultiplier } = body;

  if (!idea || !scores) return res.status(400).json({ error: "idea and scores are required" });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are an expert startup coach and business strategist. A founder has evaluated their business idea and received a scored assessment. Your task is to identify the 2-3 pillars with the most improvement potential and provide specific, actionable refinements to help them strengthen their idea.

CRITICAL RULES — MUST FOLLOW:
- NEVER invent statistics, percentages, or specific numerical claims that the user did not already mention. If you do not know a real market figure, do not include one.
- NEVER fabricate benchmarks, studies, or data points. Only reference real, widely-known market facts you are confident are true.
- Recommendations must be structural or strategic — about how the idea is framed, who it targets, what problem it solves, or what differentiates it — NOT about adding made-up performance claims.
- The refinedIdeaSuggestion must enrich the idea by: (a) adding specific geographic or segment context if missing, (b) sharpening the problem statement, (c) clarifying the differentiation — all grounded in what is actually known about this market. Do NOT add invented metrics.
- Only surface pillars where qualityScore is below 4 OR evidenceScore is below 4.
- Prioritize by impact: which improvements would move the final score the most?
- Keep issue and recommendation text concise — one punchy sentence each.
- Estimate score improvements conservatively and realistically.
- Calculate projectedFinalScore using: Base Score = weighted avg of projected quality scores (Problem 25%, Market 20%, VP 20%, BM 20%, Execution 15%) / 5, multiplied by projected evidence multiplier.

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "levers": [
    {
      "pillar": "valueProposition",
      "pillarLabel": "Value proposition",
      "currentQuality": 2,
      "currentEvidence": 3,
      "projectedQuality": 4,
      "projectedEvidence": 4,
      "impact": "Highest impact",
      "issue": "One sentence: what is structurally weak and why it matters for the score.",
      "recommendations": [
        {
          "text": "One concrete sentence: a structural or strategic change to the idea — no invented numbers.",
          "pointsGained": "+4 pts on Value Proposition quality"
        }
      ]
    }
  ],
  "projectedFinalScore": 81,
  "projectedInterpretation": "Very Strong Opportunity",
  "refinedIdeaSuggestion": "2-3 sentences. Rewrite the idea incorporating: (1) specific geography or target segment if not already stated, (2) a sharper problem framing, (3) a clearer differentiator — all grounded in real market knowledge. Do NOT add any invented statistics or performance claims."
}`,
      messages: [{
        role: "user",
        content: `Analyze this business idea evaluation and identify the top 2-3 improvement levers. Do not invent any statistics or performance claims.

Business idea: "${idea}"

Current scores:
- Problem Strength: quality=${scores.problem?.qualityScore || 0}/5, evidence=${scores.problem?.evidenceScore || 0}/5
- Market Attractiveness: quality=${scores.market?.qualityScore || 0}/5, evidence=${scores.market?.evidenceScore || 0}/5
- Value Proposition: quality=${scores.valueProposition?.qualityScore || 0}/5, evidence=${scores.valueProposition?.evidenceScore || 0}/5
- Business Model: quality=${scores.businessModel?.qualityScore || 0}/5, evidence=${scores.businessModel?.evidenceScore || 0}/5
- Execution Feasibility: quality=${scores.execution?.qualityScore || 0}/5, evidence=${scores.execution?.evidenceScore || 0}/5

Current final score: ${finalScore}/100
Base score: ${baseScore}/100
Average evidence score: ${averageEvidenceScore}/5
Evidence multiplier: ${evidenceMultiplier}

Return the refinement plan as JSON. Every recommendation must be structural — no invented metrics or fabricated benchmarks.`
      }]
    })
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    return res.status(500).json({ error: "Refine API error", detail: data });
  }

  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: "JSON parse error", raw: clean });
  }
};
