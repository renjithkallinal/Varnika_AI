// components/VideoGenerator.tsx
import React, { useState } from "react";

type Props = {
  onGenerated?: (url: string, type?: "image" | "video") => void;
  onImg2ImgUpload?: (file: File, prompt: string) => void;
  onTxtToVideo?: (prompt: string) => void;
};

export default function VideoGenerator({ onGenerated, onImg2ImgUpload, onTxtToVideo }: Props) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"txt2img" | "img2img" | "txt2video">("txt2img");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Defensive generate handler — avoids unhandled JSON parse errors when server returns HTML
  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (mode === "img2img") {
      // For img2img, rely on the upload flow. Notify user if no file chosen.
      setError("Select 'Upload Source' and choose an image to edit, then click Generate.");
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const text = await res.text();
        if (contentType.includes("text/html") || text.trim().startsWith("<!DOCTYPE")) {
          throw new Error(`Server returned HTML (status ${res.status}). Check server logs or route URL.`);
        }
        // Try to parse JSON error if possible
        try {
          const errJson = JSON.parse(text);
          throw new Error(errJson?.message || `Request failed (${res.status})`);
        } catch {
          throw new Error(`Request failed (${res.status}): ${text.slice(0, 200)}`);
        }
      }

      // Successful response: prefer JSON, but accept plain text URL fallback
     if (contentType.includes("application/json")) {
  const data = await res.json();

  // ✅ accept image from backend (base64)
  const base64 =
    data?.image_base64 ||
    data?.image ||
    data?.detail?.image;

  if (!base64) {
    console.error("Backend response:", data);
    throw new Error("No image returned from backend");
  }

  const imgSrc = `data:image/png;base64,${base64}`;

  // ✅ VERY IMPORTANT: send base64 image to parent
  onGenerated?.(imgSrc, "image");
}
 else {
        const text = await res.text();
        const maybeUrl = text.trim();
        if (maybeUrl.startsWith("http")) {
          onGenerated?.(maybeUrl, "image");
        } else {
          throw new Error("Server returned non-JSON response. Check API.");
        }
      }
    } catch (err: any) {
      console.error("Generate error:", err);
      setError(String(err.message || err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleImg2ImgFile(file?: File) {
    if (!file) {
      setError("No file selected.");
      return;
    }
    setError(null);
    onImg2ImgUpload?.(file, prompt);
  }

  function handleTxtToVideo() {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setError(null);
    setIsLoading(true);
    // Allow parent to handle long-running video jobs
    try {
      onTxtToVideo?.(prompt);
    } catch (err: any) {
      console.error("txt2video error:", err);
      setError(String(err?.message || "Text to video failed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleGenerate} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="mode" className="text-sm text-gray-300 mr-2">Mode</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="bg-gray-900/60 border border-gray-700 rounded-md p-2 text-sm"
          >
            <option value="txt2img">Text → Image</option>
            <option value="img2img">Image → Image</option>
            <option value="txt2video">Text → Video</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-400">Tip: include camera, mood, motion</div>
      </div>

      <label className="text-sm text-gray-300">Prompt</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        className="w-full rounded-lg bg-gray-900/60 border border-gray-700 p-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Describe the scene, style, camera, motion..."
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white"
        >
          {isLoading ? "Working..." : mode === "txt2video" ? "Generate Video" : "Generate"}
        </button>

        <button
          type="button"
          onClick={() => { setPrompt(""); setError(null); }}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200"
        >
          Clear
        </button>

        {/* Upload input appears only for Image → Image */}
        {mode === "img2img" && (
          <label className="ml-auto inline-flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer">
            Upload Source
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImg2ImgFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
        )}

        <div className="ml-2 text-sm text-red-400">{error}</div>
      </div>

      <div className="text-xs text-gray-500">
        <strong>Modes</strong>
        <ul className="list-disc ml-4 mt-1">
          <li>Text → Image: create images from a text prompt</li>
          <li>Image → Image: upload a source image and provide a prompt for edits</li>
          <li>Text → Video: generate a short video from a prompt (backend required)</li>
        </ul>
      </div>

      {/* Extra action area: optional quick buttons (page may also provide these) */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => {
            if (!prompt.trim()) { setError("Please enter a prompt."); return; }
            setPrompt((p) => `${p} --cinematic`); // example quick add
          }}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200"
        >
          Add Cinematic
        </button>

        <button
          type="button"
          onClick={() => {
            // quick test: call txt->video handler
            if (mode === "txt2video") {
              handleTxtToVideo();
            } else {
              setMode("txt2video");
              setError(null);
            }
          }}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200"
        >
          {mode === "txt2video" ? "Generate Video" : "Switch → Video"}
        </button>
      </div>
    </form>
  );
}
