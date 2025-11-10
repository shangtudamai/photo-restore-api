// /api/restore.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const RUNNINGHUB_API_KEY = c194f8c634e546cfa8ecf6b23593e737;
    const WORKFLOW_ID = 963972275496210433;
    const API_URL = `https://api.runninghub.com/v1/workflows/${WORKFLOW_ID}/run`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNNINGHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { image },
      }),
    });

    const result = await response.json();

    if (result.error) {
      console.error('RunningHub Error:', result.error);
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      output_url: result.output_url || result.outputs?.image || null,
      raw: result
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
