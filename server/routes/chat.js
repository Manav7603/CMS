// server/routes/chat.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

const router = express.Router();

const promptInstructions = `
You are an intelligent and concise assistant for a CMS (Content Management System) used to design newspaper pages.

- The CMS Workbench lets users build page layouts using sections, text areas, and images with drag, drop, resize, and transform functionality.
- Items cannot overlap or cross boundaries. Text formatting (bold, italic, underline), border styling, and color options are available.
- Users can replace existing sections with others of the same size using the "Replace Section" button.
- Page layouts can be saved or exported as PDFs.

The Workbench consists of:
1. **Action Bar**: Tools for saving, searching layouts, zooming, hand tool, exporting as PDF, resetting view, and showing active users.
2. **Toolbox**: Options to add sections, text boxes, images, upload assets, format text, style borders, and view item details.
3. **Workspace**: A customizable grid with rows and columns (default gutter width: 10) for precise layout control.

- Keep responses clear, concise, and helpful.
- Use markdown formatting where appropriate.
- Always use the given context to guide your answers.
`;

// Initialize Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Request body:', req.body);
    if (!message) {
      logger.warn('Chat API request received without message');
      console.error('Message is required');
      return res.status(400).json({ error: 'Message is required' });
    }

    logger.info(`Chat request received: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
    console.log('Chat request received:', message);
    // Log the message length
    console.log('Message length:', message.length);
    // Log the message content
    console.log('Message content:', message);
    // Log the message type
    console.log('Message type:', typeof message);
    // Log the message content type
    console.log('Message content type:', typeof message.content);

    // Generate content using Gemini API - updated model name based on the curl example
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const instructions = promptInstructions + message;
    // Format the request according to the API specification
    const result = await model.generateContent({
      contents: [
     
        { 
        parts: [{ text: instructions }] 
      }
    ]
    });
    
    const response = result.response.text();
    
    logger.info('Chat response generated successfully');
    console.log('Chat response:', response);
    return res.json({ response });
  } catch (error) {
    logger.error('Error in chat API:', error);
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;