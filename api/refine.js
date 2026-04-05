module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { idea, scores, finalScore, baseScore, averageEvidenceScore, evidenceMultiplier } = body;

  if (!idea || !scores) return res.status(400).json({ error: "idea and scores are required" });

  const systemPrompt = `You are an expert startup coach and business strategist. Your task is to identify 2-3 pillars with improvement potential and provide actionable refinements.

CRITICAL RULES:
- NEVER invent statistics, percentages, or numerical claims the user did not mention.
- NEVER fabricate benchmarks or data points.
- Recommendations must be structural: framing, targeting, problem clarity, differentiation only.
- refinedIdeaSuggestion: add geography/segment context if missing, sharper problem, clearer differentiator. No invented metrics.
- Only surface pillars where qualityScore < 4 OR evidenceScore < 4.
- projectedInterpretation MUST be exactly one of these four strings: "Very Strong Opportunity" | "Promising but Needs Validation" | "Unclear / Moderate Risk" | "Weak / High Risk"

Return ONLY valid JSON, no markdown:
{"levers":[{"pillar":"valueProposition","pillarLabel":"Value proposition","currentQuality":2,"currentEvidence":3,"projectedQuality":4,"projectedEvidence":4,"impact":"Highest impact","issue":"One sentence.","recommendations":[{"text":"One concrete structural sentence.","pointsGained":"+4 pts on Value Proposition quality"}]}],"projectedFinalScore":81,"projectedInterpretation":"Very Strong Opportunity","refinedIdeaSuggestion":"2-3 sentences."}`;

  const userPrompt = `Analyze and identify top 2-3 improvement levers. No invented stats.

Business idea: "${idea}"

Scores:
- Problem: Q${scores.problem?.qualityScore||0} E${scores.problem?.evidenceScore||0}
- Market: Q${scores.market?.qualityScore||0} E${scores.market?.evidenceScore||0}
- Value Proposition: Q${scores.valueProposition?.qualityScore||0} E${scores.valueProposition?.evidenceScore||0}
- Business Model: Q${scores.businessModel?.qualityScore||0} E${scores.businessModel?.evidenceScore||0}
- Execution: Q${scores.execution?.qualityScore||0} E${scores.execution?.evidenceScore||0}

Final score: ${finalScore}/100, Base: ${baseScore}/100, Avg evidence: ${averageEvidenceScore}/5, Multiplier: ${evidenceMultiplier}

projectedInterpretation must be exactly one of: "Very Strong Opportunity", "Promising but Needs Validation", "Unclear / Moderate Risk", "Weak / High Risk"`;

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
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  const data = await response.json();
  if (!response.ok || !data.content) {
    return res.status(500).json({ error: "Refine API error", detail: data });
  }

  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(clean);
    const valid = ["Very Strong Opportunity","Promising but Needs Validation","Unclear / Moderate Risk","Weak / High Risk"];
    const s = parsed.projectedFinalScore || 0;
    if (!valid.includes(parsed.projectedInterpretation)) {
      parsed.projectedInterpretation = s >= 80 ? "Very Strong Opportunity" : s >= 65 ? "Promising but Needs Validation" : s >= 50 ? "Unclear / Moderate Risk" : "Weak / High Risk";
    }
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: "JSON parse error", raw: clean });
  }
};
