// pages/index.tsx
import Head from "next/head";
import { useState, useRef } from "react";
import VideoGenerator from "../components/VideoGenerator";

type HistoryItem = {
  id: string;
  url: string;
  type: "image" | "video";
  createdAt: string;
};

export default function Home() {
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputType, setOutputType] = useState<"image" | "video" | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Called by VideoGenerator after generation
  function handleGenerated(url: string, type: "image" | "video" = "image") {
    setOutputUrl(url);
    setOutputType(type);
    const item: HistoryItem = {
      id: `${Date.now()}`,
      url,
      type,
      createdAt: new Date().toISOString(),
    };
    setHistory((h) => [item, ...h].slice(0, 40)); // keep a short history
  }

async function handleUpscale() {
  if (!outputUrl) return alert("No output to upscale");

  try {
    const res = await fetch("http://127.0.0.1:8000/upscale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: outputUrl.replace(/^data:image\/\w+;base64,/, "")
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Upscale failed");

    if (!data.image_base64) {
      throw new Error("No image returned from upscale");
    }

    const upscaledImg = `data:image/png;base64,${data.image_base64}`;
    handleGenerated(upscaledImg, "image");

  } catch (err: any) {
    console.error(err);
    alert("Upscale failed: " + (err?.message ?? ""));
  }
}


  // Example: send current image to txt->video or image->video endpoint
  async function handleConvertToVideo() {
    if (!outputUrl) return alert("No image/video to convert");
    try {
      const res = await fetch("/api/convert-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: outputUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Convert failed");
      handleGenerated(data.outputUrl, "video");
    } catch (err: any) {
      console.error(err);
      alert("Convert to video failed: " + (err?.message ?? ""));
    }
  }

  // Image-to-image: upload a file and combine with the prompt (VideoGenerator will call this)
  async function handleImg2ImgUpload(file: File, prompt: string) {
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("prompt", prompt);
      const res = await fetch("/api/img2img", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "img2img failed");
      handleGenerated(data.outputUrl, data.type === "video" ? "video" : "image");
    } catch (err: any) {
      console.error(err);
      alert("img2img failed: " + (err?.message ?? ""));
    }
  }

  // txt->video: called by VideoGenerator (if user chooses txt->video)
  async function handleTxtToVideo(prompt: string) {
    try {
      const res = await fetch("/api/txt2video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "txt2video failed");
      handleGenerated(data.outputUrl, "video");
    } catch (err: any) {
      console.error(err);
      alert("txt->video failed: " + (err?.message ?? ""));
    }
  }

  // history click
  function selectFromHistory(item: HistoryItem) {
    setOutputUrl(item.url);
    setOutputType(item.type);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100 flex flex-col items-center justify-start p-6">
      <Head>
        <title>Varnika 🎬 — AI Video Generator</title>
      </Head>

      <header className="text-center mt-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-400 tracking-wide">Varnika 🎬</h1>
        <p className="mt-3 text-lg text-gray-300">
          AI Video & Image Generator — Powered by <span className="text-indigo-500">Stable Diffusion</span>
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: controls (VideoGenerator only handles generation UI) */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Prompt Control</h2>

          <VideoGenerator
            onGenerated={(url, type) => handleGenerated(url, type ?? "image")}
            onImg2ImgUpload={handleImg2ImgUpload}
            onTxtToVideo={handleTxtToVideo}
          />

          <div className="mt-6 flex gap-3">
            <button onClick={handleUpscale} className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">
              Upscale
            </button>

            <button onClick={handleConvertToVideo} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200">
              Convert → Video
            </button>

            <button
              onClick={() => {
                // trigger file input to upload an image for img2img (if user wants to test)
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200"
            >
              Upload Source
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                // prompt the user for a quick prompt (simple approach)
                const prompt = promptForImg2Img();
                if (prompt === null) return;
                handleImg2ImgUpload(file, prompt);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {/* RIGHT: preview + history */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex-1 flex items-center justify-center relative">
            {!outputUrl ? (
              <p className="text-gray-400">Your generated image or video will appear here ✨</p>
            ) : outputType === "video" ? (
              <video src={outputUrl} controls className="rounded-xl max-h-[480px] w-full object-contain" />
            ) : (
              <img src={outputUrl} alt="output" className="rounded-xl max-h-[480px] w-full object-contain" />
            )}

            {/* fullscreen / open in new tab */}
            {outputUrl && (
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => window.open(outputUrl, "_blank")}
                  className="bg-black/40 px-3 py-2 rounded-md text-sm"
                >
                  🔍 Fullscreen
                </button>
                <a href={outputUrl} download className="bg-black/40 px-3 py-2 rounded-md text-sm">
                  ⬇️ Download
                </a>
              </div>
            )}
          </div>

          {/* HISTORY */}
          <div>
            <h3 className="text-sm text-indigo-300 font-medium mb-2">History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No history yet — generated outputs will show here.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => selectFromHistory(h)}
                    className="rounded-md overflow-hidden border border-gray-700"
                    title={h.createdAt}
                  >
                    {h.type === "video" ? (
                      <video src={h.url} className="h-20 w-full object-cover" />
                    ) : (
                      <img src={h.url} className="h-20 w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-gray-500 text-sm">
        © 2025 <span className="text-indigo-400 font-semibold">Varnika AI</span> — Designed by{" "}
        <span className="text-gray-300">Renjith Kallinal</span>
      </footer>
    </div>
  );
}

/* Helper: a quick blocking prompt (window.prompt) for file->img2img flow */
function promptForImg2Img(): string | null {
  // small helper to keep example simple — replace with a modal/input in real UI
  // eslint-disable-next-line no-alert
  const p = window.prompt("Enter prompt for img2img (optional):", "Add soft cinematic color grading");
  return p;
}
