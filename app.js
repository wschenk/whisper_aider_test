const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const port = 3000;

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${extension}`);
    }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.single('audio'), async (req, res) => {
    const openai = new OpenAI();
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-1",
        });
        res.json({ text: transcription.text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up the uploaded file
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
