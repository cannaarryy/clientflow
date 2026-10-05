import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Serve the index.html for the /demo route
  const indexHtml = await fetch('https://clientflowdemo.vercel.app/').then(r => r.text());
  res.setHeader('Content-Type', 'text/html');
  res.send(indexHtml);
}