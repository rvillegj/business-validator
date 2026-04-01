export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { idea } = body;

  if (!idea) return res.status(400).json({ error: 'idea is required' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  // ── PASS 1: Web search for market research evidence ───────────────────────
  let marketIntelligence = '';

  try {
    const searchResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `You are a market research analyst. Search the web and gather real-world evidence for this business idea across five dimensions:
1. Market size and growth rate for the relevant industry
2. Existing competitors and their traction or funding
3. Consumer demand trends and signals
4. Geographic market data if a location is mentioned
5. Published research, reports, or news indicating momentum or decline in this space

Business idea: "${idea}"

After searching, write a concise market intelligence summary (max 200 words). Be specific — cite numbers, growth rates, or named competitors where found. If no data exists for a dimension, say so explicitly.`
        }]
      })
    });

    const searchData = await searchResponse.json();
    if (searchResponse.ok && searchData.content) {
      marketIntelligence = searchData.content
        .filter(b => b.type === 'text')
        .map(b => b.text || '')
        .join('\n')
        .trim();
    }
  } catch (e) {
    marketIntelligence = 'No market research data could be retrieved.';
  }

  // ── PASS 2: Score using market intelligence as evidence context ───────────
  const scoreResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are an expert startup evaluator used by founders, investors, and venture studios.

Evaluate the business idea using both the user's description and the market intelligence provided from web research.

Use market intelligence to inform evidence scores. Evidence scores reflect how much real-world published data supports each pillar — not the quality of the user's description.

EVALUATION SCOPE:
- Evaluate the idea EXACTLY as described. Do not infer details the user did not mention.
- Be analytical, objective, critical. Avoid hype. Penalize unsupported claims.

FRAMEWORK — score each pillar on two dimensions:
- qualityScore (1–5): intrinsic business strength on this dimension
- evidenceScore (1–5): real-world proof from market research

1) Problem Strength & Urgency (Weight: 25%)
Quality: 1=weak/infrequent, 3=meaningful/moderate urgency, 5=critical/frequent/expensive with willingness to pay
Evidence: 1=no data found, 3=some published research, 5=strong behavioral data or surveys with numbers

2) Market Attractiveness (Weight: 20%)
Quality: 1=small/stagnant, 3=moderate niche with growth, 5=large/fast-growing/attractive
Evidence: 1=no market data, 3=some size or growth estimates, 5=verified reports with specific figures

3) Value Proposition & Differentiation (Weight: 20%)
Quality: 1=unclear/undifferentiated, 3=somewhat differentiated, 5=clear/compelling/defensible
Evidence: 1=no competitor data, 3=some competitor or preference data, 5=clear market gap verified by research

4) Business Model Viability (Weight: 20%)
Quality: 1=weak/unclear monetization, 3=plausible but uncertain, 5=strong/scalable/well-structured
Evidence: 1=no pricing or revenue data, 3=comparable pricing data exists, 5=verified revenue models in this space

5) Execution Feasibility (Weight: 15%)
Quality: 1=very hard/many dependencies, 3=feasible with some risks, 5=highly feasible/fast to test
Evidence: 1=no comparable execution data, 3=similar businesses have launched, 5=proven playbook exists in research

SCORING:
Base Score = ((Problem Quality * 25) + (Market Quality * 20) + (VP Quality * 20) + (BM Quality * 20) + (Execution Quality * 15)) / 5
Average Evidence = average of 5 evidence scores
Evidence Multiplier: avg<1.5→0.60, avg<2.5→0.75, avg<3.5→0.85, avg<4.5→0.95, avg>=4.5→1.00
Final Score = round(Base Score * Evidence Multiplier)

Interpretation: 80-100=Very Strong Opportunity, 65-79=Promising but Needs Validation, 50-64=Unclear / Moderate Risk, <50=Weak / High Risk

Confidence Score (1-5): reliability of this assessment based on quality and consistency of market research found.

CORE HYPOTHESIS:
- problem: one tight sentence (max 25 words) — the core problem being solved
- hypothesis: one tight sentence (max 30 words) — the core belief about the solution
- metric: one tight sentence (max 25 words) — a specific falsifiable success metric with a number or percentage

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
        content: `Business idea: "${idea}"\n\nMarket intelligence from web research:\n${marketIntelligence || 'No market data available.'}`
      }]
    })
  });

  const scoreData = await scoreResponse.json();

  if (!scoreResponse.ok || !scoreData.content) {
    return res.status(500).json({ error: 'Scoring API error', detail: scoreData });
  }

  const text = scoreData.content.map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: 'JSON parse error', raw: clean });
  }
}
