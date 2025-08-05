const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { analyzeResumeATS } = require('../services/aiService');

exports.analyzeResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No resume file uploaded.' });
    }

    try {
        let text = '';
        const fileType = req.file.mimetype;
        
        if (fileType === 'application/pdf') {
            const data = await pdf(req.file.buffer);
            text = data.text;
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: req.file.buffer });
            text = value;
        } else {
            return res.status(400).json({ message: 'Unsupported file type. Please upload a PDF or DOCX file.' });
        }

        if (!text) {
            return res.status(500).json({ message: 'Failed to extract text from the resume.' });
        }

        const analysisResult = await analyzeResumeATS(text);
        res.json(analysisResult);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error during resume analysis.' });
    }
};