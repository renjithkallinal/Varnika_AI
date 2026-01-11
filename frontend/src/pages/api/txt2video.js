// pages/api/txt2video.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  return res.status(200).json({ outputUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4", type: "video" });
}
