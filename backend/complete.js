import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";


const app = express();

app.use(express.json());
app.use(cors())

app.get("/getcomments", async (req, res) => {
    const url = req.query.url;
    if (!url) {
        res.status(403).json({
            msg: "url is required"
        })
    }
    let scrollCount = 0;
    const videoId = url.split("v=")[1].split("&")[0];
    try {
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage();
        await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: "networkidle2" });
        console.log("page:",page);
        console.log("page$x",page.$x)
        await page.waitForSelector("#comments");

        let previousHeight = 0;
        let sameHeightCount = 0;

        while (sameHeightCount < 5) {
            let newHeight = await page.evaluate("document.documentElement.scrollHeight");
            if (newHeight === previousHeight) {
                sameHeightCount++;
            } else {
                sameHeightCount = 0;
            }

            previousHeight = newHeight;
            await page.evaluate(() => {
                window.scrollTo(0, document.documentElement.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log("Scrolled:",scrollCount++)
        }

        const clickRepliesAndShowMoreReplies = async (page) => {
            console.log("Expanding replies...");
          
            const delay = (time) => new Promise(resolve => setTimeout(resolve, time));
          
            const clickButtons = async (selector) => {
              let attempts = 0;
          
              while (attempts < 5) { // Limit to 5 attempts to prevent infinite loop
                await delay(2000); // Allow content to load
          
                const buttons = await page.$$(selector);
          
                if (buttons.length === 0) {
                  console.log("No more buttons found.");
                  break; // No more buttons, exit loop
                }
          
                let clicked = 0;
          
                for (let button of buttons) {
                  try {
                    if (!button) continue;
          
                    // Scroll into view before clicking
                    await button.evaluate(el => el.scrollIntoView({ behavior: "smooth", block: "center" }));
          
                    await delay(1000);
          
                    // Check if the button is visible
                    const isVisible = await page.evaluate(el => {
                      const rect = el.getBoundingClientRect();
                      return rect.height > 0 && rect.width > 0;
                    }, button);
          
                    if (!isVisible) {
                      console.warn("Skipping button: Not visible or detached");
                      continue;
                    }
          
                    // Click the button
                    await page.evaluate(el => el.click(), button);
          
                    await delay(2000);
          
                    clicked++;
                  } catch (error) {
                    console.warn(`Skipping non-clickable button:`, error.message);
                  }
                }
          
                if (clicked === 0) {
                  console.log("No buttons were clicked in this attempt. Stopping.");
                  break; // Prevent infinite loop if no buttons were successfully clicked
                }
          
                attempts++;
              }
            };
          
            // Click "X replies" buttons using the updated selector
            await clickButtons('button[aria-label*="reply"]');
          
            // Click "Show more replies" buttons (if applicable)
            await clickButtons("ytd-button-renderer #more-replies");
          
            console.log("Finished expanding replies.");
          };
          
            
        
        await clickRepliesAndShowMoreReplies(page);
        console.log("finished scrolling. Extracting comments...");
        const comments = await page.evaluate(() => {
            let allComments = [];
          
            document.querySelectorAll("#comment #body").forEach(element => {
              const commentText = element.querySelector("#content-text")?.innerText.trim();
              const commentAuthor = element.querySelector("#author-text")?.innerText.trim();
              const commentLikes = element.querySelector("#vote-count-middle")?.innerText.trim() || "0";
          
              let replies = [];
          

              const replyElements = element.parentElement.querySelectorAll("#replies #comment #body");
              replyElements.forEach(replyElement => {
                const replyText = replyElement.querySelector("#content-text")?.innerText.trim();
                const replyAuthor = replyElement.querySelector("#author-text")?.innerText.trim();
                const replyLikes = replyElement.querySelector("#vote-count-middle")?.innerText.trim() || "0";
          
                replies.push({ author: replyAuthor, text: replyText, likes: replyLikes });
              });
          
              allComments.push({ 
                author: commentAuthor, 
                text: commentText, 
                likes: commentLikes, 
                replies: replies 
              });
            });
          
            return allComments;
          });
          
          
        res.json({videoId,comments})

    } catch (error) {
        console.log("errro while scrapping data", error)
        res.status(500).json({
            error: "error while scrtapping data"
        })
    }
})

app.listen(3001, () => {
    console.log("connected to port");
})
