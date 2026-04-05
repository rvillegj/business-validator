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
      system: `You are an expert startup coach and business strategist. A founder has evaluated their business idea and received a scored assessment. Your task is to identify the 2-3 pillars with the most improvement potential and provide specific, actionable refinements they can make to their idea description to increase the likelihood of success score.

RULES:
- Only surface pillars where qualityScore is below 4 OR evidenceScore is below 4
- Prioritize by impact: which improvements would move the final score the most?
- Be specific and concrete — tell the user exactly what to add or change in their idea description
- Each recommendation must be directly implementable as a change to the idea text
- Estimate score improvements conservatively and realistically
- The projected final score must be calculated using the same formula: Base Score = weighted average of quality scores (Problem 25%, Market 20%, VP 20%, BM 20%, Execution 15%) / 5, then multiplied by evidence multiplier
- Keep reasons and recommendations concise — one punchy sentence each

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
      "issue": "One sentence: what is weak and why it matters.",
      "recommendations": [
        {
          "text": "One concrete sentence: exactly what to add or change in the idea description.",
          "pointsGained": "+4 pts on Value Proposition quality"
        },
        {
          "text": "Second recommendation if needed.",
          "pointsGained": "+2 pts on Value Proposition quality"
        }
      ]
    }
  ],
  "projectedFinalScore": 81,
  "projectedInterpretation": "Very Strong Opportunity",
  "refinedIdeaSuggestion": "A revised version of the idea description (2-3 sentences) that incorporates all the recommended improvements. This is what gets pre-filled when the user clicks Apply."
}`,
      messages: [{
        role: "user",
        content: `Analyze this business idea evaluation and identify the top 2-3 improvement levers.

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

Identify the 2-3 pillars with the most improvement potential and return the refinement plan as JSON.`
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
