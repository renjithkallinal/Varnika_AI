import Head from 'next/head'
import VideoGenerator from '../components/VideoGenerator'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center justify-center">
  <Head>
    <title>Varnika 🎬 — AI Video Generator</title>
  </Head>

  <h1 className="text-4xl font-extrabold mb-10 text-center tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
    Varnika 🎬 — AI Video Generator
  </h1>

  <main className="w-full max-w-lg px-6">
    <div className="flex flex-col items-center justify-center space-y-4">
      <VideoGenerator />
    </div>
  </main>
</div>
  )
}
