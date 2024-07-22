const express = require('express');
const { createWorker } = require('tesseract.js');

const app = express();
const PORT = 8080;
const API_KEY = 'your_secret_api_key';

app.use(express.json());

const performOCR = async (captchaImgUrl) => {
    const worker = await createWorker('eng');

    await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    const results = [];
    for (let i = 0; i < 10; i++) { // Đọc CAPTCHA 10 lần
        const { data: { text } } = await worker.recognize(captchaImgUrl);
        const cleanedText = text.trim();
        if (cleanedText) {
            results.push(cleanedText);
        }
    }

    await worker.terminate();

    // Loại bỏ các kết quả rỗng
    const filteredResults = results.filter(result => result !== '');

    // Đếm số lần mỗi kết quả xuất hiện
    const resultCounts = filteredResults.reduce((counts, result) => {
        counts[result] = (counts[result] || 0) + 1;
        return counts;
    }, {});

    // Tìm kết quả xuất hiện nhiều nhất
    const mostCommonResult = Object.keys(resultCounts).reduce((a, b) => resultCounts[a] > resultCounts[b] ? a : b, null);

    // Nếu kết quả phổ biến xuất hiện ít nhất 3 lần, trả về kết quả đó
    if (resultCounts[mostCommonResult] >= 2) {
        return mostCommonResult;
    }

    return 'Unable to determine CAPTCHA result accurately';
};

app.get('/', (req, res) => {
    function hello() {
        return "Hello";
    }
    res.send(hello());
});

app.get('/ocr', async (req, res) => {
    const { apikey, url: captchaImgUrl } = req.query;

    if (apikey !== API_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }

    if (!captchaImgUrl) {
        return res.status(400).json({ error: 'URL parameter is missing' });
    }
    console.log(captchaImgUrl);

    try {
        const captchaText = await performOCR(captchaImgUrl);
        res.json({ captcha_text: captchaText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
