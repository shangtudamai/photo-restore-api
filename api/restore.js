import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // ✅ Call RunningHub
    const runResponse = await fetch('https://api.runninghub.ai/v1/images/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNNINGHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'restore-photo',
        prompt: 'restore this old photo with high fidelity',
        image,
      }),
    });

    const text = await runResponse.text(); // 防止 JSON parse 错误
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('RunningHub returned non-JSON:', text);
      throw new Error('RunningHub returned invalid response');
    }

    if (!runResponse.ok) {
      console.error('RunningHub error:', result);
      return res.status(500).json({ error: result.error || 'RunningHub API failed' });
    }

    return res.status(200).json({
      output_url: result.data?.[0]?.url || null,
    });
  } catch (err: any) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
