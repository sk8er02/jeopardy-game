export default function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const hasKey = !!apiKey;
  const keyPreview = apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET';

  res.status(200).json({
    status: 'ok',
    hasApiKey: hasKey,
    apiKeyPreview: keyPreview,
    environment: process.env.NODE_ENV,
  });
}
