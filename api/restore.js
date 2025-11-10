// /api/restore.js
module.exports = async function (req, res) {
  // ✅ 允许跨域访问（扣子空间 / 本地测试都能请求）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ 预检请求直接返回
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // ✅ 从 Vercel 环境变量读取
    const RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY;
    const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID;

    // ✅ Cloudflare Worker 代理地址（你的 Worker）
    const WORKER_PROXY = 'https://weathered-bar-597f.topphoto8888.workers.dev';
    const API_URL = `${WORKER_PROXY}/v1/workflows/${WORKFLOW_ID}/run`;

    console.log("🚀 调用 RunningHub API:", API_URL);

    // ✅ 发送请求到 RunningHub（经 Cloudflare Worker 中转）
    const payload = { inputs: { image } };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNNINGHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("🧩 RunningHub 原始返回内容：", text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (err) {
      console.error('⚠️ RunningHub 返回非 JSON：', text);
      throw new Error('RunningHub 返回无效响应');
    }

    if (!response.ok) {
      console.error('⚠️ RunningHub 出错：', result);
      return res.status(500).json({
        error: result.error || 'RunningHub API 调用失败',
        detail: result,
      });
    }

    // ✅ 尝试多种常见结构提取图像链接
    const possibleFields = [
      result.output_url,
      result.outputs?.image,
      result.outputs?.output_image,
      result.data?.[0]?.url,
      result.data?.[0]?.image,
      result.images?.[0],
      result?.result?.url,
      result?.url,
    ];

    const imageUrl = possibleFields.find(
      (v) => typeof v === "string" && v.startsWith("http")
    );

    if (!imageUrl) {
      console.error("⚠️ 未检测到图片链接字段。完整返回：", result);
      return res.status(200).json({
        success: false,
        message: "修复成功，但未返回图片链接。",
        raw_result: result,
      });
    }

    // ✅ 成功返回结果
    console.log("✅ 成功提取图像链接：", imageUrl);
    return res.status(200).json({
      success: true,
      output_url: imageUrl,
    });

  } catch (err) {
    console.error('❌ Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
