
import express from "express"
import { google } from "googleapis";

const app = express();
const PORT =  3000;
// const API_KEY = "";

// Initialize YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: API_KEY,
});

/**
 * Fetch all comments and replies for a given YouTube video.
 */
async function getAllComments(videoId) {
  let comments = [];
  let nextPageToken = null;

  do {
    try {
      const response = await youtube.commentThreads.list({
        part: "snippet",
        videoId: videoId,
        maxResults: 100, // Max allowed per request
        pageToken: nextPageToken,
      });

      for (const item of response.data.items) {
        const topComment = item.snippet.topLevelComment.snippet;
        let commentData = {
          author: topComment.authorDisplayName,
          comment: topComment.textDisplay,
          likes: topComment.likeCount,
          replies: [],
        };

        // Fetch replies if available
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

/**
 * Fetch all replies for a given top-level comment.
 */
async function getAllReplies(parentId) {
  let replies = [];
  let nextPageToken = null;

  do {
    try {
      const response = await youtube.comments.list({
        part: "snippet",
        parentId: parentId,
        maxResults: 100, // Max allowed per request
        pageToken: nextPageToken,
      });

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

// 📌 API Route to fetch comments
app.get("/getcomments", async (req, res) => {
  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId parameter" });
  }

  try {
    console.log(`Fetching comments for video: ${videoId}`);
    const comments = await getAllComments(videoId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// 🚀 Start the Express server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
