export default function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.status(200).json({
    api_configured: hasKey,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    platform: 'ORION'
  });
}
