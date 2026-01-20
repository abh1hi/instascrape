// This script extracts user data from a directory of HTML files.
//
// Required dependency: jsdom
// To install: npm install jsdom
//
// How to run:
// 1. Save this file as `extract.js`.
// 2. Make sure you have Node.js installed.
// 3. Run `npm install jsdom` in your terminal in the same directory.
// 4. Execute the script from your terminal with the path to your main data folder:
//    node extract.js ./path/to/your/data_folder
//
// The script will create a file named `extracted_data.json` in the current directory.

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Normalizes follower or post count strings (e.g., '10.5M' -> 10500000).
 * @param {string} text - The text containing the count (e.g., "1.2k", "5M").
 * @returns {number} The normalized integer value.
 */
const normalizeCount = (text) => {
  if (!text) return 0;
  const lowerCaseText = text.toLowerCase();
  let multiplier = 1;

  if (lowerCaseText.includes('m')) {
    multiplier = 1000000;
  } else if (lowerCaseText.includes('k')) {
    multiplier = 1000;
  }

  const num = parseFloat(lowerCaseText.replace(/,/g, ''));
  return isNaN(num) ? 0 : Math.round(num * multiplier);
};

/**
 * Extracts user data from a single HTML file.
 * @param {string} filePath - The full path to the user's HTML file.
 * @param {string} username - The user's username.
 * @returns {object|null} An object with the extracted data or null on error.
 */
const extractDataFromFile = (filePath, username) => {
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Extract the user's full name
    const nameElement = document.getElementsByClassName("_aad9")[0];
    const name = nameElement ? nameElement.textContent.trim() : 'N/A';

    // Extract follower and post counts
    const statsElement = document.getElementsByClassName("x1vvkbs")[0];
    let followers = 0;
    let post_c = 0;

    if (statsElement && statsElement.textContent) {
      const statsText = statsElement.textContent;
      // Example text: '63.8M followers • 648 posts'
      const parts = statsText.split('•').map(p => p.trim());

      const followersPart = parts.find(p => p.includes('followers'));
      const postsPart = parts.find(p => p.includes('posts'));

      if (followersPart) {
        followers = normalizeCount(followersPart.replace('followers', '').trim());
      }
      if (postsPart) {
        post_c = normalizeCount(postsPart.replace('posts', '').trim());
      }
    }

    return {
      name,
      username,
      followers,
      post_c,
    };
  } catch (error) {
    console.error(`Error processing file for ${username}: ${error.message}`);
    return null;
  }
};

/**
 * Main function to orchestrate the extraction process.
 */
const main = () => {
  // Get the target directory from command-line arguments
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("Please provide the path to the parent directory.");
    console.error("Usage: node extract.js ./path/to/your/data_folder");
    return;
  }

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory not found at '${targetDir}'`);
    return;
  }

  console.log(`Scanning directory: ${targetDir}`);
  const allData = [];

  // Read all subdirectories (which are the usernames)
  const usernameFolders = fs.readdirSync(targetDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${usernameFolders.length} user folders.`);

  for (const username of usernameFolders) {
    const userFolderPath = path.join(targetDir, username);
    const htmlFilePath = path.join(userFolderPath, `${username}.html`);

    if (fs.existsSync(htmlFilePath)) {
      console.log(`Processing: ${username}`);
      const userData = extractDataFromFile(htmlFilePath, username);
      if (userData) {
        allData.push(userData);
      }
    } else {
      console.warn(`Warning: Could not find ${username}.html in folder ${username}`);
    }
  }

  // Write the final data to a JSON file
  const outputFilePath = path.join(process.cwd(), 'extracted_data.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(allData, null, 2));

  console.log(`\nExtraction complete!`);
  console.log(`Data for ${allData.length} users has been saved to: ${outputFilePath}`);
};

// Run the script
main();
