import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err: Error, fields: Fields, files: Files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing the file' });
      }

      const file = files.file instanceof Array ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const audioPath = file.filepath;

      try {
        const audioData = fs.readFileSync(audioPath);

        const response = await fetch('https://api.deepgram.com/v1/listen', {
          method: 'POST',
          headers: {
            'Content-Type': 'audio/wav', 
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          },
          body: audioData,
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
