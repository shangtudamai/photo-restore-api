export default async function handler(req, res) {
  // ✅ CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const runResponse = await fetch('https://api.runninghub.ai/v1/images/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNNINGHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'restore-photo',
        prompt: 'restore this old photo with high fidelity',
        image: image,
      }),
    });

    const result = await runResponse.json();

    if (result.error) {
      console.error('RunningHub Error:', result);
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      output_url: result.data?.[0]?.url || null,
    });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
