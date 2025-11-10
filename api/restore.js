import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ 设置通用 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*'); // 生产环境可以改为你的前端域名
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // ✅ 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ✅ 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // ✅ 调用 RunningHub 接口
    const runResponse = await fetch('https://api.runninghub.ai/v1/images/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNNINGHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'restore-photo',
        prompt: 'restore this old photo with high fidelity, realistic and clean result',
        image: image,
      }),
    });

    if (!runResponse.ok) {
      const text = await runResponse.text();
      console.error('RunningHub API error:', text);
      return res.status(runResponse.status).json({ error: text });
    }

    const result = await runResponse.json();

    return res.status(200).json({
      output_url: result.data?.[0]?.url || null,
    });
  } catch (err: any) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
