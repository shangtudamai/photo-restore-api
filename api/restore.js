// /api/restore.js
module.exports = async function (req, res) {
  // ✅ CORS 头（允许扣子空间前端调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ 预检请求
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // ✅ 从环境变量读取密钥与工作流ID
    const RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY;
    const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID;

    // ✅ 使用国际可访问的域名
    const API_URL = `https://weathered-bar-597f.topphoto8888.workers.dev/v1/workflows/${WORKFLOW_ID}/run`;

    // ✅ 发送请求到 RunningHub
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNNINGHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { image }, // 传入 Base64 图像
      }),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('RunningHub 返回非 JSON：', text);
      throw new Error('RunningHub 返回无效响应');
    }

    if (!response.ok) {
      console.error('RunningHub 出错：', result);
      return res.status(500).json({ error: result.error || 'RunningHub API 调用失败' });
    }

    // ✅ 返回修复后的图像 URL
    return res.status(200).json({
      output_url: result.output_url || result.outputs?.image || null,
    });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
