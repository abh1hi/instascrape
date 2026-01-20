const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// --- Configuration ---
// The folder containing your saved HTML files
const htmlFolderPath = 'C:\\Users\\abhin\\Downloads\\profilescrape\\saved_pages';
// The name of the output JSON file
const outputFileName = 'full_profile_data.json';

// --- Regex and Keywords for Bio Extraction (Global Scale) ---

const keywords = {
    professions: {
        english: ['actor', 'model', 'artist', 'lawyer', 'nutritionist', 'expert', 'professional', 'specialist', 'writer', 'designer', 'chef', 'doctor', 'teacher', 'engineer', 'musician', 'photographer', 'gamer', 'influencer', 'entrepreneur'],
        russian: ['актер', 'модель', 'художник', 'юрист', 'диетолог', 'эксперт', 'специалист', 'писатель', 'дизайнер', 'повар', 'врач', 'учитель', 'инженер', 'музыкант', 'фотограф', 'геймер', 'инфлюенсер', 'предприниматель'],
        hindi: ['अभिनेता', 'मॉडल', 'कलाकार', 'वकील', 'पोषण विशेषज्ञ', 'विशेषज्ञ', 'पेशेवर', 'विशेषज्ञ', 'लेखक', 'डिजाइनर', 'शेफ', 'डॉक्टर', 'शिक्षक', 'इंजीनियर', 'संगीतकार', 'फोटोग्राफर', 'गेमर', 'इन्फ्लुएंसर', 'उद्यमी'],
        japanese: ['俳優', 'モデル', 'アーティスト', '弁護士', '栄養士', '専門家', 'プロフェッショナル', 'スペシャリスト', '作家', 'デザイナー', 'シェフ', '医者', '教師', 'エンジニア', '音楽家', '写真家', 'ゲーマー', 'インフルエンサー', '起業家']
    },
    interests: {
        english: ['travel', 'food', 'fashion', 'lifestyle', 'beauty', 'gaming', 'tech', 'sports', 'music', 'photography', 'art', 'fitness', 'reading', 'movies', 'animals', 'nature', 'science', 'history', 'coding'],
        russian: ['путешествия', 'еда', 'мода', 'образ жизни', 'красота', 'игры', 'технологии', 'спорт', 'музыка', 'фотография', 'искусство', 'фитнес', 'чтение', 'фильмы', 'животные', 'природа', 'наука', 'история', 'программирование'],
        hindi: ['यात्रा', 'खाना', 'फैशन', 'जीवन शैली', 'सौंदर्य', 'गेमिंग', 'तकनीक', 'खेल', 'संगीत', 'फोटोग्राफी', 'कला', 'फिटनेस', 'पढ़ना', 'फिल्में', 'जानवर', 'प्रकृति', 'विज्ञान', 'इतिहास', 'कोडिंग'],
        japanese: ['旅行', '食べ物', 'ファッション', 'ライフスタイル', '美容', 'ゲーム', '技術', 'スポーツ', '音楽', '写真', 'アート', 'フィットネス', '読書', '映画', '動物', '自然', '科学', '歴史', 'コーディング']
    },
    collab: {
        english: ['collab', 'collaboration', 'business', 'partnership', 'cooperation', 'promo', 'promotion', 'inquiries'],
        russian: ['сотрудничество', 'коллаб', 'бизнес', 'партнерство', 'реклама', 'продвижение', 'запросы'],
        hindi: ['सहयोग', 'व्यवसाय', 'साझेदारी', 'पदोन्नति', 'प्रचार', 'पूछताछ'],
        japanese: ['コラボ', 'コラボレーション', 'ビジネス', 'パートナーシップ', '協力', 'プロモーション']
    },
    contact: {
        english: ['dm', 'mail', 'email', 'e-mail', 'contact'],
        russian: ['написать', 'почта', 'связаться'],
        hindi: ['संपर्क', 'ईमेल'],
        japanese: ['連絡', 'メール']
    },
    relationship: {
        english: ['single', 'married', 'in a relationship', 'taken', 'engaged', 'divorced', 'widowed'],
        russian: ['холост', 'замужем', 'в отношениях', 'помолвлен', 'разведен', 'вдовец'],
        hindi: ['अविवाहित', 'विवाहित', 'रिश्ते में', 'मंगेतर', 'तलाकशुदा', 'विधुर'],
        japanese: ['独身', '既婚', '交際中', '婚約', '離婚', '死別']
    },
    education: {
        english: ['student', 'graduate', 'university', 'college', 'school', 'alumni'],
        russian: ['студент', 'выпускник', 'университет', 'колледж', 'школа'],
        hindi: ['छात्र', 'स्नातक', 'विश्वविद्यालय', 'कॉलेज', 'स्कूल', 'पूर्व छात्र'],
        japanese: ['学生', '卒業生', '大学', 'カレッジ', '学校', '卒業生']
    }
};

const locationRegex = /(mumbai|hyderabad|delhi|bangalore|chennai|kolkata|jammu|uae|london|paris|new york|tokyo|moscow|sydney|beijing|chicago|los angeles|dubai|toronto|berlin|rome|sydney|melbourne|singapore|milan|barcelona|amsterdam|san francisco|stockholm|oslo|helsinki|copenhagen|warsaw|prague|budapest|minsk|kyiv|tel aviv|cairo|ankara|istanbul|riyadh|doha|seoul|beijing|shanghai|hong kong|bangkok|ho chi minh|jakarta|kuala lumpur|manila|auckland|wellington|vancouver|montreal|boston|philadelphia|washington|dallas|phoenix|miami|atlanta|denver|san diego|seattle|portland|las vegas|india|china|japan|russia|germany|france|italy|brazil|mexico|canada|spain|portugal|greece|egypt|saudi arabia|south korea|thailand|indonesia|argentina|chile|peru|sweden|norway|finland|denmark|netherlands|belgium|austria|switzerland|ireland|scotland|wales|turkey|poland|ukraine|israel|morocco|kenya|nigeria|south africa|australia|new zealand)/gi;
const ageRegex = /(\d{1,2})[\s\u2500]*(yo|age|yrs|years|y\.o\.|let|goda|ay|umr|歲|才)/i;
const emailRegex = /[\w.-]+@[\w-]+\.[\w.]+/gi;
const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?(\d{1,4}[-.\s]?){2}\d{1,4}/g;
const collabRegex = new RegExp(`\\b(${Object.values(keywords.collab).flat().join('|')})\\b`, 'i');
const contactMethodRegex = new RegExp(`\\b(${Object.values(keywords.contact).flat().join('|')})\\b`, 'i');
const collabTypes = {
    'paid promotion': 'Paid Promotion',
    'paid promotions': 'Paid Promotion',
    'collab': 'Collaboration',
    'collaboration': 'Collaboration',
    'business inquiries': 'Business',
    'partnership': 'Partnership',
    'brand ambassador': 'Brand Ambassador',
    'реклама': 'Advertising'
};

async function scrapeFullProfileData() {
    try {
        const files = fs.readdirSync(htmlFolderPath);
        const htmlFiles = files.filter(file => file.endsWith('.html'));

        if (htmlFiles.length === 0) {
            console.log('No HTML files found in the specified folder.');
            return;
        }

        const allProfilesData = [];

        for (const file of htmlFiles) {
            const filePath = path.join(htmlFolderPath, file);
            console.log(`Processing file: ${file}...`);

            const htmlContent = fs.readFileSync(filePath, 'utf8');
            const $ = cheerio.load(htmlContent);

            const profile = {
                username: null,
                full_name: null,
                bio: null,
                followers: null,
                following: null,
                media_count: null,
                is_private: false,
                is_verified: false,
                profession_tags: [],
                interests: [],
                age: null,
                location: [],
                collaboration: null,
                collab_type: null,
                contact_info: {
                    email: null,
                    phone: null
                },
                social_links: {
                    instagram: null,
                    twitter: null,
                    facebook: null,
                    linkedin: null,
                    youtube: null,
                    tiktok: null,
                    other: []
                },
                mode_of_contact: []
            };

            // --- Extract basic info from meta tags (most reliable) ---
            profile.username = $('meta[property="og:url"]').attr('content')?.split('/').at(-2) || null;
            profile.full_name = $('meta[property="og:title"]').attr('content')?.split('(')[0]?.trim() || null;
            profile.bio = $('meta[name="description"]').attr('content')?.split('- ').at(-1)?.trim() || null;
            profile.social_links.instagram = $('meta[property="og:url"]').attr('content') || null;

            // Follower, Following, Media Count
            $('header li').each((i, el) => {
                const text = $(el).text().toLowerCase();
                const count = $(el).find('span[title]').attr('title') || $(el).find('span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt').first().text();
                
                // Sanitize and convert count to a number
                if (count) {
                    const sanitizedCount = count.replace(/,/g, '');
                    if (sanitizedCount.endsWith('K')) {
                        profile.followers = parseFloat(sanitizedCount) * 1000;
                    } else if (sanitizedCount.endsWith('M')) {
                        profile.followers = parseFloat(sanitizedCount) * 1000000;
                    } else {
                        profile.followers = parseInt(sanitizedCount);
                    }
                }

                if (text.includes('posts')) {
                    profile.media_count = count;
                } else if (text.includes('followers')) {
                    profile.followers = count;
                } else if (text.includes('following')) {
                    profile.following = count;
                }
            });

            // Is Verified
            if ($('svg[aria-label="Verified"]').length > 0) {
                profile.is_verified = true;
            }

            // Is Private
            if (profile.bio && profile.bio.toLowerCase().includes('private account')) {
                profile.is_private = true;
            }

            // --- Bio Analysis (if bio exists) ---
            if (profile.bio) {
                const bioText = profile.bio.replace(/[\n\r]/g, ' ').trim();
                
                // Age
                const ageMatch = bioText.match(ageRegex);
                if (ageMatch) {
                    profile.age = parseInt(ageMatch[1], 10);
                }

                // Locations
                const locationMatches = bioText.match(locationRegex);
                if (locationMatches) {
                    profile.location = [...new Set(locationMatches.map(loc => loc.toLowerCase()))];
                }

                // Professions & Interests
                Object.values(keywords.professions).flat().forEach(prof => {
                    if (bioText.toLowerCase().includes(prof)) {
                        profile.profession_tags.push(prof);
                    }
                });
                Object.values(keywords.interests).flat().forEach(interest => {
                    if (bioText.toLowerCase().includes(interest)) {
                        profile.interests.push(interest);
                    }
                });

                // Collaboration and Contact
                const collabMatch = bioText.match(collabRegex);
                if (collabMatch) {
                    profile.collaboration = "Possible collaboration detected";
                    const matchedKeyword = collabMatch[0].toLowerCase();
                    profile.collab_type = collabTypes[matchedKeyword] || 'Unspecified';
                }
                
                // Mode of Contact
                const contactMatch = bioText.match(contactMethodRegex);
                if (contactMatch) {
                    profile.mode_of_contact = [...new Set(contactMatch.map(match => match.toUpperCase()))];
                }

                // Contact Info
                const emailMatch = bioText.match(emailRegex);
                if (emailMatch) {
                    profile.contact_info.email = emailMatch[0];
                }
                const phoneMatch = bioText.match(phoneRegex);
                if (phoneMatch) {
                    profile.contact_info.phone = phoneMatch[0];
                }

                // Other Social Links (from bio)
                const otherSocialLink = $('div.x6ikm8r.x10wlt62 a[href*="http"]');
                if (otherSocialLink.length) {
                    otherSocialLink.each((i, el) => {
                        profile.social_links.other.push($(el).attr('href'));
                    });
                }
            }

            allProfilesData.push(profile);
        }

        // Save the collected data to a single JSON file
        fs.writeFileSync(outputFileName, JSON.stringify(allProfilesData, null, 2), 'utf8');
        console.log(`\nSuccessfully scraped data from ${htmlFiles.length} files.`);
        console.log(`Data saved to ${outputFileName}`);

    } catch (error) {
        console.error('An error occurred during scraping:', error);
    }
}

scrapeFullProfileData();