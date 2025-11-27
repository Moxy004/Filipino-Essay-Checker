require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3000;

if (!GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY not set");
    process.exit(1);
}

const SYSTEM_PROMPT = `You are an expert Filipino language checker and academic writing evaluator. You will evaluate Filipino Konseptong Papel (Concept Papers) based on a specific rubric.

RUBRIC FOR GRADING (Score each category 1-5):

1. NILALAMAN (Content) - 5 points max:
   5: Comprehensive and complete; appropriate discussion of importance, objectives, and methodology. Clear purpose as research guide.
   4: Clear with sufficient explanation of purpose and objectives; minor lack of detail.
   3: Clear purpose but some parts lack explanation (e.g., incomplete explanation of significance or methodology).
   2: Has purpose but unclear direction or methodology; many missing details.
   1: No clear purpose; confused presentation of details.

2. KAISAHAN (Unity/Coherence) - 5 points max:
   5: All parts and ideas are connected and clearly presented with complete meaning. Important points are emphasized.
   4: Ideas are well-organized; clear connection between paragraphs but slight lack of emphasis on some points.
   3: Logical sequence but some parts not fully connected or have poor transitions.
   2: Confused flow of ideas; lacks clear connection between paragraphs and thoughts.
   1: No logical sequence; ideas are scattered and overall flow is incomprehensible.

3. KAAYUSAN (Organization/Format) - 5 points max:
   5: Fully follows all technical standards. Proper format (spacing, font, margin), correct academic language, proper grammar and spelling, complete sections (title, rationale, objectives, methodology, etc.).
   4: Almost all technical standards followed; minor format or language errors that don't affect overall quality.
   3: Partially follows technical standards. Some format/structure issues (missing sections or grammatical errors).
   2: Many violations of technical standards. Poor formatting, missing sections, many grammar and spelling errors.
   1: Does not follow academic writing standards. Messy format, incomplete sections, many language and spelling errors.

4. KAANGKUPAN (Appropriateness/Relevance) - 5 points max:
   5: Elements, language, methods, ideas, and references are appropriate to the concept. Concept is timely, measurable, and culturally/socially relevant to the Philippines. Shows deep understanding of issue context.
   4: Elements, language, and references generally fit the topic; timely and socially relevant but could use more detail or evidence to show connection to Filipino culture.
   3: Content relates to topic but some references or ideas not fully appropriate or lack depth. Current issue mentioned but not fully explored.
   2: Some parts don't align with topic or purpose. Lacks social or cultural context relevance.
   1: Elements, language, and references inappropriate; no social/cultural relevance; unclear if topic is timely.

YOU MUST RESPOND WITH THIS EXACT JSON STRUCTURE (NO DEVIATIONS):
{
  "rubric_scores": {
    "nilalaman": 4,
    "kaisahan": 5,
    "kaayusan": 3,
    "kaangkupan": 4
  },
  "rubric_feedback": {
    "nilalaman": "Ang nilalaman ay malinaw ngunit kulang sa detalye sa metodolohiya.",
    "kaisahan": "Maganda ang daloy ng mga ideya at magkakaugnay ang bawat bahagi.",
    "kaayusan": "May ilang kamalian sa gramatika at baybay na dapat itama.",
    "kaangkupan": "Angkop ang paksa at napapanahon, ngunit kulang sa mas malalim na konteksto."
  },
  "total_score": 16,
  "grade": "16/20",
  "feedback": "Ang essay ay may maayos na istruktura ngunit may ilang bahagi na kulang sa detalye. Maganda ang pag-uugnay ng mga ideya ngunit may mga pagkakamali sa gramatika na dapat ayusin.",
  "corrections": [
    {
      "original": "nakaaapekto",
      "suggestion": "nakakaapekto",
      "explanation": "Ang prefix 'naka-' ay dapat sundan ng paulit-ulit na unang pantig",
      "type": "error"
    }
  ],
  "strengths": [
    "Malinaw ang layunin ng pag-aaral",
    "Maganda ang daloy ng mga ideya"
  ],
  "improvements": [
    "Dagdagan ang detalye sa metodolohiya",
    "Iwasto ang mga kamalian sa baybay"
  ]
}

CRITICAL REQUIREMENTS:
1. rubric_scores MUST be included with all 4 categories (nilalaman, kaisahan, kaayusan, kaangkupan)
2. Each rubric score must be 1-5
3. total_score MUST be the sum of the 4 rubric scores (max 20)
4. grade MUST be in format "X/20" where X is the total_score
5. rubric_feedback MUST explain each category's score in Filipino
6. Do NOT use /100 format - only /20

EVALUATION STEPS:
1. Read the entire essay
2. Score NILALAMAN (1-5): Check completeness of content, objectives, methodology
3. Score KAISAHAN (1-5): Check unity, coherence, flow of ideas
4. Score KAAYUSAN (1-5): Check format, grammar, spelling, organization
5. Score KAANGKUPAN (1-5): Check relevance, timeliness, cultural appropriateness
6. Calculate total_score = nilalaman + kaisahan + kaayusan + kaangkupan
7. Set grade = "total_score/20"
8. Identify spelling/grammar/style corrections
9. List strengths and improvements

SPELL CHECKING:
- naka-/nag-/mag-/pag- prefixes with doubled syllables
- ng/ang/sa particles
- Verb aspects and forms

Return ONLY valid JSON. No additional text.`;

function findTextPosition(essay, text, prevPos = 0) {
    let pos = essay.indexOf(text, prevPos);
    if (pos !== -1) return pos;
    pos = essay.toLowerCase().indexOf(text.toLowerCase(), prevPos);
    if (pos !== -1) return pos;
    return prevPos > 0 ? prevPos + 1 : 0;
}

function parseCorrections(essay, responseText) {
    try {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
        
        let lastPos = 0;
        const corrections = (parsed.corrections || []).map((c, i) => {
            const pos = findTextPosition(essay, c.original, lastPos);
            lastPos = pos + c.original.length;
            return { ...c, position: pos, index: i };
        });
        
        if (!parsed.rubric_scores || Object.keys(parsed.rubric_scores).length === 0) {
            console.warn("⚠️ rubric_scores missing, creating default");
            parsed.rubric_scores = {
                nilalaman: 3,
                kaisahan: 3,
                kaayusan: 3,
                kaangkupan: 3
            };
            parsed.rubric_feedback = {
                nilalaman: "Walang detalyadong ebalwasyon",
                kaisahan: "Walang detalyadong ebalwasyon",
                kaayusan: "Walang detalyadong ebalwasyon",
                kaangkupan: "Walang detalyadong ebalwasyon"
            };
            parsed.total_score = 12;
            parsed.grade = "12/20";
        }
        
        if (!parsed.total_score && parsed.rubric_scores) {
            parsed.total_score = Object.values(parsed.rubric_scores).reduce((a, b) => a + b, 0);
        }
        
        if (parsed.grade && parsed.grade.includes('/100')) {
            const score = parseInt(parsed.grade.split('/')[0]);
            const converted = Math.round(score / 5);
            parsed.grade = `${converted}/20`;
            parsed.total_score = converted;
        } else if (!parsed.grade && parsed.total_score) {
            parsed.grade = `${parsed.total_score}/20`;
        }
        
        return {
            feedback: parsed.feedback || responseText,
            corrections,
            rubric_scores: parsed.rubric_scores || {},
            rubric_feedback: parsed.rubric_feedback || {},
            total_score: parsed.total_score,
            grade: parsed.grade || "N/A",
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || []
        };
    } catch (error) {
        console.error("Parse error:", error);
        return { 
            feedback: responseText, 
            corrections: [], 
            rubric_scores: {
                nilalaman: 3,
                kaisahan: 3,
                kaayusan: 3,
                kaangkupan: 3
            },
            rubric_feedback: {
                nilalaman: "Error sa pag-parse",
                kaisahan: "Error sa pag-parse",
                kaayusan: "Error sa pag-parse",
                kaangkupan: "Error sa pag-parse"
            },
            total_score: 12,
            grade: "12/20", 
            strengths: [], 
            improvements: [] 
        };
    }
}

app.post("/check", async (req, res) => {
    const { essay } = req.body;
    if (!essay?.trim()) return res.status(400).json({ error: "Essay required" });

    const startTime = Date.now();
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "openai/gpt-oss-120b",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Suriin ang Konseptong Papel na ito gamit ang rubric. Magbigay ng detalyadong feedback at marka sa bawat kategorya:\n\n${essay}` }
                ],
                max_tokens: 3000,
                temperature: 0.3,
                response_format: { type: "json_object" }
            },
            { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` }}
        );

        const result = parseCorrections(essay, response.data.choices[0].message.content);
        result.usage = {
            promptTokens: response.data.usage?.prompt_tokens || 0,
            completionTokens: response.data.usage?.completion_tokens || 0,
            totalTokens: response.data.usage?.total_tokens || 0
        };
        result.processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Checked in ${result.processingTime}s - Score: ${result.grade} - ${result.corrections.length} corrections`);
        res.json(result);
    } catch (error) {
        console.error("Error:", error.message);
        const status = error.response?.status;
        if (status === 401) return res.status(500).json({ error: "Auth failed" });
        if (status === 429) return res.status(429).json({ error: "Rate limit exceeded" });
        res.status(500).json({ error: error.response?.data?.error?.message || "Request failed" });
    }
});

app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        model: "Groq Llama 3.3 70B Versatile",
        rubric: "Filipino Konseptong Papel (4 categories, 20 points max)"
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server on port ${PORT}`);
    console.log(`⚡ Filipino Konseptong Papel Checker Ready`);
    console.log(`📊 Rubric: Nilalaman, Kaisahan, Kaayusan, Kaangkupan (5pts each = 20 total)`);
});