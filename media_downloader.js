// download_all_instagram_batch.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

const usernamesFile = "./usenma.json";
const BATCH_SIZE = 5;
const DELAY_MS = 5000; // 5 seconds

// Load usernames from JSON
function loadUsers() {
  return JSON.parse(fs.readFileSync(usernamesFile, "utf8"));
}

// Save updated usernames JSON
function saveUsers(users) {
  fs.writeFileSync(usernamesFile, JSON.stringify(users, null, 2), "utf8");
}

async function downloadUser(username) {
  const url = `https://www.instagram.com/${username}/embed/`;

  console.log(`[*] Launching Puppeteer for ${username}...`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  console.log(`[*] Navigating to Instagram embed for ${username}...`);
  await page.goto(url, { waitUntil: "networkidle2" });

  console.log("[*] Waiting for images to load...");
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.length > 0 && imgs.every((img) => img.complete);
  });

  const folderPath = path.join(process.cwd(), username);
  fs.mkdirSync(folderPath, { recursive: true });

  // Save HTML
  const htmlContent = await page.content();
  const htmlPath = path.join(folderPath, `${username}.html`);
  fs.writeFileSync(htmlPath, htmlContent, "utf8");
  console.log(`[+] Saved HTML to ${htmlPath}`);

  // Save images
  const imageUrls = await page.$$eval("img", (imgs) =>
    imgs.map((img) => img.src)
  );
  console.log(`[+] Found ${imageUrls.length} images for ${username}`);

  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    try {
      const res = await fetch(imgUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.buffer();
      const ext = path.extname(new URL(imgUrl).pathname) || ".jpg";
      const imgPath = path.join(folderPath, `image_${i + 1}${ext}`);
      fs.writeFileSync(imgPath, buffer);
      console.log(`    -> Saved image_${i + 1}${ext}`);
    } catch (err) {
      console.error(`[!] Failed to download ${imgUrl}`, err.message);
    }
  }

  await browser.close();
  console.log(`[✅] Finished downloading for ${username}`);
}

async function main() {
  let users = loadUsers();

  while (users.length > 0) {
    const batch = users.slice(0, BATCH_SIZE);
    console.log(`\n🚀 Starting batch: ${batch.map(u => u.username).join(", ")}`);

    await Promise.all(batch.map(u => downloadUser(u.username).catch(err => {
      console.error(`[❌] Error for ${u.username}:`, err.message);
    })));

    // Remove processed users
    users = users.slice(BATCH_SIZE);
    saveUsers(users);

    if (users.length > 0) {
      console.log(`[⏳] Waiting ${DELAY_MS / 1000} seconds before next batch...`);
      await new Promise(res => setTimeout(res, DELAY_MS));
    }
  }

  console.log("[🏁] All downloads completed!");
}

main();
