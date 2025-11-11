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

    // ✅ RunningHub 企业 API 地址
    const API_URL = 'https://www.runninghub.cn/enterprise-api/consumerApi/runWorkflow';

    // ✅ 固定参数
    const WORKFLOW_ID = '1963972275496210433';
    const API_KEY = '01636845dc98444882a6cac2680d65cb';

    console.log('🚀 调用 RunningHub 企业 API...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: WORKFLOW_ID,
        apiKey: API_KEY,
        inputs: {
          image, // base64 图像
        },
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

    if (result.code !== 200) {
      console.error('⚠️ RunningHub 错误：', result);
      return res.status(500).json({ error: result.msg || '调用失败' });
    }

    console.log('✅ 成功返回：', result);

    return res.status(200).json({
      output_url: result.data?.output_url || null,
      raw: result,
    });
  } catch (err) {
    console.error('❌ Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
