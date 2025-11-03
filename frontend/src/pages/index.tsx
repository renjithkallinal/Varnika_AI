import Head from 'next/head'
import VideoGenerator from '../components/VideoGenerator'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Head>
        <title>Varnika — AI Video Generator</title>
      </Head>
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Varnika 🎬 — AI Video Generator</h1>
        <VideoGenerator />
      </main>
    </div>
  )
}
