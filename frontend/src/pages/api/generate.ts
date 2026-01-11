// pages/api/generate.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const { prompt, width = 512, height = 512, steps = 20 } = req.body || {};
  if (!prompt) return res.status(400).json({ message: "Missing prompt" });

  try {
    const r = await fetch("http://127.0.0.1:8000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width, height, steps }),
    });

    const text = await r.text();
    if (!r.ok) {
      console.error("Local model error:", r.status, text);
      return res.status(502).json({ message: "Local model error", detail: text });
    }

    const j = JSON.parse(text);
    const b64 = j.image_b64;
    if (!b64) return res.status(500).json({ message: "No image returned", detail: j });

    const buffer = Buffer.from(b64, "base64");
    const outDir = path.join(process.cwd(), "public", "outputs");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const filename = `gen_${Date.now()}.png`;
    fs.writeFileSync(path.join(outDir, filename), buffer);

    return res.status(200).json({ outputUrl: `/outputs/${filename}`, type: "image" });
  } catch (err) {
    console.error("API /generate error:", err);
    return res.status(500).json({ message: "Internal server error", error: String(err) });
  }
}
