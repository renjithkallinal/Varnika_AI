import Head from 'next/head'
import VideoGenerator from '../components/VideoGenerator'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100 flex flex-col items-center justify-start p-6">
      <Head>
        <title>Varnika 🎬 — AI Video Generator</title>
      </Head>

      <header className="text-center mt-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-400 tracking-wide">
          Varnika 🎬
        </h1>
        <p className="mt-3 text-lg text-gray-300">
          AI Video & Image Generator — Powered by <span className="text-indigo-500">Stable Diffusion</span>
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Prompt Control</h2>
          <VideoGenerator />
        </div>

        {/* Right Section */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex items-center justify-center text-gray-400 text-center">
          <p>Your generated image or video will appear here ✨</p>
        </div>
      </main>

      <footer className="mt-12 text-gray-500 text-sm">
        © 2025 <span className="text-indigo-400 font-semibold">Varnika AI</span> — Designed by <span className="text-gray-300">Renjith Kallinal</span>
      </footer>
    </div>
  )
}
