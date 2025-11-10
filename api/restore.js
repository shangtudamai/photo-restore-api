// 文件路径：/api/restore.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "缺少图片数据" });
    }

    // 使用 Vercel 的环境变量来存储密钥
    const apiKey = c194f8c634e546cfa8ecf6b23593e737;
    const workflowId = 963972275496210433;

    const response = await fetch(
      `https://api.runninghub.ai/v1/workflows/${workflowId}/run`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { image: imageBase64 }
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("调用 RunningHub 出错：", error);
    return res.status(500).json({ error: "服务调用失败", details: error.message });
  }
}
