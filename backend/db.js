import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()
mongoose.connect(process.env.MONGO_URI || "")
    .then(() => {
        console.log("MongoDb connected ")
    }).catch((error) => {
        console.log("error while connecting mongoDB =>", error)
    })

const commentsSchema = new mongoose.Schema({
    videoId: String,
    comments: [{
        author: { type: String },
        comment: { type: String },
        likes: { type: String },
        replies: [{
            author: { type: String },
            comment: { type: String },
            likes: { type: String },
        }]
    }]
})

const commentsModel = mongoose.model("Comments", commentsSchema);

export default commentsModel;