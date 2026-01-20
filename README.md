# Consolidated Instagram Scripts

This directory contains a collection of scripts for scraping, downloading, and analyzing Instagram data. The scripts have been consolidated and renamed for clarity.

## 📂 Directory Structure

- `media_downloader.js`: Downloads images from Instagram profiles using the embed method.
- `profile_saver_advanced.js`: Navigates to Instagram profiles and saves the HTML content (supports login, retries, and progress tracking).
- `profile_parser.js`: Parses saved HTML files to extract detailed profile information (Bio, Email, Phone, Interests, etc.) using Cheerio.
- `simple_extractor.js`: A lighter extractor using JSDOM for basic stats (Followers, Posts).
- `bio_extractor.js`: Post-processes extracted JSON data to parse bios for emails, phones, and keywords.
- `auto_scroll_snippet.js`: A utility snippet for auto-scrolling pages (useful for console injection).
- `input_templates/`: Contains template JSON files required by the scripts.

## 🚀 Setup

1.  **Install Node.js**: Ensure Node.js is installed on your system.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## 📖 Usage & Sequence Diagrams

### 1. Media Downloader (`media_downloader.js`)

Downloads images from a list of users.

**Input**: `usenma.json` (List of objects with `username`)

```mermaid
sequenceDiagram
    participant User
    participant Script as media_downloader.js
    participant File as usenma.json
    participant Puppeteer
    participant Instagram

    User->>Script: Run node media_downloader.js
    Script->>File: Read usernames
    loop For each user
        Script->>Puppeteer: Launch Browser
        Puppeteer->>Instagram: Go to /embed/
        Instagram-->>Puppeteer: Load Images
        Puppeteer-->>Script: Return Image URLs
        Script->>Instagram: Fetch Image
        Script->>File: Save Image to Disk
    end
    Script->>User: Done
```

### 2. Profile Saver (`profile_saver_advanced.js`)

Saves the HTML of profile pages for offline processing.

**Input**: `extracted_data.json` (Array of objects with `username`)
**Output**: HTML files in `saved_pages/`

```mermaid
sequenceDiagram
    participant User
    participant Script as profile_saver_advanced.js
    participant File as extracted_data.json
    participant Chrome
    participant Instagram

    User->>Script: Run node profile_saver_advanced.js
    Script->>File: Read Usernames
    Script->>Chrome: Launch (Connect to existing or new)
    Note over Chrome: Manual Login (Wait 2 mins)
    loop For each user
        Script->>Chrome: Navigate to Profile
        Chrome->>Instagram: Request Page
        Instagram-->>Chrome: Return HTML
        Script->>Chrome: Get Page Content
        Script->>File: Save .html to saved_pages/
        Script->>File: Update progress.json
    end
```

### 3. Profile Parser (`profile_parser.js`)

Extracts rich data from the saved HTML files.

**Input**: `saved_pages/` (Directory of HTML files)
**Output**: `full_profile_data.json`

```mermaid
sequenceDiagram
    participant User
    participant Script as profile_parser.js
    participant Dir as saved_pages/
    participant Parser as Cheerio
    participant Output as full_profile_data.json

    User->>Script: Run node profile_parser.js
    Script->>Dir: List All HTML Files
    loop For each file
        Script->>Dir: Read File
        Script->>Parser: Parse HTML
        Parser->>Script: Extract Bio, Stats, Email, etc.
    end
    Script->>Output: Save consolidated JSON
```

### 4. Bio Extractor (`bio_extractor.js`)

Analyzes the bio text from JSON data to find contact info.

**Input**: `instagram_data.json` (or `full_profile_data.json`)
**Output**: `extracted_bio_data.json`

```mermaid
sequenceDiagram
    participant User
    participant Script as bio_extractor.js
    participant Input as JSON Data
    participant Output as extracted_bio_data.json

    User->>Script: Run node bio_extractor.js
    Script->>Input: Read Profiles
    loop For each profile
        Script->>Script: Regex Match (Email, Phone, Urls)
    end
    Script->>Output: Save Extracted Details
```

## ⚠️ Notes
- **Authentication**: `profile_saver_advanced.js` relies on a logged-in Chrome session. You may need to adjust the `executablePath` in the script to match your system.
- **Rate Limiting**: Scripts have built-in delays to avoid getting blocked by Instagram. Do not decrease these delays.
