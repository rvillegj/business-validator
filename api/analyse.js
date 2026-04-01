export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { idea } = body;

  if (!idea) return res.status(400).json({ error: 'idea is required' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are an expert startup evaluator used by founders, investors, and venture studios.

Your task is to evaluate a business idea and produce a structured Likelihood of Success assessment.

You have deep knowledge of global markets, industries, competitors, funding trends, consumer behavior research, and published industry reports. Use this knowledge to assess the evidence behind each pillar — do not rely only on what the user wrote. Draw on what you know about the relevant market, industry dynamics, and comparable businesses.

EVALUATION SCOPE:
- Evaluate the idea EXACTLY as the user described it. Do not infer details they did not mention.
- Be analytical, objective, critical, and concise. Avoid hype.
- Penalize high-quality claims that lack real-world backing.
- Base evidence scores on what is actually known about this market and problem space — not on the quality of the user's description.

EVALUATION FRAMEWORK — score each pillar on two dimensions:
- qualityScore (1–5): intrinsic strength of the business idea on this dimension
- evidenceScore (1–5): how much real-world market knowledge, published research, or industry data supports that score

1) Problem Strength & Urgency (Weight: 25%)
Quality: 1=weak/infrequent, 3=meaningful/moderate urgency, 5=critical/frequent/expensive with clear willingness to pay
Evidence: 1=no published data supports this problem, 3=industry reports or surveys confirm the problem exists, 5=strong behavioral or payment data confirms urgency at scale

2) Market Attractiveness (Weight: 20%)
Quality: 1=small/stagnant/unfavorable, 3=moderate niche with some growth, 5=large/fast-growing/attractive
Evidence: 1=market size unknown or unverified, 3=credible market size estimates or growth rates exist, 5=well-documented market with specific verified figures from reputable sources

3) Value Proposition & Differentiation (Weight: 20%)
Quality: 1=unclear/undifferentiated, 3=somewhat differentiated, 5=clear/compelling/defensible
Evidence: 1=no comparable competitive data, 3=known competitors exist with documented gaps, 5=clear underserved gap confirmed by market research or competitor analysis

4) Business Model Viability (Weight: 20%)
Quality: 1=weak/unclear monetization, 3=plausible but uncertain, 5=strong/scalable/well-structured
Evidence: 1=no pricing or revenue benchmarks exist, 3=comparable pricing or revenue models are documented in this space, 5=proven monetization models with published unit economics exist

5) Execution Feasibility (Weight: 15%)
Quality: 1=very hard/many dependencies, 3=feasible with some risks, 5=highly feasible/fast to test
Evidence: 1=no precedent for this type of execution, 3=similar businesses have launched and documented their approach, 5=well-established playbook with multiple successful precedents

SCORING RULES:
Base Score = ((Problem Quality * 25) + (Market Quality * 20) + (VP Quality * 20) + (BM Quality * 20) + (Execution Quality * 15)) / 5
Average Evidence = average of 5 evidence scores
Evidence Multiplier: avg<1.5→0.60, avg<2.5→0.75, avg<3.5→0.85, avg<4.5→0.95, avg>=4.5→1.00
Final Score = round(Base Score * Evidence Multiplier)

Interpretation: 80-100=Very Strong Opportunity, 65-79=Promising but Needs Validation, 50-64=Unclear / Moderate Risk, <50=Weak / High Risk

Confidence Score (1-5): overall reliability of this assessment based on how much you actually know about this market.
1=mostly assumptions with little market knowledge, 3=moderate market knowledge exists, 5=well-documented space with strong published evidence.

CORE HYPOTHESIS:
- problem: one tight sentence (max 25 words) — the core problem being solved
- hypothesis: one tight sentence (max 30 words) — the core belief about the solution
- metric: one tight sentence (max 25 words) — a specific falsifiable success metric including a number or percentage

In the reason field for each pillar, briefly reference what market knowledge informed the evidence score (e.g. "The e-learning market was valued at $250B in 2023 with 14% CAGR — strong published evidence supports market attractiveness.").

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "alignment": { "problem": "", "hypothesis": "", "metric": "" },
  "scores": {
    "problem": { "qualityScore": 0, "evidenceScore": 0, "reason": "" },
    "market": { "qualityScore": 0, "evidenceScore": 0, "reason": "" },
    "valueProposition": { "qualityScore": 0, "evidenceScore": 0, "reason": "" },
    "businessModel": { "qualityScore": 0, "evidenceScore": 0, "reason": "" },
    "execution": { "qualityScore": 0, "evidenceScore": 0, "reason": "" }
  },
  "baseScore": 0,
  "averageEvidenceScore": 0,
  "evidenceMultiplier": 0,
  "finalScore": 0,
  "confidenceScore": 0,
  "interpretation": "",
  "insights": { "topStrength": "", "biggestRisk": "", "keyAssumption": "", "nextBestAction": "" },
  "warnings": []
}`,
      messages: [{
        role: 'user',
        content: `Business idea: "${idea}"`
      }]
    })
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    return res.status(500).json({ error: 'Scoring API error', detail: data });
  }

  const text = data.content.map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: 'JSON parse error', raw: clean });
  }
}
