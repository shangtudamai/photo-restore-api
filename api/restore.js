// /api/restore.js
module.exports = async function (req, res) {
  // ✅ CORS 设置（允许扣子前端访问）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // ✅ 你的 Cloudflare Worker 地址
    const WORKER_URL = 'https://weathered-bar-597f.topphoto8888.workers.dev';

    console.log('🚀 向 Worker 转发请求...');

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('⚠️ Worker 返回非 JSON:', text);
      throw new Error('Worker 返回无效响应');
    }

    if (!response.ok || result.error || result.code === 404) {
      console.error('⚠️ Worker 出错:', result);
      return res.status(500).json({ error: result.error || result.msg || 'Worker API 调用失败' });
    }

    console.log('✅ Worker 成功响应:', result);

    // ✅ 如果 RunningHub 返回图片结果
    return res.status(200).json({
      output_url: result.data?.output_url || result.data?.image || null,
      raw: result,
    });
  } catch (err) {
    console.error('❌ Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
