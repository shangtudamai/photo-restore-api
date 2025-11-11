module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    const API_KEY = process.env.RUNNINGHUB_API_KEY;
    const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID;

    // ✅ 正确的企业级 API 地址
    const API_URL = `https://www.runninghub.cn/enterprise-api/enterpriseApi/${API_KEY}/runWorkflow/${WORKFLOW_ID}`;

    console.log("📡 调用 RunningHub:", API_URL);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image: image,
        },
      }),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error("⚠️ RunningHub 返回非 JSON：", text);
      return res.status(500).json({ error: "RunningHub 返回无效响应" });
    }

    if (result.code !== 200 || !result.data) {
      console.error("⚠️ RunningHub 出错：", result);
      return res.status(500).json({
        error: result.msg || "RunningHub API 调用失败",
        raw: result,
      });
    }

    return res.status(200).json({
      output_url: result.data.output_url || null,
    });
  } catch (err) {
    console.error("❌ Server Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};
