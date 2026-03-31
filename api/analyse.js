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
      max_tokens: 1800,
      system: `You are an expert startup strategist and market researcher.

The user has described either a business idea or a problem they want to solve. Your task is to:

1. Infer the missing element:
   - If it looks like a business idea: infer the underlying problem it solves.
   - If it looks like a problem statement: suggest a concrete business idea that addresses it.
   - Set inferredField to "problem", "idea", or "none" accordingly.
   - If both are clearly present in one sentence, set inferredField to "none".

2. If the input is too vague (single words, gibberish, incomplete fragments): set insufficientContext to true.

3. Assess idea-problem alignment across 4 dimensions.

4. Score the business idea on 5 pillars (1-5 each):
   - Problem Strength & Urgency (25%)
   - Market Attractiveness (20%)
   - Value Proposition & Differentiation (20%)
   - Business Model Viability (20%)
   - Execution Feasibility (15%)
   Final Score = ((Problem*25) + (Market*20) + (ValueProp*20) + (BusinessModel*20) + (Execution*15)) / 5
   Confidence Score (1-5): how much evidence supports the evaluation.
   Interpretation: 80-100 = "Very Strong Opportunity", 65-79 = "Promising but Needs Validation", 50-64 = "Unclear / Moderate Risk", <50 = "Weak / High Risk"

5. Build a rich, specific customer profile for the primary target segment.

Return ONLY valid JSON — no markdown, no explanation, nothing else.`,
      messages: [{
        role: "user",
        content: `Input: "${idea}"

Return ONLY valid JSON in this exact structure:

{
  "insufficientContext": false,
  "insufficientContextMessage": "",
  "inferredField": "problem | idea | none",
  "inferredValue": "The inferred text if one field was inferred, otherwise empty string",
  "alignment": {
    "problemStrength": "One honest sentence about how real and painful the problem is.",
    "ideaProblemFit": "One sentence about how well the idea addresses the problem.",
    "keyAssumption": "The single most critical unvalidated assumption.",
    "nextBestAction": "One concrete actionable next step."
  },
  "scores": {
    "problem": { "score": 0, "reason": "One sentence." },
    "market": { "score": 0, "reason": "One sentence." },
    "valueProposition": { "score": 0, "reason": "One sentence." },
    "businessModel": { "score": 0, "reason": "One sentence." },
    "execution": { "score": 0, "reason": "One sentence." }
  },
  "finalScore": 0,
  "confidenceScore": 0,
  "interpretation": "Promising but Needs Validation",
  "insights": {
    "topStrength": "One sentence.",
    "biggestRisk": "One sentence.",
    "keyAssumption": "One sentence.",
    "nextBestAction": "One sentence."
  },
  "warnings": ["Optional warning.", "Optional second warning."],
  "customer": {
    "name": "Full plausible name for this persona",
    "role": "Job title",
    "age": 38,
    "location": "City · Region descriptor",
    "psychographic": ["Ambitious", "Career-driven", "Growth mindset", "Values efficiency", "Status-conscious"],
    "behavioral": [
      "One specific behavioral trait.",
      "A second behavioral trait.",
      "A third behavioral trait."
    ],
    "channels": ["LinkedIn", "WhatsApp", "YouTube", "Instagram", "Telegram"],
    "demographics": {
      "ageRange": "30-45",
      "income": "$40K-90K USD",
      "education": "University+",
      "roleLevel": "Manager-Director",
      "companySize": "200-5,000",
      "industry": "Finance, Tech, Services"
    },
    "geographies": ["City 1", "City 2", "City 3", "City 4", "City 5", "City 6"]
  }
}`
      }]
    })
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    return res.status(500).json({ error: "Analyse API error", detail: data });
  }

  const text = data.content.map(b => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: "JSON parse error", raw: clean });
  }
};
