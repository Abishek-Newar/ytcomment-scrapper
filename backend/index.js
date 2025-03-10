import express from "express"
import { google } from "googleapis";
import cors from "cors"
import dotenv from "dotenv"
import commentsModel from "./db.js";
dotenv.config();


const app = express();
const PORT =  process.env.PORT || 3000;
app.use(cors())



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
async function getTitle(videoId){
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
app.get("/getcomments", async (req, res) => {
  const url= req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing video parameter" });
  }
  let videoId = "";
  try{
    videoId = url.split("v=")[1].split("&")[0];
  }catch(error){
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
    if(checkDatabase){
      await commentsModel.updateOne({
        videoId
      },{
        comments
      })
    }else{
      await commentsModel.create({
        videoId,
        comments
      })
    }
    
    res.json({
      videoId,
      comments,
      title
    });
  } catch (error) {
    console.log("failed to fetch comments",error)
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
