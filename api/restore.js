// /api/restore.js
module.exports = async function (req, res) {
  // ✅ CORS 头（允许扣子空间调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ 预检请求处理
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // ✅ 读取环境变量（在 Vercel → Settings → Environment Variables 设置）
    const RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY; // 例如：01636845dc98444882a6cac2680d65cb
    const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID;    // 例如：1963972275496210433

    if (!RUNNINGHUB_API_KEY || !WORKFLOW_ID) {
      throw new Error('Missing RunningHub environment variables');
    }

    // ✅ 正确企业级 API 地址
    const API_URL = `https://www.runninghub.cn/enterprise-api/consumerApi/${RUNNINGHUB_API_KEY}/runWorkflow/${WORKFLOW_ID}`;

    console.log("🛰️ RunningHub 调用地址:", API_URL);

    // ✅ 调用 RunningHub API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { image }, // 传入 Base64 图像数据
      }),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('⚠️ RunningHub 返回非 JSON：', text);
      throw new Error('RunningHub 返回无效响应');
    }

    if (!response.ok || result.code !== 200) {
      console.error('⚠️ RunningHub 出错：', result);
      return res.status(500).json({ error: 'RunningHub API 调用失败', detail: result });
    }

    // ✅ 返回修复后的图片链接
    const outputUrl = result?.data?.output_url || result?.outputs?.image;
    if (!outputUrl) {
      console.warn('⚠️ 未检测到输出图片链接：', result);
    }

    return res.status(200).json({ output_url: outputUrl });
  } catch (err) {
    console.error('❌ 服务器错误：', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
