import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import axios from 'axios';
import { marked } from 'marked';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.uploadDir = '/tmp';
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing the files:', err);
        res.status(500).json({ error: 'Error parsing the files' });
        return;
      }

      const pageId = process.env.NOTION_PAGE_ID || fields.pageId;
      const fileKeys = Object.keys(files);
      const contentPromises = fileKeys.map((key) => {
        return new Promise<{ name: string; content: string }>((resolve, reject) => {
          const filePath = (files[key] as formidable.File).filepath;
          fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) reject(err);
            const htmlContent = marked(data); // Convert markdown to HTML
            resolve({ name: (files[key] as formidable.File).originalFilename, content: htmlContent });
          });
        });
      });

      const contents = await Promise.all(contentPromises);

      await sendToNotion(contents, pageId);

      res.status(200).json({ message: 'Files uploaded successfully' });
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};

async function sendToNotion(contents: { name: string; content: string }[], pageId: string) {
  const notionToken = process.env.NOTION_TOKEN;
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };

  for (const { name, content } of contents) {
    const data = {
      parent: { page_id: pageId },
      properties: {
        title: {
          title: [
            {
              type: 'text',
              text: { content: name },
            },
          ],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            text: [
              {
                type: 'text',
                text: { content: content },
              },
            ],
          },
        },
      ],
    };

    try {
      const response = await axios.post('https://api.notion.com/v1/pages', data, { headers });
      console.log('Notion API response:', response.data);
    } catch (error) {
      console.error('Error sending to Notion:', error.response ? error.response.data : error.message);
    }
  }
}

export default uploadHandler;