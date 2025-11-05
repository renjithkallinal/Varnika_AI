import { useState } from 'react'
import axios from 'axios'

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageBase64, setImageBase64] = useState('')

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
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <label className="block mb-2">Prompt</label>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        className="w-full h-28 p-3 bg-gray-900 border border-gray-700 rounded"
        placeholder="Describe the scene you want to generate..."
      />

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 bg-indigo-600 px-4 py-2 rounded"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>

      {imageBase64 && (
        <div className="mt-6">
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt="Generated"
            className="w-full rounded"
          />
          <a
            href={`data:image/png;base64,${imageBase64}`}
            download="varnika_generated.png"
            className="block mt-2 text-sm text-indigo-300"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  )
}
