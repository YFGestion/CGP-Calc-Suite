import type { VercelRequest, VercelResponse } from '@vercel/node';
import convert from 'html-to-docx';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { htmlContent, moduleTitle } = req.body;

    if (!htmlContent || !moduleTitle) {
      return res.status(400).json({ error: 'Missing htmlContent or moduleTitle in request body' });
    }

    const fileBuffer = await convert(htmlContent, {
      orientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 }, // 1 inch in twips (1/1440 of an inch)
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${moduleTitle.replace(/\s/g, '-')}-summary.docx`);
    res.send(fileBuffer);

  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    res.status(500).json({ error: error.message || 'Failed to generate DOCX' });
  }
}