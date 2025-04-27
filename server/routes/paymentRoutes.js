// server/routes/paymentRoutes.js
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logger, errorLogger } from '../utils/logger.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'; // Using your existing Firebase auth
import User from '../models/user.js';
import nodemailer from 'nodemailer';
import { formatDate } from '../utils/helper.js';

dotenv.config();
const router = express.Router();
const transporter = nodemailer.createTransport({
    service: 'gmail', // Can use any email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your email
      pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Your email password or app password
    }
  });
// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_7fKV0KbLoMjeCL',
  key_secret: process.env.RAZORPAY_SECRET_KEY || '4apLBeLepvfXoNk8JFvukEmz',
});

// // Create a new order
// router.post('/create-order', verifyFirebaseToken, async (req, res) => {
//   try {
//     const firebaseUid = req.user.uid; // From Firebase auth
//     console.log('Firebase UID:', firebaseUid);
//     // Get user from database by Firebase UID
//     const user = await User.findOne({ uid: firebaseUid });
//     console.log('User found:', user._id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     console.log('Creating payment order for user:', user.email);
//     // Define the order options
//     const options = {
//       amount: 999 * 100, // amount in smallest currency unit (paise) - ₹999
//       currency: "INR",
//       receipt: `receipt_${Date.now()}_${user._id}`,
//       notes: {
//         userId: user._id.toString(),
//         firebaseUid: firebaseUid
//       }
//     };
    
//     logger.info(`Creating payment order for user: ${user.email}`);
    
    
//     // Create the order
//     console.log('Creating Razorpay order with options:', options);
//     const order = await razorpay.orders.create(options);
//     console.log('Order created:', order);
//     logger.info(`Payment order created: ${order.id}`);
    
//     // Return order details
//     res.status(200).json({
//       id: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       user: {
//         name: user.name || '',
//         email: user.email || ''
//       }
//     });
//   } catch (error) {
//     errorLogger.error(`Create order error: ${error.message}`);
//     res.status(500).json({ error: 'Failed to create payment order' });
//   }
// });
const sendReceiptEmail = async (user, orderId, paymentId, amount) => {
    try {
      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      
      const emailTemplate = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
              .logo { font-size: 24px; font-weight: bold; color: #4C6FFF; }
              .receipt { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .details { margin: 20px 0; }
              .details table { width: 100%; border-collapse: collapse; }
              .details table td { padding: 8px; border-bottom: 1px solid #eee; }
              .amount { font-size: 20px; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
              .button { display: inline-block; background: #4C6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">CMS Premium</div>
              </div>
              
              <h2>Payment Receipt</h2>
              <p>Dear ${user.name},</p>
              <p>Thank you for your purchase! Your payment has been processed successfully.</p>
              
              <div class="receipt">
                <h3>Receipt Details</h3>
                <div class="details">
                  <table>
                    <tr>
                      <td><strong>Order ID:</strong></td>
                      <td>${orderId}</td>
                    </tr>
                    <tr>
                      <td><strong>Payment ID:</strong></td>
                      <td>${paymentId}</td>
                    </tr>
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>${formatDate(currentDate)}</td>
                    </tr>
                    <tr>
                      <td><strong>Amount:</strong></td>
                      <td class="amount">₹${(amount/100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>Paid</td>
                    </tr>
                    <tr>
                      <td><strong>Subscription Period:</strong></td>
                      <td>${formatDate(currentDate)} to ${formatDate(expiryDate)}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <p>Your premium subscription is now active! You now have access to all premium features including advanced templates, unlimited projects, and priority support.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://cms.com/home" class="button">Access Your Dashboard</a>
              </p>
              
              <p>If you have any questions about your subscription or need help with anything, feel free to reach out to our support team.</p>
              
              <p>Thanks,<br>The CMS Team</p>
              
              <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© ${currentDate.getFullYear()} CMS Premium. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      const mailOptions = {
        from: '"CMS Premium" <no-reply@cms-premium.com>',
        to: user.email,
        subject: 'Payment Receipt - CMS Premium Subscription',
        html: emailTemplate
      };
      
      await transporter.sendMail(mailOptions);
      logger.info(`Receipt email sent to ${user.email} for order ${orderId}`);
      return true;
    } catch (error) {
      errorLogger.error(`Failed to send receipt email: ${error.message}`);
      return false;
    }
  };
  
// Verify Razorpay is initialized
console.log('Razorpay initialized:', !!razorpay);

// Create a new order - with improved error handling
router.post('/create-order', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    console.log('Firebase UID:', firebaseUid);
    
    // Get user from database by Firebase UID
    const user = await User.findOne({ uid: firebaseUid });
    
    if (!user) {
      logger.warn(`User not found for UID: ${firebaseUid}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Creating payment order for user:', user.email);
    
    // Define the order options
    const options = {
      amount: 999 * 100, // amount in smallest currency unit (paise) - ₹999
      currency: "INR",
    //   receipt: `receipt_${Date.now()}_${user._id.toString()}`,
        receipt: `rcpt_${Date.now()}_${user._id.toString().slice(-6)}`,

      notes: {
        userId: user._id.toString(),
        firebaseUid: firebaseUid
      }
    };
    
    logger.info(`Creating payment order for user: ${user.email}`);
    console.log('Creating Razorpay order with options:', options);
    
    // Handle potential Razorpay errors more gracefully
    try {
      // Create the order
      const order = await razorpay.orders.create(options);
      console.log('Order created:', order);
      
      // Return order details
      return res.status(200).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        user: {
          name: user.name || '',
          email: user.email || ''
        }
      });
    } catch (razorpayError) {
      console.error('Razorpay API Error:', razorpayError);
      errorLogger.error(`Razorpay API Error: ${razorpayError.message}`);
      
      // Check for specific Razorpay errors
      if (razorpayError.statusCode === 401) {
        return res.status(500).json({ error: 'Invalid Razorpay API credentials' });
      }
      
      return res.status(500).json({ 
        error: 'Payment gateway error', 
        details: razorpayError.message 
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    errorLogger.error(`Create order error: ${error.message}`);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment signature
// router.post('/verify-payment', verifyFirebaseToken, async (req, res) => {
//   try {
//     const { orderId, paymentId, signature } = req.body;
//     const firebaseUid = req.user.uid;
    
//     // Get user from database
//     const user = await User.findOne({ uid: firebaseUid });
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     logger.info(`Verifying payment for order: ${orderId}, user: ${user.email}`);
    
//     // Create signature verification string
//     const text = `${orderId}|${paymentId}`;
    
//     // Generate expected signature
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
//       .update(text)
//       .digest('hex');
    
//     // Verify signature
//     if (expectedSignature === signature) {
//       // Update user's premium status
//       await User.findByIdAndUpdate(user._id, { 
//         isPremium: true,
//         premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
//       });
      
//       logger.info(`Payment verified successfully for user: ${user.email}`);
//       res.json({ status: 'success', message: 'Payment verification successful' });
//     } else {
//       logger.warn(`Invalid payment signature for order: ${orderId}`);
//       res.status(400).json({ status: 'failure', error: 'Invalid payment signature' });
//     }
//   } catch (error) {
//     errorLogger.error(`Verify payment error: ${error.message}`);
//     res.status(500).json({ status: 'error', error: 'Payment verification failed' });
//   }
// });

router.post('/verify-payment', verifyFirebaseToken, async (req, res) => {
    try {
      const { orderId, paymentId, signature } = req.body;
      const firebaseUid = req.user.uid;
      
      // Get user from database
      const user = await User.findOne({ uid: firebaseUid });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      logger.info(`Verifying payment for order: ${orderId}, user: ${user.email}`);
      
      // Create signature verification string
      const text = `${orderId}|${paymentId}`;
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || '4apLBeLepvfXoNk8JFvukEmz')
        .update(text)
        .digest('hex');
      
      // Verify signature
      if (expectedSignature === signature) {
        // Update user's premium status
        await User.findByIdAndUpdate(user._id, { 
          isPremium: true,
          premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
        
        logger.info(`Payment verified successfully for user: ${user.email}`);
        res.json({ status: 'success', message: 'Payment verification successful' });
        // Get payment details from Razorpay
        try {
          const paymentDetails = await razorpay.payments.fetch(paymentId);
          
          // Send receipt email
          await sendReceiptEmail(
            user, 
            orderId, 
            paymentId, 
            paymentDetails.amount || 999 * 100 // Default to 999 if amount not found
          );
          
        } catch (emailError) {
          // Don't fail the verification if email fails
          errorLogger.error(`Failed to send receipt email: ${emailError.message}`);
        }
        

      } else {
        logger.warn(`Invalid payment signature for order: ${orderId}`);
        res.status(400).json({ status: 'failure', error: 'Invalid payment signature' });
      }
    } catch (error) {
      errorLogger.error(`Verify payment error: ${error.message}`);
      res.status(500).json({ status: 'error', error: 'Payment verification failed' });
    }
  });


// Check premium status
router.get('/premium-status', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const user = await User.findOne({ uid: firebaseUid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      isPremium: user.isPremium || false,
      premiumExpiresAt: user.premiumExpiresAt || null
    });
  } catch (error) {
    errorLogger.error(`Premium status check error: ${error.message}`);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

export default router;