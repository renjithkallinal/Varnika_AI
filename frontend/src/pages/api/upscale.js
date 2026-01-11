// pages/api/upscale.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || "http://127.0.0.1:7860";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "Missing url" });

    // fetch the image bytes
    const imageResp = await fetch(url);
    if (!imageResp.ok) return res.status(400).json({ message: "Failed to fetch original image" });
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    // call img2img with larger size and higher denoising strength to "upscale"
    const payload = {
      init_images: [dataUrl],
      prompt: "", // optional: pass-through
      steps: 20,
      cfg_scale: 7.0,
      denoising_strength: 0.5,
      width: 1536, // upscaled width
      height: 1024,
    };

    const r = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/img2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("automatic1111 upscale error:", r.status, text);
      return res.status(502).json({ message: "Model server error" });
    }

    const j = await r.json();
    if (!j?.images?.length) return res.status(500).json({ message: "No image returned" });

    const b64 = j.images[0];
    const commaIndex = b64.indexOf(",");
    const pureBase64 = commaIndex >= 0 ? b64.slice(commaIndex + 1) : b64;
    const buffer = Buffer.from(pureBase64, "base64");

    const outDir = path.join(process.cwd(), "public", "outputs");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const filename = `upscale_${Date.now()}.png`;
    fs.writeFileSync(path.join(outDir, filename), buffer);

    return res.status(200).json({ outputUrl: `/outputs/${filename}`, type: "image" });
  } catch (err) {
    console.error("API /upscale error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
