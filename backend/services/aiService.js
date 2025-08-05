const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Classifies document text into categories.
 */
const classifyTextWithGemini = async (text) => {
  const prompt = `Analyze the following document text and classify it into one of the primary categories: 'Invoice', 'Contract', 'Resume', 'Report', 'Email', or 'Other'. Provide a confidence score as a percentage (0-100). Return your response ONLY as a valid JSON object with the keys "type" and "score".

Document Text:
---
${text.substring(0, 4000)}
---`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error in Gemini Classification:", error);
    return { type: 'Classification Failed', score: 0 };
  }
};

/**
 * Extracts structured data from classified document.
 */
const extractStructuredData = async (text, classification) => {
  let prompt;
  const commonInstructions = `
Analyze the following document text and extract the key information into a valid JSON object.
Only return the JSON object, with no other text or markdown formatting.
If a value is not found, use "N/A".
Dates should be in YYYY-MM-DD format if possible.
`;

  switch (classification) {
    case 'Invoice':
      prompt = `${commonInstructions}
Extract the following fields: "invoiceNumber", "vendorName", "customerName", "invoiceDate", "dueDate", "totalAmount".

TEXT: """${text.substring(0, 4000)}"""`;
      break;
    case 'Contract':
      prompt = `${commonInstructions}
Extract the following fields: "contractTitle", "partyA", "partyB", "effectiveDate", "term".

TEXT: """${text.substring(0, 4000)}"""`;
      break;
    default:
      return {}; // No structured extraction for other types
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error in Gemini Structured Data Extraction:", error);
    return { error: "Failed to extract structured data." };
  }
};

/**
 * Summarizes document text.
 */
const summarizeTextWithGemini = async (text) => {
  const prompt = `Summarize the following text in 3-4 concise bullet points or a short paragraph. Focus on the key topics, entities, and purpose of the document.

Text:
---
${text.substring(0, 8000)}
---`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini Summary:", error);
    return "Could not generate a summary at this time.";
  }
};

/**
 * Compares two document texts and returns a similarity score.
 */
const compareTextsWithGemini = async (textA, textB) => {
  const prompt = `Compare the following two texts and determine their semantic similarity. Provide a similarity score as a percentage from 0 to 100, where 100 is identical. Return ONLY the numerical percentage value.

Text 1: "${textA.substring(0, 2000)}"
Text 2: "${textB.substring(0, 2000)}"`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const score = parseInt(response.text().trim(), 10);
    return isNaN(score) ? 0 : score;
  } catch (error) {
    console.error("Error in Gemini Text Comparison:", error);
    return 0;
  }
};

/**
 * Answers a question based only on the given document text.
 */
const answerQuestionFromText = async (text, question) => {
  const prompt = `
You are a helpful Q&A assistant. Your task is to answer the user's question based *only* on the provided document text.
If the answer is not found in the text, you must explicitly state that the information is not available in the document.
Do not use any external knowledge.

DOCUMENT TEXT:
---
${text.substring(0, 12000)}
---

USER'S QUESTION: "${question}"`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini Q&A:", error);
    return "Sorry, I encountered an error trying to answer the question.";
  }
};

/**
 * Analyzes sentiment of the given document text.
 */
const analyzeSentimentWithGemini = async (text) => {
  const prompt = `
Analyze the sentiment of the following text.
Respond with only a single word: 'Positive', 'Negative', or 'Neutral'.

TEXT:
---
${text.substring(0, 4000)}
---`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sentiment = response.text().trim();
    if (['Positive', 'Negative', 'Neutral'].includes(sentiment)) {
      return sentiment;
    }
    return 'Neutral';
  } catch (error) {
    console.error("Error in Gemini Sentiment Analysis:", error);
    return 'N/A';
  }
};

/**
 * Responds as a chatbot restricted to MAS Document Processor-related queries.
 */
const getChatbotResponse = async (question) => {
  const prompt = `You are a friendly and helpful AI assistant for a website called "MAS Document Processor". Your ONLY purpose is to answer questions about using this specific website. Do NOT answer questions about any other topic. If a user asks an unrelated question, politely state that you can only answer questions about the MAS Document Processor website.

User's Question: "${question}"`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini Chatbot:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};

/**
 * Analyzes a resume for ATS friendliness.
 */
const analyzeResumeATS = async (resumeText) => {
  const prompt = `
Act as an expert ATS (Applicant Tracking System) and resume reviewer. Analyze the following resume text.
Provide a detailed analysis in a valid JSON format only. Do not include any text outside the JSON object.
The JSON object must have the following structure:
{
  "overallScore": <an integer between 0 and 100 representing ATS compatibility>,
  "summary": "<a one-sentence summary of the resume's strengths or weaknesses>",
  "analysis": [
    { "criteria": "Contact Information", "pass": <true or false>, "feedback": "<Brief feedback on this point>" },
    { "criteria": "Keywords & Skills", "pass": <true or false>, "feedback": "<Feedback on keyword optimization for ATS>" },
    { "criteria": "Formatting & Fonts", "pass": <true or false>, "feedback": "<Feedback on the use of standard fonts and simple formatting>" },
    { "criteria": "Action Verbs", "pass": <true or false>, "feedback": "<Feedback on the use of strong action verbs>" },
    { "criteria": "Standard Sections", "pass": <true or false>, "feedback": "<Feedback on presence of standard sections like 'Experience', 'Education', 'Skills'>" }
  ],
  "suggestions": [
    "<A specific, actionable suggestion for improvement>",
    "<Another specific suggestion>"
  ]
}

RESUME TEXT:
---
${resumeText.substring(0, 8000)}
---`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error in Gemini Resume Analysis:", error);
    throw new Error("Failed to get analysis from AI. The response may have been in an unexpected format.");
  }
};

// Export all Gemini AI services
module.exports = {
  classifyTextWithGemini,
  extractStructuredData,
  summarizeTextWithGemini,
  compareTextsWithGemini,
  answerQuestionFromText,
  analyzeSentimentWithGemini,
  getChatbotResponse,
  analyzeResumeATS,
};
