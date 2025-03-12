import React, { useRef, useState } from 'react';
import { Download, Youtube } from 'lucide-react';

function App() {
  const youtubeUrl = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const ref = useRef<HTMLDivElement>(null);

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

    if (!youtubeUrl.current?.value) {
      if (ref.current) {
        ref.current.innerHTML = '<div class="text-red-600">Please enter a YouTube URL</div>';
      }
      return;
    }

    if (ref.current) {
      ref.current.innerHTML = '<div class="text-blue-600">Please Wait! This can take a while...</div>';
    }
    console.log(youtubeUrl.current.value);

    try {
      const response = await fetch(`http://localhost:3000/getcomments?url=${youtubeUrl.current.value}`);
      const res = await response.json();
      
      console.log(res);

      if (response.ok) {
        if (res.comments.length > 0) {
          downloadJsonFile(res.comments, res.videoId);
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="space-y-2">
                <div class="font-semibold">Title: ${res.title}</div>
                <div class="text-green-600">Successfully fetched comments!</div>
              </div>
            `;
          }
        } else {
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="space-y-2">
                <div class="font-semibold">Title: ${res.title}</div>
                <div class="text-red-600">No comments found in the video</div>
              </div>
            `;
          }
        }
      }
    } catch (error) {
      console.error("Error while fetching data from backend", error);
      if (ref.current) {
        ref.current.innerHTML = `
          <div class="text-red-600">
            Error while fetching data. Please try again later.
          </div>
        `;
      }
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.current?.value) {
      if (ref.current) {
        ref.current.innerHTML = '<div class="text-red-600">Please enter a YouTube URL</div>';
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/getcomments?url=${youtubeUrl.current.value}`);
      const res = await response.json();
      console.log(res);
      
      if (ref.current) {
        ref.current.innerHTML = `
          <div class="space-y-2">
            <div class="font-semibold">Feedback request processed</div>
            <div class="text-green-600">Check the console for results</div>
          </div>
        `;
      }
    } catch (error) {
      if (ref.current) {
        ref.current.innerHTML = `
          <div class="text-red-600">
            Error processing feedback request
          </div>
        `;
      }
    }
  };

  return (
    <div className="w-[350px] max-h-[600px] overflow-y-auto p-6 bg-white rounded-xl">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2 sticky top-0 bg-white py-2 border-b border-gray-100">
          <Youtube className="w-6 h-6 text-red-500" />
          YouTube Comment Scraper
        </h1>
        
        <form className="flex flex-col gap-4">
          <div className="space-y-2">
            <input
              type="text"
              ref={youtubeUrl}
              placeholder="https://www.youtube.com/watch?v=u1PYFXv01Rc"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            
            <button
              onClick={handleSubmit}
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              Get Comments
            </button>
          </div>

          <div
            ref={ref}
            className="p-4 bg-gray-50 rounded-xl text-sm border border-gray-100"
          >
            Type a YouTube URL and click the button to download comments
          </div>

          <div className="space-y-2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
              Enter Prompt:
            </label>
            <textarea
              ref={promptRef}
              id="prompt"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm min-h-[100px] resize-y"
            />
            
            <button
              onClick={handleSubmitFeedback}
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
            >
              Get Comments and Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;