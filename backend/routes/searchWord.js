import express from "express";
import { optionalAuth } from "../middleware/authMiddleware.js";
import OpenAI from "openai";
import { supabase } from "../supabase.js";

const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.get("/:search", optionalAuth, async (req, res) => {
  const raw = req.params.search;
  const wordParam = typeof raw === "string" ? raw.trim() : raw;

  if (!wordParam) {
    return res.status(400).json({ error: "Word is required" });
  }

  // normalize for DB lookup (avoid duplicates like "Run" vs "run")
  const normalized = wordParam.toLowerCase();

  try {
    // 1) CHECK DATABASE FIRST (cached copy)
    const { data: existing, error: fetchError } = await supabase
      .from("Words")
      .select("*")
      .eq("word", normalized)
      .maybeSingle();

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);

      const isTimeout =
        fetchError.message?.includes("fetch failed") ||
        fetchError.message?.includes("timeout");

      if (isTimeout) {
        return res.status(503).json({
          error: "Database timeout. Please try again.",
        });
      }

      return res.status(500).json({
        error: "Database error",
      });
    }

    if (existing) {
      // ✅ Check if the user has this word bookmarked (guests always get false)
      let isBookmarked = false;
      if (req.user) {
        const { data: bookmarkRows } = await supabase
          .from("Bookmarks")
          .select("wordIDs")
          .eq("email", req.user.email);

        const wordIDsArray =
          bookmarkRows
            ?.map((row) =>
              row.wordIDs.split(",").map((w) => w.trim().toLowerCase()),
            )
            .flat() || [];

        isBookmarked = wordIDsArray.includes(normalized.toLowerCase());
      }

      const resultFromDb = {
        word: existing.word ?? "",
        phonetic: existing.phonetic ?? "",
        syllables: existing.syllables ?? "",
        frequency: existing.frequency ?? "",
        usage_by_context: existing.usage_by_context ?? {},
        complexity: existing.complexity ?? "",
        meanings: existing.definitions ?? [],
        technical_definition: existing.technical_definition
          ? {
              subject: existing.technical_definition.subject || "",
              definition: existing.technical_definition.definition || "",
            }
          : { subject: "", definition: "" },
        word_family: existing.word_family ?? null,
        register: existing.register ?? "",
        memory_tip: existing.memory_tip ?? "",
        real_world_context: existing.real_world_context ?? "",
        related_words: existing.related_words ?? [],
        bookmarked: isBookmarked,
      };

      return res.json(resultFromDb);
    }

    // 2) NOT FOUND → CALL OPENAI (unchanged prompt + behavior)

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      // deterministic responses
      temperature: 0,
      top_p: 1,
      max_tokens: 3000,

      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `
You are a friendly ESL dictionary assistant. You explain words like a caring teacher
talking to a 10-year-old student who just moved to an English-speaking country.

Rules:
- Always return ONLY a valid JSON object.
- Never return text outside JSON.
- Always follow the exact schema given by the user.
- If data does not exist use "" or [] (never null).
- Each meaning MUST have exactly 3 example sentences.
- Write definitions in plain, everyday English — never formal dictionary language.
- Never use the word itself inside its own definition.
- Never use a harder word than the word being defined.
- Maximum 2 short sentences per definition.
`,
        },
        {
          role: "user",
          content: `
Generate dictionary data for the word "${wordParam}".

Follow these rules strictly:

1. Provide ALL common meanings of the word.
2. Definitions must follow these strict rules:
   - Write like a friendly teacher explaining to a 10-year-old ESL student.
   - Never use the word itself or any harder word inside the definition.
   - Maximum 2 short sentences. No formal dictionary phrasing.
   - BAD: "To proceed or travel at a rapid pace on foot."
   - GOOD: "To move your legs very fast, faster than walking. People run when they are late or playing a sport."
   - BAD: "The state of being uncertain or unclear about something."
   - GOOD: "When you are not sure about something and you need more information to decide. It feels like you have two answers but don't know which one is right."
3. Each meaning must contain EXACTLY 3 example sentences that clearly demonstrate that specific meaning.
4. Synonyms and antonyms should be relevant to that meaning.
5. If none exist, return an empty array [].
6. Frequency must be one of: essential (must-know, used constantly), common (everyday words, most people know), intermediate (used in books and news), advanced (formal and academic writing), rare (exists but barely used)
7. technical_definition should ONLY be filled for words that have a strict, established 
   definition in a specific academic or scientific field — such as scientific terms 
   (photosynthesis, osmosis, entropy), mathematical terms (integer, asymptote), 
   medical terms (hypertension, neuron), legal terms (plaintiff, jurisdiction), or 
   programming terms (recursion, algorithm).
   
   Do NOT fill this for everyday words, objects, or general vocabulary — even if they 
   can be described technically. Examples of words that should have EMPTY 
   technical_definition: car, house, run, break, beautiful, fast.
   
   If the word does not belong to a specific academic discipline, leave both fields as "".

8. Word complexity MUST follow this CEFR rule:

A1 → extremely common everyday words  
A2 → very common daily vocabulary  
B1 → intermediate words used in normal conversation  
B2 → advanced words used in educated conversation  
C1 → rare or academic words  
C2 → highly rare or specialized words

Choose the most appropriate level and be consistent.

9. Synonyms and antonyms should be strictly textbook synonyms and antonyms which are 100% correct. If there are no textbook synonyms, antonyms or any related words to that particular word leave those fields empty.
10. For word_family, provide the other grammatical forms of the word (noun, verb, adjective, adverb). Only include forms that genuinely exist. Use "" for any form that does not exist. Example: for "beautiful" → noun: "beauty", verb: "beautify", adjective: "beautiful", adverb: "beautifully". For a word like "the" that has no other forms, all fields should be "".
11. register must be exactly one of: formal, informal, slang, academic, neutral, literary — pick the single most accurate one for how this word is typically used.
12. memory_tip: a single vivid one-liner that helps an ESL learner remember the word. Use a comparison, analogy, or image. Maximum 20 words. Example: "Think of 'ephemeral' like a soap bubble — beautiful but gone in seconds."
13. real_world_context: one specific sentence describing where or when someone would actually encounter or use this word. Be concrete and relatable. Example: "You'd hear this word in news articles about politics or in formal business meetings."

Return JSON in this exact format (DO NOT change the structure):

{
  "word": "dictionary",
  "phonetic": "/ˈdɪkʃəˌnɛri/",
  "syllables": "Dic-tion-ar-y",
  "frequency": "common",
  "complexity": "B2",
  "register": "neutral",
  "memory_tip": "Think of a dictionary as a word map — it tells you where every word lives and what it means.",
  "real_world_context": "You'd use a dictionary when you read a word you don't know in a book or article.",
  "technical_definition": {
    "subject": "",
    "definition": ""
  },
  "word_family": {
    "noun": "dictionary",
    "verb": "",
    "adjective": "",
    "adverb": ""
  },
  "related_words": ["word1", "word2"],
  "meanings": [
    {
      "part_of_speech": "noun",
      "definition": "A book or app where you can look up any word to find out what it means and how to use it.",
      "example": [
        {
          "sentence": "She looked up the word in her dictionary.",
          "sentence_explanation": "Here the word means she used a dictionary to find out what a word means."
        },
        {
          "sentence": "My teacher told me to use a dictionary when I don't understand a word.",
          "sentence_explanation": "Here the word means a tool you use to learn about words you don't know."
        },
        {
          "sentence": "He downloaded a dictionary app on his phone.",
          "sentence_explanation": "Here the word means a digital app that works like a book of word meanings."
        }
      ],
      "synonyms": ["lexicon", "wordbook", "glossary"],
      "antonyms": []
    }
  ]
}
`,
        },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    const parsed =
      typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

    if (!parsed || typeof parsed !== "object") {
      console.error("Invalid AI response:", aiResponse);
      return res.status(500).json({ error: "Invalid AI response" });
    }
    // 3) SAVE TO DATABASE (best-effort; we try to persist the parsed result)
    try {
      // normalize stored word to lowercase to avoid duplicates
      const toInsert = {
        word: (parsed.word ?? normalized).toLowerCase(),
        phonetic: parsed.phonetic ?? "",
        syllables: parsed.syllables ?? "",
        frequency: parsed.frequency ?? "",
        complexity: parsed.complexity ?? "",
        usage_by_context: parsed.usage_by_context ?? {},
        technical_definition: {
          subject: parsed.technical_definition?.subject || "",
          definition: parsed.technical_definition?.definition || "",
        },
        word_family: {
          noun: parsed.word_family?.noun || "",
          verb: parsed.word_family?.verb || "",
          adjective: parsed.word_family?.adjective || "",
          adverb: parsed.word_family?.adverb || "",
        },
        register: parsed.register ?? "",
        memory_tip: parsed.memory_tip ?? "",
        real_world_context: parsed.real_world_context ?? "",
        definitions: parsed.meanings ?? [],
        related_words: parsed?.related_words || [],
      };

      // use upsert to avoid duplicate race conditions if multiple requests come at same time
      const { data: insertData, error: insertError } = await supabase
        .from("Words")
        .upsert([toInsert], { onConflict: ["word"] });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
      }
    } catch (dbErr) {
      console.error("Failed saving to DB:", dbErr);
    }

    // 4) RETURN the parsed AI response (keeps same API output as before)
    res.json(parsed);
  } catch (error) {
    console.error("Route error:", error);

    res.status(500).json({
      error: "Failed to fetch definition",
    });
  }
});

export default router;