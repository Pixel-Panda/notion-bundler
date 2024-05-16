import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [pageId, setPageId] = useState(process.env.NEXT_PUBLIC_NOTION_PAGE_ID || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handlePageIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('pageId', pageId);

    await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Upload Markdown Files to Notion</h1>
      <form onSubmit={handleSubmit} className="mt-4">
        <input type="file" multiple accept=".md" onChange={handleFileChange} className="mb-2" />
        <input
          type="text"
          placeholder="Notion Page ID"
          value={pageId}
          onChange={handlePageIdChange}
          className="mb-2 p-2 border"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white">
          Upload
        </button>
      </form>
    </div>
  );
}