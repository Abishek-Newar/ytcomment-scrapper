import React from 'react'

const Wp = () => {
    let url = React.useRef()
    let ref = React.useRef()
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
          console.log(url.current.value)
         
          try {
            const response = await fetch(`http://localhost:3000/getreviewsfromwp?url=${url.current.value}`);
            const res = await response.json();
            
            console.log(res)
      
            if(response.ok){
              if(res.supportData.length > 0){
                downloadJsonFile(res.supportData,res.title);
                ref.current.innerHTML = `<h1><span>Title:</span> ${res.title} <br> <span>Fetched Wordpress Support Data...</span></h1>`
              }else{
                ref.current.innerHTML = `<h1><span>Title:</span> ${res.title} <br> <span style="color:red;">There are no Wordpress Support Data in the video</span></h1>`
              }
            }
            
          } catch (error) {
            console.log("error while fetching data from backend",error)
            alert("error while fetching data.. please try again later")
          }
        }
  return (
    <div className="container">
        <h1 className="main-title">Wordpress Support Scrapper</h1>
        <form className="main-form" >
          <label htmlFor="url">
            <input className="inputbox" ref={url} type="text" placeholder="https://www.youtube.com/watch?v=u1PYFXv01Rc" id="url" />
            <button onClick={handleSubmit} className="btn" type="submit">Get Data</button>
          </label>
          </form>
        <div className="desc-text" ref={ref}>
          <h1 >Type Link and Click Get Comments to Download Wordpress Support Data from Video</h1>
        </div>
        
        
      </div>
  )
}

export default Wp