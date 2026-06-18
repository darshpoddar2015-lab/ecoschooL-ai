import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Text classification
app.post("/api/classify-waste", async (req, res) => {
  const { item } = req.body;
  if (!item) return res.status(400).json({ error: "No item provided" });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are a waste classification expert for a school recycling app.

Classify this item: "${item}"

Respond ONLY with a valid JSON object, no other text, no markdown, no code blocks:
{"category":"Wet Waste","emoji":"🌿","points":15,"tip":"Compost it or throw in green bin"}

Category must be one of: Wet Waste, E-Waste, Recyclable Waste, Dry Waste, Hazardous Waste, Medical Waste, Non-Recyclable Waste`,
        },
      ],
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    console.log("Groq response:", text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Classification failed" });
  }
});

// Image classification
app.post("/api/classify-image", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "No image provided" });

  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: `You are a waste classification expert for a school recycling app.

Look at this image and identify the waste item, then classify it.

Respond ONLY with a valid JSON object, no other text, no markdown, no code blocks:
{"item":"banana peel","category":"Wet Waste","emoji":"🌿","points":15,"tip":"Compost it or throw in green bin"}

Category must be one of: Wet Waste, E-Waste, Recyclable Waste, Dry Waste, Hazardous Waste, Medical Waste, Non-Recyclable Waste`,
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    console.log("Image response:", text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Image classification failed" });
  }
});
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}
app.listen(3001, () => console.log("✅ Server running on http://localhost:3001"));``