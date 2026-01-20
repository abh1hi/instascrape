const fs = require('fs');
const path = require('path');

// --- Configuration ---
const inputFileName = 'instagram_data.json';
const outputFileName = 'extracted_bio_data.json';

// Function to read the main JSON file and extract specific info
async function extractBioData() {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, inputFileName), 'utf8');
        const profiles = JSON.parse(rawData);

        const extractedData = [];

        // Regex patterns for extraction
        const emailRegex = /[\w.-]+@[\w-]+\.[\w.]+/gi;
        const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?(\d{1,4}[-.\s]?){2}\d{1,4}/g;
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|net|org|co|in|ru)[^\s]*)/gi;
        const collabKeywords = /(collab|collaboration|business|partnership|cooperation|реклама)/gi;

        profiles.forEach(profile => {
            const bio = profile.bio;
            if (!bio) {
                return; // Skip if there's no bio
            }

            const profileInfo = {
                username: profile.username,
                bio: bio,
                extracted: {
                    emails: [],
                    phoneNumbers: [],
                    urls: [],
                    isSeekingCollaboration: false,
                    otherInfo: [] // For other useful text, links, or phrases
                }
            };
            
            // --- Extract Emails ---
            let emailsFound = bio.match(emailRegex);
            if (emailsFound) {
                profileInfo.extracted.emails = [...new Set(emailsFound.map(e => e.toLowerCase()))];
            }

            // --- Extract Phone Numbers ---
            let phonesFound = bio.match(phoneRegex);
            if (phonesFound) {
                profileInfo.extracted.phoneNumbers = [...new Set(phonesFound)];
            }
            
            // --- Extract URLs/Links ---
            let urlsFound = bio.match(urlRegex);
            if (urlsFound) {
                profileInfo.extracted.urls = [...new Set(urlsFound)];
            }

            // --- Check for Collaboration Keywords ---
            if (bio.match(collabKeywords)) {
                profileInfo.extracted.isSeekingCollaboration = true;
            }

            // You can add more complex logic here to extract other specific useful information
            // For example, extracting unique phrases or social media handles.
            // profileInfo.extracted.otherInfo.push("Some other info found...");

            extractedData.push(profileInfo);
        });

        // Save the results to a new JSON file
        fs.writeFileSync(outputFileName, JSON.stringify(extractedData, null, 2), 'utf8');
        console.log(`\nSuccessfully extracted data from the bio sections.`);
        console.log(`Results saved to ${outputFileName}`);

    } catch (error) {
        console.error('An error occurred during data extraction:', error);
    }
}

extractBioData();