// pages/api/img2img.js
import fs from "fs";
import path from "path";
import formidable from "formidable";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

const AUTOMATIC1111_URL = process.env.AUTOMATIC1111_URL || "http://127.0.0.1:7860";

function parseForm(req) {
  const form = new formidable.IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { fields, files } = await parseForm(req);
    const prompt = fields.prompt || "";
    const imageFile = files.image;
    if (!imageFile) return res.status(400).json({ message: "No image uploaded" });

    // read file and convert to base64
    const fileBuffer = fs.readFileSync(imageFile.path);
    const base64 = fileBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    // call Automatic1111 img2img endpoint
    const payload = {
      init_images: [dataUrl],
      prompt,
      steps: 20,
      cfg_scale: 7.0,
      denoising_strength: 0.6,
      width: 768,
      height: 512,
    };

    const r = await fetch(`${AUTOMATIC1111_URL}/sdapi/v1/img2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("automatic1111 img2img error:", r.status, text);
      return res.status(502).json({ message: "Model server error" });
    }

    const j = await r.json();
    if (!j?.images?.length) return res.status(500).json({ message: "No image returned" });

    // save resulting image
    const b64 = j.images[0];
    const commaIndex = b64.indexOf(",");
    const pureBase64 = commaIndex >= 0 ? b64.slice(commaIndex + 1) : b64;
    const buffer = Buffer.from(pureBase64, "base64");

    const outDir = path.join(process.cwd(), "public", "outputs");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const filename = `img2img_${Date.now()}.png`;
    fs.writeFileSync(path.join(outDir, filename), buffer);

    return res.status(200).json({ outputUrl: `/outputs/${filename}`, type: "image" });
  } catch (err) {
    console.error("API /img2img error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
