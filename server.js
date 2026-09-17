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
// Chat (server-side, shared across all devices)
const CHAT_FILE = "chat.json";
const BANNED_FILE = "banned.json";
const readChat = () => { try { return JSON.parse(fs.readFileSync(CHAT_FILE, "utf8")); } catch { return []; } };
const writeChat = (msgs) => fs.writeFileSync(CHAT_FILE, JSON.stringify(msgs.slice(-300)));
const readBanned = () => { try { return JSON.parse(fs.readFileSync(BANNED_FILE, "utf8")); } catch { return []; } };
const writeBanned = (list) => fs.writeFileSync(BANNED_FILE, JSON.stringify(list));

app.get("/api/chat", (_req, res) => res.json(readChat()));
app.post("/api/chat", (req, res) => {
  const banned = readBanned();
  if (banned.includes(req.body.user)) return res.status(403).json({ error: "banned" });
  const msgs = readChat();
  msgs.push(req.body);
  writeChat(msgs);
  res.json({ ok: true });
});
app.delete("/api/chat", (_req, res) => { writeChat([]); res.json({ ok: true }); });
app.delete("/api/chat/user/:name", (req, res) => { writeChat(readChat().filter((m) => m.user !== req.params.name)); res.json({ ok: true }); });

// Admin list
const ADMINS_FILE = "admins.json";
const readAdmins = () => { try { return JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8")); } catch { return ["beluga", "devansh"]; } };
const writeAdmins = (list) => fs.writeFileSync(ADMINS_FILE, JSON.stringify(list));

app.get("/api/admins", (_req, res) => res.json(readAdmins()));
app.post("/api/admins/:name", (req, res) => {
  const list = readAdmins();
  if (!list.includes(req.params.name)) list.push(req.params.name);
  writeAdmins(list);
  res.json({ ok: true });
});
app.delete("/api/admins/:name", (req, res) => {
  writeAdmins(readAdmins().filter((n) => n !== req.params.name));
  res.json({ ok: true });
});

// Ban list (server-enforced)
app.get("/api/banned", (_req, res) => res.json(readBanned()));
app.post("/api/banned/:name", (req, res) => {
  const list = readBanned();
  if (!list.includes(req.params.name)) list.push(req.params.name);
  writeBanned(list);
  res.json({ ok: true });
});
app.delete("/api/banned/:name", (req, res) => {
  writeBanned(readBanned().filter((n) => n !== req.params.name));
  res.json({ ok: true });
});

// Find recycling companies
app.post("/api/find-recyclers", async (req, res) => {
  const { item } = req.body;
  if (!item) return res.status(400).json({ error: "No item provided" });
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `You are a recycling expert helping students in India find companies that recycle specific items.

For the item: "${item}"

List real companies, NGOs, or initiatives in India that accept, recycle, or upcycle this item.

Respond ONLY with a valid JSON object, no markdown:
{"item":"tyre","usages":["rubber mats","road construction","playground flooring"],"companies":[{"name":"Apollo Tyres Green Initiative","type":"Manufacturer take-back","note":"Contact your nearest dealer"},{"name":"Local tyre repair shops","type":"Informal recycling","note":"Many shops accept old tyres for reuse"}],"tip":"Never burn old tyres — it releases toxic chemicals."}`,
      }],
      max_tokens: 400,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Recycler error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// Flower classification
app.post("/api/classify-flower", async (req, res) => {
  const { item } = req.body;
  if (!item) return res.status(400).json({ error: "No item provided" });
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `You are an expert in flower recycling and upcycling for a school project in India.

Classify this flower or plant item: "${item}"

Flowers collected from temples and homes can be recycled into:
- Agarbatti: marigold, rose petals, jasmine, tuberose, lotus — used to make incense sticks
- Gulal/Colors: rose, marigold, hibiscus, tesu — used for natural Holi colors and dyes
- Fertilizer/Compost: any wilted, mixed, or decayed flowers — used as organic compost
- Perfume/Attar: jasmine, mogra, rose, kewda, champa — used for essential oils and perfume
- Not Usable: plastic/artificial flowers, synthetic materials, non-flower items

Respond ONLY with a valid JSON object, no other text, no markdown, no code blocks:
{"flower":"marigold","product":"Agarbatti","emoji":"🪔","points":20,"tip":"Marigold flowers are perfect for making agarbatti incense sticks!"}

Product must be one of: Agarbatti, Gulal/Colors, Fertilizer/Compost, Perfume/Attar, Not Usable`,
      }],
      max_tokens: 200,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Flower error:", err.message);
    res.status(500).json({ error: "Classification failed" });
  }
});

app.post("/api/classify-flower-image", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "No image provided" });
  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64 } },
          {
            type: "text",
            text: `You are an expert in flower recycling and upcycling for a school project in India.

Look at this image and identify the flower, then classify what it can be used for.

Flowers collected from temples and homes can be recycled into:
- Agarbatti: marigold, rose petals, jasmine, tuberose, lotus — incense sticks
- Gulal/Colors: rose, marigold, hibiscus, tesu — natural Holi colors
- Fertilizer/Compost: wilted or mixed flowers — organic compost
- Perfume/Attar: jasmine, mogra, rose, kewda — essential oils
- Not Usable: plastic/artificial flowers, non-flower items

Respond ONLY with a valid JSON object, no other text, no markdown, no code blocks:
{"flower":"marigold","product":"Agarbatti","emoji":"🪔","points":20,"tip":"Marigold flowers are perfect for making agarbatti!"}

Product must be one of: Agarbatti, Gulal/Colors, Fertilizer/Compost, Perfume/Attar, Not Usable`,
          },
        ],
      }],
      max_tokens: 200,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Flower image error:", err.message);
    res.status(500).json({ error: "Image classification failed" });
  }
});

// Feedback email endpoint
app.post("/api/send-feedback", async (req, res) => {
  const { user, rating, category, text, time, to } = req.body;
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to || "darshpoddar2015@gmail.com",
      subject: `EcoSchool Feedback from ${user} — ${"⭐".repeat(rating)} (${category})`,
      text: `From: ${user}\nRating: ${"⭐".repeat(rating)} (${rating}/5)\nCategory: ${category}\nDate: ${time}\n\n${text || "(no comment)"}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Email error:", err.message);
    res.json({ ok: false });
  }
});

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}
app.listen(3001, () => console.log("✅ Server running on http://localhost:3001"));``