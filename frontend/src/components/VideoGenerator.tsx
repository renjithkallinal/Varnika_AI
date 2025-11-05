import { useState } from 'react'
import axios from 'axios'

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_COLAB_API_URL}/generate`, { prompt })
      setImageBase64(res.data.image_base64)
    } catch (e: any) {
      alert('Generation failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block mb-2 text-sm text-gray-400">Prompt</label>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        className="w-full h-28 p-3 bg-[#0a0a0a] border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        placeholder="Describe the scene you want to create... (e.g. 'a rainy cyberpunk street at night')"
      />

      <button
        onClick={generate}
        disabled={loading}
        className={`mt-4 w-full py-2 rounded-md font-medium transition ${
          loading
            ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20'
        }`}
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>

      {imageBase64 && (
        <div className="mt-6">
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt="Generated"
            className="w-full rounded-lg border border-gray-700 shadow-lg"
          />
        </div>
      )}
    </div>
  )
}
