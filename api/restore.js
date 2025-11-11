// /api/restore.js
module.exports = async function (req, res) {
  // ✅ CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ 处理预检请求
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // ✅ 你的 RunningHub 凭证
    const RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY || 'c194f8c634e546cfa8ecf6b23593e737';
    const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID || '1963972275496210433';

    // ✅ 通过 Cloudflare Worker 转发请求
    const API_URL = `https://weathered-bar-597f.topphoto8888.workers.dev/enterprise-api/consumerApi/${RUNNINGHUB_API_KEY}/runWorkflow/${WORKFLOW_ID}`;

    console.log("🚀 调用 RunningHub 工作流:", API_URL);

    const payload = { inputs: { image } };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("🧩 RunningHub 原始返回：", text);

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('⚠️ 返回非 JSON：', text);
      throw new Error('RunningHub 返回无效响应');
    }

    // ✅ RunningHub 错误处理
    if (!response.ok || result.code === 404) {
      console.error('⚠️ RunningHub 出错：', result);
      return res.status(500).json({
        error: result.msg || 'RunningHub API 调用失败',
        detail: result,
      });
    }

    // ✅ 尝试提取图片链接
    const possibleFields = [
      result.output_url,
      result.outputs?.image,
      result.outputs?.output_image,
      result.data?.[0]?.url,
      result.data?.[0]?.image,
      result.images?.[0],
      result.result?.url,
      result.url,
    ];

    const imageUrl = possibleFields.find(v => typeof v === 'string' && v.startsWith('http'));

    if (!imageUrl) {
      console.warn("⚠️ 未检测到图片链接字段。完整返回：", result);
      return res.status(200).json({
        success: true,
        message: "修复成功，但未检测到图片链接。",
        raw_result: result,
      });
    }

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
