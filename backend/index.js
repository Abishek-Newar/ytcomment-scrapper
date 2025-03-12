import express from "express"
import { google } from "googleapis";
import cors from "cors"
import dotenv from "dotenv"
import commentsModel from "./db.js";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI} from "@google/generative-ai"
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors())

console.log("GEMENI_API_KEY:", process.env.GEMENI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMENI_API_KEY)
// const prompt = "review the comments and give me a overview "

const youtube = google.youtube({
  version: "v3",
  auth: process.env.API_KEY,
});

let count = 1;
async function getAllComments(videoId) {
  let comments = [];
  let nextPageToken = null;

  do {
    try {
      const response = await youtube.commentThreads.list({
        part: "snippet",
        videoId: videoId,
        maxResults: 100,
        pageToken: nextPageToken,
      });
      console.log(count++)
      for (const item of response.data.items) {
        const topComment = item.snippet.topLevelComment.snippet;
        let commentData = {
          author: topComment.authorDisplayName,
          comment: topComment.textDisplay,
          likes: topComment.likeCount,
          replies: [],
        };


        if (item.snippet.totalReplyCount > 0) {
          commentData.replies = await getAllReplies(item.id);
        }

        comments.push(commentData);
      }

      nextPageToken = response.data.nextPageToken;
    } catch (error) {
      console.error("Error fetching comments:", error);
      break;
    }
  } while (nextPageToken);

  return comments;
}


async function getAllReplies(parentId) {
  let replies = [];
  let nextPageToken = null;

  do {
    try {
      const response = await youtube.comments.list({
        part: "snippet",
        parentId: parentId,
        maxResults: 100,
        pageToken: nextPageToken,
      });
      console.log(count++)
      for (const item of response.data.items) {
        const reply = item.snippet;
        replies.push({
          author: reply.authorDisplayName,
          comment: reply.textDisplay,
          likes: reply.likeCount,
        });
      }

      nextPageToken = response.data.nextPageToken;
    } catch (error) {
      console.error("Error fetching replies:", error);
      break;
    }
  } while (nextPageToken);

  return replies;
}
async function getTitle(videoId) {
  try {
    const response = await youtube.videos.list({
      id: videoId,
      part: "snippet",
    });

    if (response.data.items.length > 0) {
      return response.data.items[0].snippet.title;
    } else {
      throw new Error("Video not found");
    }
  } catch (error) {
    console.error("Error fetching video title:", error);
    return null;
  }
}

async function getEmbedding(data) {
  const model = genAI.getGenerativeModel({model: 'text-embedding-004'})
  
  const result = await model.embedContent(data)
  return result.embedding.data;
}

function extractTextFromJSON(data) {
  let text = '';

  if (typeof data === 'string') {
    text += data + ' ';
  } else if (Array.isArray(data)) {
    for (const item of data) {
      text += extractTextFromJSON(item);
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        text += extractTextFromJSON(data[key]);
      }
    }
  }

  return text;
}


app.get("/getcomments", async (req, res) => {
  const url = req.query.url;
  const prompt = req.query.prompt;
  if (!url) {
    return res.status(400).json({ error: "Missing video parameter" });
  }
  let videoId = "";
  try {
    videoId = url.split("v=")[1].split("&")[0];
  } catch (error) {
    console.log(error);
    res.json({
      error: "invalid url"
    })
  }

  try {
    console.log(`Fetching comments for video: ${videoId}`);
    let title = await getTitle(videoId);
    const comments = await getAllComments(videoId);

    const checkDatabase = await commentsModel.findOne({
      videoId
    })
    const text = extractTextFromJSON(comments)
    // const contentEmbeddings = getEmbedding(text)
    // const promptEmbeddings = getEmbedding(prompt)

    if(prompt){
      const messages = `${prompt}\n\nContent:\n${text}`
    const model =  genAI.getGenerativeModel({model: 'models/gemini-2.0-flash'});
    const chats = await model.generateContent(messages)
    console.log(chats.response.text())
    }

    if (checkDatabase) {
      await commentsModel.updateOne({
        videoId
      }, {
        comments
      })
    } else {
      await commentsModel.create({
        videoId,
        comments,
      })
    }

    res.json({
      videoId,
      comments,
      title
    });
  } catch (error) {
    console.log("failed to fetch comments", error)
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});


// app.get("/addtochatgpt", async (req, res) => {
//   const filePath = req.query.filePath;

//  try {
//   const browser = await puppeteer.launch({ headless: 'new' , args: ['--start-maximized']});
//   const page = await browser.newPage();
//   await page.setViewport({ width: 1920, height: 1080 });

//   await page.goto('https://chatgpt.com/g/g-p-67ceb0276ad081918a369c3d5f17808d-youtube-scrapper/project');
//   console.log("page visited")

//   // await page.waitForSelector('text="Youtube Scrapper"');
//   // await page.click('text="Youtube Scrapper"');


//   // await page.waitForSelector('text="New Chat"');
//   // await page.click('text="New Chat"');

//   // await page.waitForSelector('text="New chat in "youtube Scrapper""');
//   // await page.click('text="New chat in "youtube Scrapper""');

//   await page.waitForSelector('button[aria-label="Upload files and more"]', { timeout: 60000 });
//   await page.click('button[aria-label="Upload files and more"]');


//   await page.waitForXPath("//div[contains(text(), 'Upload from computer')]");
//   const [uploadButton] = await page.$x("//div[contains(text(), 'Upload from computer')]");
//   await uploadButton.click();

//   await page.waitForSelecotr('input[type="file"]',{visible: true});

//   const fileInput = await page.$('input[type="file"]');
//   await fileInput.uploadFile(path.resolve(filePath));


//   await new Promise((resolve)=>{setTimeout(resolve(),3000)});


//   await page.type('textarea','')


//   await page.keyboard.press('Enter');

//   await new Promise((resolve)=>{setTimeout(resolve(),5000)});
//   res.json({
//     msg: "uploaded to chatgpt"
//   })
//   await browser.close()
//  } catch (error) {
//   console.log(error)
//   console.log("error while uplading to chatgpt");
//   res.status(500).json({

//     error,
//     msg: "error while uploading to chatgpt"
//   })
//  }


// })

app.get("/getreviewsfromwp", async(req,res)=>{
  let url = req.query.url;
  if(!url){
    res.status(400).json({
      msg: "link of link is not given"
    })
  }
  try {
    const browser = await puppeteer.launch({headless: false})
    let page = await browser.newPage()

    await page.goto(url);
    const title = await page.evaluate(()=>{
      return document.querySelector("header .plugin-title")?.innerText.trim();
    })
    url = await page.evaluate(()=>{
      return document.querySelector("#section-links #link-support a")?.getAttribute("href")
    })
    console.log(url)

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });


    console.log("link clicked successfully")
    let data = {
      title: title,
      supportData: []
    };
    while(url){
      try {
        let tempData = await page.evaluate(()=>{
          let queries = []
            document.querySelectorAll(".bbp-topics ul").forEach((element,index)=>{
              if(index !== 0){
                const queriesTitle = element.querySelector(".bbp-topic-title .bbp-topic-permalink")?.innerText.trim();
                const queriesLink = element.querySelector(".bbp-topic-title .bbp-topic-permalink")?.getAttribute("href");
                const queriesStatus = element.querySelector(".bbp-topic-title .bbp-topic-permalink span")?.getAttribute("title");
              const queriesStartedBy = element.querySelector(".bbp-topic-title .bbp-author-name")?.innerText.trim();
              const queriesParticipants = element.querySelector(".bbp-topic-voice-count ")?.innerText.trim();
              const queriesReplies = element.querySelector(".bbp-topic-reply-count")?.innerText.trim();
      
              queries.push({
                title: queriesTitle,
                StartedBy: queriesStartedBy,
                Participants: queriesParticipants,
                Replies: queriesReplies,
                link: queriesLink,
                status: queriesStatus? queriesStatus : "Not Resolved",
                description: "",
                replies:[]
              })
              }
            })
            return queries
        })
        tempData.forEach(element=>{
          data.supportData.push(element)
        })
  
        const nextPageUrl = await  page.evaluate(()=>{
          let nextPage = document.querySelector("#bbpress-forums .bbp-pagination-links .next")?.getAttribute("href");
  
          return nextPage? nextPage : null;
        })
  
        if(nextPageUrl){
          url = nextPageUrl
          console.log(url)
          await page.goto(url,{ waitUntil: "networkidle2", timeout: 60000 })
        }else{
          url = null
        }
        
      } catch (error) {
        console.log(error);
        break;
      }
      
    }
    await page.close();
    page = await browser.newPage()
    for(let element of data.supportData){
      try {
        await page.goto(element.link,{ waitUntil: "networkidle2"});
      } catch (error) {
        console.log(error)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));


      let description = await page.evaluate(()=>{
        console.log(document.querySelector("#bbpress-forums .bbp-lead-topic .bbp-topic-content")?.innerText.trim())
        return document.querySelector("#bbpress-forums .bbp-lead-topic .bbp-topic-content")?.innerText.trim(); 
      })
      element.description = description
      let replies = await  page.evaluate(()=>{
        let reply = []
        let replyElement = document.querySelectorAll(".bbp-replies .bbp-body .reply");
        console.log(replyElement)
        replyElement.forEach(item=>{
          const replyContent = item.querySelector(".bbp-reply-content")?.innerText.trim();
          const replyAuthor = item.querySelector(".bbp-reply-author .bbp-author-name")?.innerText.trim();
          const replyAuthorBAdge = item.querySelector(".bbp-reply-author .author-badge")?.innerText.trim();
          console.log(replyContent)
          reply.push({
            content: replyContent,
            atuhor: replyAuthor,
            AuthorBadge: replyAuthorBAdge
          })

         
        })
        console.log(reply)
        return reply
      })
      element.replies = replies
      
    }

    

    await browser.close();
    console.log(data.length)
    res.json(data)
  } catch (error) {
    console.log(error)
  }
})

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
