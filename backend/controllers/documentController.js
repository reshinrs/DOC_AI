// --- IMPORTS ---
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const docx = require('docx');
const PDFDocument = require('pdfkit'); // PDF report generation
const { Packer } = docx;
const { startOfDay } = require('date-fns');

const Document = require('../models/Document');
const User = require('../models/User');
const {
    classifyTextWithGemini,
    compareTextsWithGemini,
    summarizeTextWithGemini,
    answerQuestionFromText,
    analyzeSentimentWithGemini,
    extractStructuredData
} = require('../services/aiService');
const { sendNotificationEmail } = require('../utils/emailNotifier');

// --- HELPER: Access Check ---
const checkDocAccess = async (docId, user) => {
    const doc = await Document.findById(docId).populate('owner');
    if (!doc) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    if (doc.owner._id.toString() !== user.id.toString())
        throw Object.assign(new Error('User not authorized'), { statusCode: 403 });
    return doc;
};

// --- HELPER: Update Progress and Emit Event ---
const updateDocumentProgress = async (docId, status, logMessage, io, data = {}) => {
    const doc = await Document.findById(docId);
    if (!doc) return;
    doc.status = status;
    if (logMessage) doc.logs.push({ message: logMessage });
    Object.assign(doc, data);
    await doc.save();
    io.emit('document_updated', doc);
};

// --- HELPER: Sanitize Filename ---
function sanitizeFilename(filename) {
    // Remove invalid characters and replace spaces with underscores
    return filename.replace(/[\/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
}


// --- PIPELINE STEPS ---
const processExtraction = async (docId, io) => {
    const doc = await Document.findById(docId);
    if (!doc) return;
    try {
        await updateDocumentProgress(docId, 'Extraction_Pending', 'Starting text extraction...', io);
        let text = '';
        const startTime = Date.now();

        if (doc.fileType.startsWith('image/')) {
            const { data } = await Tesseract.recognize(doc.filePath, 'eng');
            text = data.text;
        } else if (doc.fileType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(doc.filePath);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (doc.fileType.includes('wordprocessingml.document')) {
            const { value } = await mammoth.extractRawText({ path: doc.filePath });
            text = value;
        } else {
            text = fs.readFileSync(doc.filePath, 'utf-8');
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        await updateDocumentProgress(docId, 'Extracted', `Extraction complete in ${duration}s.`, io, { extractedText: text });
        processClassification(docId, io);
    } catch (error) {
        await updateDocumentProgress(docId, 'Failed', `Extraction Error: ${error.message}`, io);
    }
};

const processClassification = async (docId, io) => {
    const doc = await Document.findById(docId).populate('owner');
    if (!doc || !doc.extractedText) return;
    try {
        await updateDocumentProgress(docId, 'Classification_Pending', 'Classifying document...', io);
        const classificationResult = await classifyTextWithGemini(doc.extractedText);
        const data = {
            classification: classificationResult.type || 'Unclassified',
            confidenceScore: classificationResult.score || 0,
        };
        const logMessage = `Classified as ${data.classification} with ${data.confidenceScore}% confidence.`;
        await updateDocumentProgress(docId, 'Classified', logMessage, io, data);
        processDataExtraction(docId, io);
    } catch (error) {
        await updateDocumentProgress(docId, 'Failed', `Classification Error: ${error.message}`, io);
    }
};

const processDataExtraction = async (docId, io) => {
    const doc = await Document.findById(docId);
    if (!doc) return;
    try {
        await updateDocumentProgress(docId, 'Data_Extraction_Pending', 'Extracting structured data...', io);
        const structuredData = await extractStructuredData(doc.extractedText, doc.classification);
        const logMessage = `Structured data extracted successfully.`;
        await updateDocumentProgress(docId, 'Data_Extracted', logMessage, io, { structuredData });
        processSentimentAnalysis(docId, io);
    } catch (error) {
        await updateDocumentProgress(docId, 'Failed', `Data Extraction Error: ${error.message}`, io);
    }
};

const processSentimentAnalysis = async (docId, io) => {
    const doc = await Document.findById(docId);
    if (!doc || !doc.extractedText) return;
    try {
        await updateDocumentProgress(docId, 'Sentiment_Pending', 'Analyzing sentiment...', io);
        const sentimentResult = await analyzeSentimentWithGemini(doc.extractedText);
        const logMessage = `Sentiment analyzed as: ${sentimentResult}.`;
        await updateDocumentProgress(docId, 'Analyzed', logMessage, io, { sentiment: sentimentResult });
        
        // **MODIFIED**: Call the new renaming step
        processFileRenaming(docId, io);
    } catch (error) {
        await updateDocumentProgress(docId, 'Failed', `Sentiment Analysis Error: ${error.message}`, io);
    }
};

// **NEW**: Function to handle intelligent file renaming
const processFileRenaming = async (docId, io) => {
    const doc = await Document.findById(docId);
    if (!doc) return;
    try {
        await updateDocumentProgress(docId, 'Renaming_Pending', 'Generating new filename...', io);
        
        let newName = doc.originalName; // Default to original
        const data = doc.structuredData;
        const extension = path.extname(doc.originalName);
        
        // Build new name based on classification and extracted data
        if (doc.classification === 'Invoice' && data.vendorName && data.invoiceDate) {
            newName = `Invoice_${data.vendorName}_${data.invoiceDate}${extension}`;
        } else if (doc.classification === 'Contract' && data.partyA && data.effectiveDate) {
            newName = `Contract_${data.partyA}_${data.effectiveDate}${extension}`;
        }

        const sanitizedNewName = sanitizeFilename(newName);
        
        // We only rename the "display" name, not the file on disk, to avoid complexity.
        // The actual file on disk remains `storageName`. This is safer.
        doc.originalName = sanitizedNewName;

        const logMessage = `Document name updated to: ${sanitizedNewName}.`;
        await updateDocumentProgress(docId, 'Renamed', logMessage, io, { originalName: sanitizedNewName });

        // Call the final step in the pipeline
        processRouting(docId, io);
    } catch (error) {
        // If renaming fails, it's not critical, so we just log it and continue to routing.
        console.error(`File renaming failed for ${docId}:`, error);
        await updateDocumentProgress(docId, 'Renamed', `File renaming failed: ${error.message}`, io);
        processRouting(docId, io);
    }
};

const processRouting = async (docId, io) => {
    const doc = await Document.findById(docId).populate('owner');
    if (!doc) return;
    try {
        await updateDocumentProgress(docId, 'Routing_Pending', 'Applying routing rules...', io);
        let destination = 'General Archive';
        if (doc.classification === 'Invoice') destination = 'Sent to Accounting Dept.';
        if (doc.classification === 'Contract') destination = 'Sent to Legal Dept.';
        if (doc.classification === 'Resume') destination = 'Sent to HR Dept.';

        await updateDocumentProgress(docId, 'Routed', `Document routed: ${destination}`, io, { routeDestination: destination });

        await sendNotificationEmail(
            doc.owner.email,
            `Your Document "${doc.originalName}" has been Processed`,
            `<h1>Processing Complete!</h1><p>Hello ${doc.owner.username},</p><p>Your document, <strong>${doc.originalName}</strong>, has been successfully processed and routed.</p><ul><li><strong>Classification:</strong> ${doc.classification} (${doc.confidenceScore}%)</li><li><strong>Destination:</strong> ${destination}</li><li><strong>Sentiment:</strong> ${doc.sentiment || 'N/A'}</li></ul><p>You can view the details on your dashboard.</p>`
        );
    } catch (error) {
        await updateDocumentProgress(docId, 'Failed', `Routing Error: ${error.message}`, io);
    }
};

// --- CONTROLLERS ---
// **MODIFIED**: Added `uploadedName` to preserve the original filename.
exports.uploadDocument = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    try {
        const doc = await Document.create({
            originalName: req.file.originalname,
            uploadedName: req.file.originalname, // Save the original name here
            storageName: req.file.filename,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            owner: req.user.id,
            logs: [{ message: `Document received from user ${req.user.username}.` }]
        });
        req.io.emit('document_updated', doc);
        res.status(201).json(doc);
        processExtraction(doc._id, req.io);
    } catch (error) {
        res.status(500).json({ message: 'Server error during document creation.' });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = { owner: req.user.id };
        let sort = { createdAt: -1 };

        if (req.query.search) {
            query.originalName = { $regex: req.query.search, $options: 'i' };
        }

        if (req.query.filter && req.query.filter !== 'all') {
            if (req.query.filter === 'needsReview') {
                query.$or = [
                    { classification: 'Unclassified' }, { classification: 'Other' },
                    { confidenceScore: { $lt: 70 } }
                ];
            } else if (req.query.filter === 'processedToday') {
                query.createdAt = { $gte: startOfDay(new Date()) };
            } else {
                query.classification = req.query.filter;
            }
        }

        if (req.query.sortBy) {
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
            sort = { [req.query.sortBy]: sortOrder };
        }

        const totalDocuments = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);
        const documents = await Document.find(query)
            .sort(sort)
            .limit(limit)
            .skip(skip);

        res.json({ documents, page, totalPages, totalDocuments });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getDocumentById = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        res.json(doc);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.summarizeDocument = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        if (!doc.extractedText) return res.status(400).json({ message: 'No text to summarize.' });
        const summary = await summarizeTextWithGemini(doc.extractedText);
        res.json({ summary });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.askQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ message: 'A question is required.' });
        const doc = await checkDocAccess(req.params.id, req.user);
        if (!doc.extractedText) return res.status(400).json({ message: 'No extracted text for Q&A.' });
        const answer = await answerQuestionFromText(doc.extractedText, question);
        res.json({ answer });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        fs.unlink(doc.filePath, err => { if (err) console.error('Delete file error:', err); });
        await doc.deleteOne();
        req.io.emit('document_deleted', { id: req.params.id });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.reExtractDocument = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        res.json({ message: 'Re-extraction started.' });
        processExtraction(doc._id, req.io);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.reClassifyDocument = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        res.json({ message: 'Re-classification started.' });
        processClassification(doc._id, req.io);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.compareDocuments = async (req, res) => {
    const { compareWithIds } = req.body;
    const sourceDocId = req.params.id;
    const io = req.io;
    try {
        const sourceDoc = await checkDocAccess(sourceDocId, req.user);
        if (!sourceDoc.extractedText) return res.status(400).json({ message: 'No text in source document.' });
        const targetDocs = await Document.find({ _id: { $in: compareWithIds }, owner: req.user.id });
        let similarityResults = [];
        await updateDocumentProgress(sourceDocId, sourceDoc.status, `Comparing with ${targetDocs.length} document(s)...`, io);
        for (const targetDoc of targetDocs) {
            if (targetDoc._id.toString() === sourceDocId) continue;
            if (targetDoc.extractedText) {
                const score = await compareTextsWithGemini(sourceDoc.extractedText, targetDoc.extractedText);
                similarityResults.push({
                    comparedDocId: targetDoc._id,
                    comparedDocName: targetDoc.originalName,
                    similarityScore: score,
                });
            }
        }
        await updateDocumentProgress(sourceDocId, sourceDoc.status, `Comparison complete.`, io, { similarityResults });
        const finalDoc = await Document.findById(sourceDocId);
        res.json(finalDoc);
    } catch (error) {
        res.status(500).json({ message: 'Comparison error.' });
    }
};

exports.clearComparisonResults = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        doc.similarityResults = [];
        await doc.save();
        req.io.emit('document_updated', doc);
        res.json(doc);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.convertAndDownloadDocument = async (req, res) => {
    const { format = 'txt' } = req.query;
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        if (!doc.extractedText) return res.status(400).json({ message: 'No text to convert.' });
        const fileName = `${path.parse(doc.originalName).name}.${format}`;
        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        if (format === 'txt') {
            res.setHeader('Content-type', 'text/plain');
            res.send(doc.extractedText);
        } else if (format === 'docx') {
            const paragraphs = doc.extractedText.split('\n').map(p => new docx.Paragraph({ children: [new docx.TextRun(p)] }));
            const docxFile = new docx.Document({ sections: [{ properties: {}, children: paragraphs }] });
            const buffer = await Packer.toBuffer(docxFile);
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.send(buffer);
        } else {
            return res.status(400).json({ message: `Unsupported format: '${format}'` });
        }
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

exports.generateReport = async (req, res) => {
    try {
        const doc = await checkDocAccess(req.params.id, req.user);
        if (['Ingested', 'Extraction_Pending', 'Extracted'].includes(doc.status)) {
            return res.status(400).json({ message: 'Document has not been analyzed yet.' });
        }
        const summary = await summarizeTextWithGemini(doc.extractedText);
        const pdf = new PDFDocument({ margin: 50 });
        const fileName = `Report-${doc.originalName}.pdf`.replace(/\s+/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        pdf.pipe(res);
        pdf.fontSize(20).font('Helvetica-Bold').text('Document Analysis Report', { align: 'center' }).moveDown();
        pdf.fontSize(16).font('Helvetica-Bold').text(doc.originalName);
        pdf.fontSize(10).font('Helvetica').text(`Processed on: ${new Date(doc.updatedAt).toLocaleString()}`).moveDown(2);
        pdf.fontSize(14).font('Helvetica-Bold').text('Key Information').strokeColor('#aaaaaa').lineWidth(1).moveTo(50, pdf.y).lineTo(550, pdf.y).stroke().moveDown();
        const info = {
            'Classification': `${doc.classification} (${doc.confidenceScore}%)`,
            'Sentiment': doc.sentiment,
            'File Size': `${(doc.fileSize / 1024).toFixed(2)} KB`,
            'Status': doc.status.replace(/_/g, ' '),
        };
        for (const [key, value] of Object.entries(info)) {
            pdf.fontSize(11).font('Helvetica-Bold').text(key + ':', { continued: true });
            pdf.font('Helvetica').text(` ${value}`);
        }
        pdf.moveDown(2);
        pdf.fontSize(14).font('Helvetica-Bold').text('AI-Generated Summary').strokeColor('#aaaaaa').lineWidth(1).moveTo(50, pdf.y).lineTo(550, pdf.y).stroke().moveDown();
        pdf.fontSize(11).font('Helvetica').text(summary, { align: 'justify' });
        pdf.end();
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};