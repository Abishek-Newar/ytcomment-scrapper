import { useRef, useState } from "react";

function App() {
  let youtubeUrl = useRef()
  let ref = useRef()
  const downloadJsonFile = (data,id) => {
    
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

  async function handleSubmit(e){
   

    e.preventDefault();
    ref.current.innerHTML = "<h1>Please Wait! This can take a while...</h1>";
    console.log(youtubeUrl.current.value)
   
    try {
      const response = await fetch(`http://localhost:3000/getcomments?url=${youtubeUrl.current.value}`);
      const res = await response.json();
      downloadJsonFile(res.comments,res.videoId)
      console.log(res)
      ref.current.innerHTML = `<h1><span>Title:</span> ${res.title} <br> <span>Fetched Comments...</span></h1>`
    } catch (error) {
      console.log("error whiel fetching data from backend",error)
      alert("error while fetching data.. please try again later")
    }
  }

  
  return (
    <div className="container">
      <h1 className="main-title">Youtube Comment Scrapper</h1>
      <form className="main-form" onSubmit={handleSubmit}>
        <label htmlFor="url">
          <input className="inputbox" ref={youtubeUrl} type="text" placeholder="https://www.youtube.com/watch?v=u1PYFXv01Rc" id="url" />
          <button className="btn" type="submit">Get Comments</button>
        </label>
      </form>
      <div className="desc-text" ref={ref}>
        <h1 >Type Link and Click Get Comments to Download Youtube Comments from Video</h1>
      </div>
    </div>
  )
}

export default App
