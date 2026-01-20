const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'extracted_data.json');
const progressPath = path.join(__dirname, 'progress.json');
const browserExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function getAndSavePages() {
    let browser;
    try {
        // Load usernames
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const userData = JSON.parse(jsonData);
        if (!Array.isArray(userData) || userData.length === 0) {
            console.error('JSON data is empty or invalid.');
            return;
        }

        // Load progress
        let progress = { passed: [], failed: [] };
        if (fs.existsSync(progressPath)) {
            progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        }

        // Launch Chrome
        browser = await puppeteer.launch({
            headless: false,
            executablePath: browserExecutablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-extensions',
                '--disable-popup-blocking',
                '--start-maximized'
            ]
        });

        // Use the first tab for login
        const pages = await browser.pages();
        const loginPage = pages[0];

        console.log("Browser opened. Log in manually on the first tab. You have 2 minutes...");
        await new Promise(r => setTimeout(r, 120000)); // 2 min login time

        // Retry loader
        async function loadPageWithRetries(page, url, retries = 3) {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    console.log(`Attempt ${attempt}: Loading ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
                    return true;
                } catch (err) {
                    console.log(`Attempt ${attempt} failed: ${err.message}`);
                    if (attempt < retries) {
                        console.log(`Retrying in 3 seconds...`);
                        await new Promise(r => setTimeout(r, 3000));
                    }
                }
            }
            return false;
        }

        // Process usernames
        for (const user of userData) {
            const username = user.username;
            if (!username || progress.passed.includes(username) || progress.failed.includes(username)) {
                console.log(`Skipping ${username || 'empty'} (already processed or invalid).`);
                continue;
            }

            const targetUrl = `https://www.instagram.com/${username}`;
            console.log(`Opening ${targetUrl}...`);

            const page = await browser.newPage();
            const success = await loadPageWithRetries(page, targetUrl, 3);

            if (success) {
                console.log(`Waiting 5 seconds for ${username} page...`);
                await new Promise(r => setTimeout(r, 5000));

                // Save HTML
                const htmlContent = await page.content();
                const dir = path.join(__dirname, 'saved_pages');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                const filePath = path.join(dir, `${username}.html`);
                fs.writeFileSync(filePath, htmlContent, 'utf8');
                console.log(`Saved HTML for ${username}`);

                progress.passed.push(username);
            } else {
                console.log(`Failed to load ${username} after 3 attempts`);
                progress.failed.push(username);
            }

            // Save progress after each username
            fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');

            await page.close(); // Close after each user page
        }

    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        if (browser) {
            console.log('Keep browser open for review. Close manually when done.');
        }
    }
}

getAndSavePages();
