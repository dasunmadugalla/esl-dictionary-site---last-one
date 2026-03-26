import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import OpenAI from "openai";
import { supabase } from "../supabase.js";

const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.get("/:search", verifyUser, async (req, res) => {
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
      // ✅ Check if the user has this word bookmarked
      // fetch only by email
      // 1️⃣ Fetch all bookmark rows for this user
      const { data: bookmarkRows } = await supabase
        .from("Bookmarks")
        .select("wordIDs")
        .eq("email", req.user.email);

      console.log("All bookmark rows:", bookmarkRows);

      // 2️⃣ Combine all wordIDs into a single array
      const wordIDsArray =
        bookmarkRows
          ?.map((row) =>
            row.wordIDs.split(",").map((w) => w.trim().toLowerCase()),
          )
          .flat() || [];

      console.log("Combined wordIDsArray:", wordIDsArray);

      // 3️⃣ Check if the normalized word is included
      const isBookmarked = wordIDsArray.includes(normalized.toLowerCase());
      console.log("isBookmarked result:", isBookmarked);

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
        related_words: existing.related_words ?? [],
        bookmarked: isBookmarked,
      };

      console.log("Returning cached word from DB:", normalized);
      console.log(resultFromDb);
      return res.json(resultFromDb);
    }

    // 2) NOT FOUND → CALL OPENAI (unchanged prompt + behavior)
    console.log("Word not found in DB — calling OpenAI for:", normalized);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      // deterministic responses
      temperature: 0,
      top_p: 1,
      max_tokens: 1200,

      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `
You are an ESL dictionary API.

Rules:
- Always return ONLY a valid JSON object.
- Never return text outside JSON.
- Always follow the exact schema given by the user.
- If data does not exist use "" or [] (never null).
- Each meaning MUST have exactly 3 example sentences.
- Definitions must be understandable by a 10-year-old ESL learner.
`,
        },
        {
          role: "user",
          content: `
Generate dictionary data for the word "${wordParam}".

Follow these rules strictly:

1. Provide ALL common meanings of the word.
2. Definitions must be simple engough for a 10 yr old to understand a very hard word, descriptive, explaining and clear but still accurate.
3. Each meaning must contain EXACTLY 3 example sentences that clearly demonstrate that specific meaning.
4. Synonyms and antonyms should be relevant to that meaning.
5. If none exist, return an empty array [].
6. Frequency must be one of: essential (must-know, used constantly), common (everyday words, most people know), intermediate (used in books and news), advanced (formal and academic writing), rare (exists but barely used)
7.if the requested word is a scientific or a technicle term provide the '100% accurate textbook definiton' for technical_definition if it doesn't leave that empty. for this feld forget about being simple and using easy words. no explanations needed here but only the real text book definiton
8. Word complexity MUST follow this CEFR rule:

A1 → extremely common everyday words  
A2 → very common daily vocabulary  
B1 → intermediate words used in normal conversation  
B2 → advanced words used in educated conversation  
C1 → rare or academic words  
C2 → highly rare or specialized words

Choose the most appropriate level and be consistent.

9. synonyms and antonyms should be strictly text book synonyms and antonyms which are 100% correct.if there is no textbook synonyms, antonyms or any related words to that perticular word leave those feilds empty

Return JSON in this exact format (DO NOT change the structure):

{["example sentence using the word.","example sentence using the word","example sentence using the word"]
  "word": "dictionary",
  "phonetic": "/ˈdɪkʃəˌnɛri/",
  "syllables": "Dic-tion-ar-y",
  "frequency": "common",
  "complexity": "B2",
"technical_definition": {
  "subject": "",
  "definition": ""
},
  "related_words": ["word1","word2"],
  "meanings": [
    {
      "part_of_speech": "noun",
      "definition": "A book or digital resource listing words and their meanings.",
      "example": [
      {
      sentence: "example sentence using the word.",
      sentence_explantion : "explain the sentence how the word is using here simply to better understanding"
      },
      {
      sentence: "example sentence using the word.",
      sentence_explantion : "explain the sentence how the word is using here simply to better understanding"
      },
      {
      sentence: "example sentence using the word.",
      sentence_explantion : "explain the sentence how the word is using here simply to better understanding"
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
    console.log(aiResponse);

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
        definitions: parsed.meanings ?? [],
        related_words: parsed?.related_words || [],
      };

      // use upsert to avoid duplicate race conditions if multiple requests come at same time
      const { data: insertData, error: insertError } = await supabase
        .from("Words")
        .upsert([toInsert], { onConflict: ["word"] });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
      } else {
        console.log("Saved new word to DB:", toInsert.word);
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
