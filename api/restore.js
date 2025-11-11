module.exports = async function (req, res) {
  // ✅ 跨域设置
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    // ✅ 环境变量配置（在 Vercel 的 Settings → Environment Variables 设置）
    const API_KEY = process.env.RUNNINGHUB_API_KEY;
    const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID;

    // ✅ 企业级 RunningHub API 地址
    const API_URL = `https://www.runninghub.cn/enterprise-api/enterpriseApi/${API_KEY}/runWorkflow/${WORKFLOW_ID}`;

    console.log("📡 [RunningHub] 调用 URL：", API_URL);

    // ✅ 向 RunningHub 发起请求
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image, // Base64 图片
        },
      }),
    });

    // ✅ 获取返回文本
    const text = await response.text();
    console.log("📩 [RunningHub 原始返回]：", text);

    // ✅ 尝试解析 JSON
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error("⚠️ RunningHub 返回非 JSON：", text);
      return res.status(500).json({
        error: "RunningHub 返回无效响应（非 JSON）",
        raw: text,
      });
    }

    // ✅ 检查状态码与数据字段
    if (result.code !== 200 || !result.data) {
      console.error("⚠️ RunningHub 出错：", result);
      return res.status(500).json({
        error: result.msg || "RunningHub API 调用失败",
        raw: result,
      });
    }

    // ✅ 输出修复后的图片链接
    const outputUrl =
      result.data.output_url ||
      result.data.output?.url ||
      result.data.image ||
      null;

    if (!outputUrl) {
      console.warn("⚠️ 未检测到图片链接字段，完整返回：", result);
    }

    return res.status(200).json({
      success: true,
      output_url: outputUrl,
      debug_raw: result, // ✅ 调试用，前端可查看完整返回
    });
  } catch (err) {
    console.error("❌ Server Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};
