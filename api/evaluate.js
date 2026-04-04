export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { idea, geography } = body;
  if (!idea) return res.status(400).json({ error: 'idea is required' });

  try {
    const ctx = { idea, geography: geography || null };

    // ── Agent 1: Market & Customer Researcher ──────────────────────────────
    ctx.output1 = await runAgent({
      useWebSearch: true,
      system: `You are an unparalleled global market research strategist.

You combine real-time web intelligence with deep cross-cultural expertise.
Your job: search for real market data about the given business idea, identify
the most promising geography, and recommend exactly 3 distinct customer segments
ordered from highest to lowest market potential.

Rules:
- Use web search to find real market size figures, growth rates, demand signals,
  competitor names, and industry reports. Cite your sources.
- Never invent data. If a figure isn't found, say so in marketContext.
- Segments must be meaningfully different — not variations of the same persona.
- Each segment needs a crisp name (3-5 words max), a one-sentence profile, and
  a clear reason why this idea solves a real problem for them.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"
${ctx.geography ? `Preferred geography: ${ctx.geography}` : ''}

Search the web for market data, then return this exact JSON:
{
  "geography": "Primary market country or region",
  "marketContext": "2-3 sentences summarizing market conditions, size, and growth from real sources",
  "marketSize": "Specific figure with source if found, e.g. '$4.2B in 2024 (Statista)'",
  "growthRate": "e.g. '14% CAGR through 2028' or 'not found'",
  "segments": [
    {
      "name": "Segment name (3-5 words)",
      "profile": "One sentence: who they are, where, why this problem matters to them",
      "size": "Estimated addressable size or 'unknown'",
      "urgency": "high | medium | low",
      "willingness_to_pay": "One sentence on pricing signals for this segment"
    },
    { "name": "", "profile": "", "size": "", "urgency": "", "willingness_to_pay": "" },
    { "name": "", "profile": "", "size": "", "urgency": "", "willingness_to_pay": "" }
  ],
  "demandSignals": ["Signal 1 from web search", "Signal 2", "Signal 3"],
  "keyCompetitors": ["Competitor A", "Competitor B", "Competitor C"],
  "sources": ["URL or publication name 1", "URL or publication name 2"]
}`
    });

    // ── Agent 2: Chief Product Officer ────────────────────────────────────
    ctx.output2 = await runAgent({
      system: `You are a Chief Product Officer with 20 years of experience launching
products across B2B SaaS, consumer apps, and marketplace businesses globally.

You have just received a market research brief from your Head of Research.
Your job: assess whether this business idea has real product-market fit potential,
evaluate desirability and feasibility from a product lens, and identify the MVP scope.

Be critical. Most ideas have a fatal flaw — name it if you find it. Do not validate
mediocre ideas. Your reputation depends on intellectual honesty.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"

Market research findings:
${JSON.stringify(ctx.output1, null, 2)}

Return this exact JSON:
{
  "productMarketFit": "high | medium | low",
  "productMarketFitRationale": "2-3 sentences explaining why",
  "desirability": {
    "score": 1,
    "rationale": "One sentence"
  },
  "feasibility": {
    "score": 1,
    "rationale": "One sentence"
  },
  "viability": {
    "score": 1,
    "rationale": "One sentence"
  },
  "coreValueProposition": "One crisp sentence — what this product does and for whom",
  "mvpScope": {
    "coreProblem": "The single problem the MVP must solve",
    "mustHaveFeatures": ["Feature 1", "Feature 2", "Feature 3"],
    "explicitlyExcluded": ["Thing to cut 1", "Thing to cut 2"]
  },
  "fatalFlaw": "The most dangerous product risk, or 'none identified'",
  "productInsights": ["Insight 1", "Insight 2", "Insight 3"]
}`
    });

    // ── Agent 3: Data Scientist ───────────────────────────────────────────
    ctx.output3 = await runAgent({
      system: `You are a senior data scientist specializing in startup viability modeling.

You have received a market research report and a product assessment. Your job:
score this business idea across 5 weighted pillars using both a quality score
(intrinsic business strength) and an evidence score (real-world data support).
Use ALL prior context to make evidence scores as grounded as possible.

Scoring rules:
- qualityScore (1-5): intrinsic strength on this dimension
- evidenceScore (1-5): how much real data from prior agents supports that score
- Base Score = ((problem*25) + (market*20) + (vp*20) + (bm*20) + (execution*15)) / 5
- Average Evidence = mean of 5 evidence scores
- Multiplier: avg<1.5→0.60, avg<2.5→0.75, avg<3.5→0.85, avg<4.5→0.95, avg≥4.5→1.00
- Final Score = round(Base Score × Multiplier)
- Interpretation: 80-100=Very Strong, 65-79=Promising, 50-64=Moderate Risk, <50=Weak

Be critical. Do not give all high scores unless strongly justified by evidence.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"

Market research: ${JSON.stringify(ctx.output1, null, 2)}
Product assessment: ${JSON.stringify(ctx.output2, null, 2)}

Return this exact JSON:
{
  "scores": {
    "problem": { "qualityScore": 0, "evidenceScore": 0, "reason": "One sentence citing specific evidence" },
    "market": { "qualityScore": 0, "evidenceScore": 0, "reason": "One sentence citing specific evidence" },
    "valueProposition": { "qualityScore": 0, "evidenceScore": 0, "reason": "One sentence citing specific evidence" },
    "businessModel": { "qualityScore": 0, "evidenceScore": 0, "reason": "One sentence citing specific evidence" },
    "execution": { "qualityScore": 0, "evidenceScore": 0, "reason": "One sentence citing specific evidence" }
  },
  "baseScore": 0,
  "averageEvidenceScore": 0,
  "evidenceMultiplier": 0,
  "finalScore": 0,
  "interpretation": "Very Strong Opportunity | Promising but Needs Validation | Unclear / Moderate Risk | Weak / High Risk",
  "confidenceScore": 0,
  "weakestPillar": "problem | market | valueProposition | businessModel | execution",
  "hypothesis": {
    "problem": "The core problem in one tight sentence (max 25 words)",
    "statement": "The core belief about the solution in one tight sentence (max 30 words)",
    "metric": "A falsifiable experiment completable in 1-4 weeks with a specific number and timeframe"
  },
  "warnings": ["Warning 1 if applicable", "Warning 2 if applicable"]
}`
    });

    // ── Agent 4: Financial Modeler ────────────────────────────────────────
    ctx.output4 = await runAgent({
      system: `You are a CFO-level financial modeler with deep experience in early-stage
ventures across SaaS, marketplaces, services, and consumer businesses.

You have received market research, product assessment, and a viability score.
Your job: model the financial reality of this business — not optimistically,
but realistically. Anchor every figure to the market data provided.

If key data is missing, say so explicitly and model conservative assumptions.
Do not fabricate precise figures — use ranges when uncertain.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"

Market research: ${JSON.stringify(ctx.output1, null, 2)}
Product assessment: ${JSON.stringify(ctx.output2, null, 2)}
Viability scores: ${JSON.stringify(ctx.output3, null, 2)}

Return this exact JSON:
{
  "revenueModel": "Primary revenue model in one sentence",
  "pricingRange": {
    "low": "e.g. $9/mo or $50 one-time",
    "high": "e.g. $99/mo or $500/project",
    "rationale": "One sentence on pricing logic anchored to market data"
  },
  "unitEconomics": {
    "estimatedCAC": "Customer acquisition cost range or 'unknown'",
    "estimatedLTV": "Lifetime value estimate or range",
    "ltvCacRatio": "e.g. '3:1 estimated' or 'insufficient data'",
    "grossMarginRange": "e.g. '60-80%' for SaaS or range for this model"
  },
  "breakEvenTimeline": {
    "months": 0,
    "assumptions": "Key assumptions behind this estimate in one sentence"
  },
  "revenueStreams": [
    { "name": "Stream name", "type": "Subscription | Usage | One-time | Licensing | Other", "potential": "low | medium | high" }
  ],
  "capitalRequirements": "Estimated seed capital needed to reach break-even or 'minimal' for bootstrappable",
  "financialRisks": ["Risk 1", "Risk 2"],
  "financialStrengths": ["Strength 1", "Strength 2"]
}`
    });

    // ── Agent 5: Risk Analyst ─────────────────────────────────────────────
    ctx.output5 = await runAgent({
      system: `You are a Chief Risk Officer with experience across venture-backed startups
and corporate innovation. You specialize in identifying risks that kill businesses
before they scale — not generic risks, but the specific ones tied to this idea,
this market, and this moment in time.

You have received a full brief from four prior agents. Your job: identify and rate
the real risks. Be specific. Generic risks ("market could be crowded") are useless.
Name the actual competitor, the actual regulation, the actual execution bottleneck.

Rate each risk: HIGH = likely to happen and would severely damage the business,
MEDIUM = possible and meaningful, LOW = unlikely or manageable.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"

Market research: ${JSON.stringify(ctx.output1, null, 2)}
Product assessment: ${JSON.stringify(ctx.output2, null, 2)}
Viability scores: ${JSON.stringify(ctx.output3, null, 2)}
Financial model: ${JSON.stringify(ctx.output4, null, 2)}

Return this exact JSON:
{
  "overallRiskLevel": "high | medium | low",
  "risks": [
    {
      "category": "Market | Competitive | Regulatory | Execution | Financial | Technology | Team",
      "title": "Short risk title (5-7 words)",
      "description": "One specific sentence naming the actual risk",
      "severity": "high | medium | low",
      "likelihood": "high | medium | low",
      "mitigation": "One concrete mitigation action"
    }
  ],
  "topRisk": "The single most dangerous risk in one sentence",
  "dealBreakers": ["Any risk that could make this idea fundamentally unviable"],
  "riskSummary": "2-sentence overall risk assessment"
}`
    });

    // ── Agent 6: Go-to-Market Strategist ─────────────────────────────────
    ctx.output6 = await runAgent({
      system: `You are a Go-to-Market strategist who has launched products in 30+ markets
and taken three startups from zero to $10M ARR. You specialize in resource-constrained
launches — finding the fastest path to first paying customers without burning cash.

You have received a complete brief from five prior agents. Your job: design the
market entry strategy. Be specific. "Use social media" is not a strategy.
Name the exact channel, the exact tactic, the exact first 90 days.

Anchor everything to the segments and geography identified by the researcher.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"

Market research: ${JSON.stringify(ctx.output1, null, 2)}
Product assessment: ${JSON.stringify(ctx.output2, null, 2)}
Viability scores: ${JSON.stringify(ctx.output3, null, 2)}
Financial model: ${JSON.stringify(ctx.output4, null, 2)}
Risk analysis: ${JSON.stringify(ctx.output5, null, 2)}

Return this exact JSON:
{
  "entryStrategy": "One sentence: the primary market entry approach",
  "primarySegment": "Which of the 3 segments to target first and why (one sentence)",
  "channels": [
    {
      "name": "Specific channel name",
      "tactic": "Specific tactic — not generic",
      "estimatedCAC": "Cost estimate or range",
      "priority": "primary | secondary"
    }
  ],
  "first90Days": [
    { "week": "1-2", "focus": "What to do", "goal": "Measurable outcome" },
    { "week": "3-6", "focus": "What to do", "goal": "Measurable outcome" },
    { "week": "7-12", "focus": "What to do", "goal": "Measurable outcome" }
  ],
  "pricingStrategy": "One sentence on how to price for first customers",
  "partnershipOpportunities": ["Specific partner type or org 1", "Specific partner 2"],
  "launchRisks": ["GTM risk 1", "GTM risk 2"],
  "successMetrics": {
    "week4": "Measurable milestone",
    "week12": "Measurable milestone",
    "month6": "Measurable milestone"
  }
}`
    });

    // ── Agent 7: Business Investor ────────────────────────────────────────
    ctx.output7 = await runAgent({
      system: `You are a seasoned business investor with 25 years of experience across
emerging markets, B2B SaaS, consumer tech, and services businesses. You have backed
40+ companies and sat on 15 boards. You are intellectually honest and have no
patience for optimism bias.

You have just received a complete due diligence package from six expert agents:
a market researcher, a CPO, a data scientist, a financial modeler, a risk analyst,
and a GTM strategist. This is exactly the briefing package you would receive before
an investment committee meeting.

Your job: render a clear verdict. Invest, don't invest, or invest with conditions.
Do not sit on the fence. If it's a "maybe" — say invest with conditions and name them.
Your rationale must reference specific findings from the prior agents, not generalities.

Return ONLY valid JSON. No markdown. No preamble.`,
      user: `Business idea: "${idea}"

Full due diligence package:

MARKET RESEARCH (Agent 1):
${JSON.stringify(ctx.output1, null, 2)}

PRODUCT ASSESSMENT (Agent 2):
${JSON.stringify(ctx.output2, null, 2)}

VIABILITY SCORING (Agent 3):
${JSON.stringify(ctx.output3, null, 2)}

FINANCIAL MODEL (Agent 4):
${JSON.stringify(ctx.output4, null, 2)}

RISK ANALYSIS (Agent 5):
${JSON.stringify(ctx.output5, null, 2)}

GO-TO-MARKET PLAN (Agent 6):
${JSON.stringify(ctx.output6, null, 2)}

Return this exact JSON:
{
  "verdict": "invest | don't invest | invest with conditions",
  "conviction": "high | medium | low",
  "rationale": "2-3 sentences referencing specific findings from the brief",
  "keyStrengths": [
    "Specific strength 1 referencing agent findings",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "keyWeaknesses": [
    "Specific weakness 1",
    "Specific weakness 2"
  ],
  "dealBreakers": ["Specific deal breaker if any — or empty array"],
  "conditions": ["Condition 1 if verdict is invest with conditions — or empty array"],
  "comparableBusinesses": ["Business name 1 — one sentence on why comparable", "Business name 2"],
  "investorVerdict": "One final punchy sentence — the bottom line"
}`
    });

    // ── Merge and return all 7 outputs ────────────────────────────────────
    return res.status(200).json({
      idea,
      geography: ctx.geography,
      market:     ctx.output1,
      product:    ctx.output2,
      scoring:    ctx.output3,
      financial:  ctx.output4,
      risks:      ctx.output5,
      gtm:        ctx.output6,
      investor:   ctx.output7,
      meta: {
        agentsRun: 7,
        version: '2.0.0',
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Evaluation pipeline error:', err);
    return res.status(500).json({ error: 'Evaluation failed', detail: err.message });
  }
}

// ── Shared agent runner ────────────────────────────────────────────────────
async function runAgent({ system, user, useWebSearch = false }) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }]
  };

  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    body.max_tokens = 3000;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    throw new Error(`Agent API error: ${JSON.stringify(data)}`);
  }

  // Extract text blocks only (skip tool_use, tool_result blocks)
  const text = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const clean = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error(`JSON parse failed for agent output. Raw: ${clean.slice(0, 300)}`);
  }
}
