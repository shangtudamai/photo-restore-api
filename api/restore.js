module.exports = async function (req, res) {
  // ✅ 允许跨域访问（CORS）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ 限制仅允许 POST 请求
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
        prompt: 'restore this old photo with high fidelity',
        image,
      }),
    });

    const text = await runResponse.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('RunningHub 返回非 JSON:', text);
      throw new Error('RunningHub 返回无效数据');
    }

    if (!runResponse.ok) {
      console.error('RunningHub 出错:', result);
      return res.status(500).json({ error: result.error || 'RunningHub API 调用失败' });
    }

    return res.status(200).json({
      output_url: result.data?.[0]?.url || null,
    });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
