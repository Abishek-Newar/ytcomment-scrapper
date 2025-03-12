import React, { useRef } from 'react';
import { Download } from 'lucide-react';

function App() {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const downloadJsonFile = (data: any, id: string) => {
    if (!data) return;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!urlInputRef.current?.value) {
      if (resultRef.current) {
        resultRef.current.textContent = 'Please enter a URL';
      }
      return;
    }

    try {
      if (resultRef.current) {
        resultRef.current.innerHTML = '<div class="text-blue-600">Please Wait! This can take a while...</div>';
      }

      const response = await fetch(`http://localhost:3000/getreviewsfromwp?url=${urlInputRef.current.value}`);
      const res = await response.json();

      if (response.ok) {
        if (res.supportData?.length > 0) {
          downloadJsonFile(res.supportData, res.title);
          if (resultRef.current) {
            resultRef.current.innerHTML = `
              <div class="space-y-2">
                <div class="font-semibold">Title: ${res.title}</div>
                <div class="text-green-600">Successfully fetched WordPress Support Data!</div>
              </div>
            `;
          }
        } else {
          if (resultRef.current) {
            resultRef.current.innerHTML = `
              <div class="space-y-2">
                <div class="font-semibold">Title: ${res.title}</div>
                <div class="text-red-600">No WordPress Support Data found in the video</div>
              </div>
            `;
          }
        }
      }
    } catch (error) {
      console.error("Error while fetching data:", error);
      if (resultRef.current) {
        resultRef.current.innerHTML = `
          <div class="text-red-600">
            Error while fetching data. Please try again later.
          </div>
        `;
      }
    }
  };

  return (
    <div className="w-[350px] max-h-[600px] overflow-y-auto p-6 bg-white rounded-xl">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2 sticky top-0 bg-white py-2 border-b border-gray-100">
          <Download className="w-6 h-6 text-blue-500" />
          WordPress Support Scraper
        </h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            ref={urlInputRef}
            placeholder="https://www.youtube.com/watch?v=u1PYFXv01Rc"
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
          >
            Get WordPress Data
          </button>
        </form>

        <div
          ref={resultRef}
          className="mt-1 p-4 bg-gray-50 rounded-xl text-sm border border-gray-100"
        >
          Type a YouTube URL and click the button to download WordPress Support Data
        </div>
      </div>
    </div>
  );
}

export default App