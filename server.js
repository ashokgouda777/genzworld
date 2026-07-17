const express = require('express');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize Firebase Admin SDK
try {
  let serviceAccount;

  // 1. Check if Service Account JSON is passed as an Environment Variable (Render / Production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } 
  // 2. Otherwise look for a local file (Development)
  else {
    const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      serviceAccount = require(localKeyPath);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    console.warn('WARNING: No Firebase Service Account credentials found. Notifications will not be sent.');
    console.warn('Please add serviceAccountKey.json or set FIREBASE_SERVICE_ACCOUNT env variable.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'active', service: 'GenZ World Push Notification Backend' });
});

// Secure endpoint to send topic-based notifications
app.post('/send-notification', async (req, res) => {
  const { topic, title, body, data } = req.body;

  if (!topic || !title || !body) {
    return res.status(400).json({ error: 'Missing required parameters: topic, title, and body are required.' });
  }

  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: topic,
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`Notification sent successfully to topic: ${topic}. MsgId: ${response}`);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending topic notification:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
// Privacy Policy Endpoint (For Play Store Approval)
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - GenZ World</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #E2E8F0; background-color: #0A0A1A; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 40px auto; background: #16162A; padding: 40px; border-radius: 16px; border: 1px solid #2D2D44; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #FFFFFF; font-size: 2.2rem; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; }
        h2 { color: #EC4899; margin-top: 30px; font-size: 1.4rem; }
        p, li { color: #94A3B8; font-size: 1rem; }
        ul { padding-left: 20px; }
        .footer { text-align: center; margin-top: 40px; color: #64748B; font-size: 0.85rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Privacy Policy</h1>
        <p><strong>Effective Date: July 17, 2026</strong></p>
        <p>GenZ World ("we", "our", or "us") operates the GenZ World mobile application. This Privacy Policy describes how we collect, use, and protect your information when you use our service.</p>
        
        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Anonymous Identifiers:</strong> We do not ask for names, email addresses, or phone numbers. To facilitate call connections and database interactions, the app automatically generates an anonymous User ID when you first open the app.</li>
          <li><strong>Device Information:</strong> We may collect generic device data (such as OS version, device model, and Firebase Cloud Messaging tokens) solely to route audio calls and send push notifications.</li>
          <li><strong>Voice Streams:</strong> All audio/voice communication is streamed directly and temporarily in real-time to connect your call (using peer-to-peer technology where possible). We **never** record, store, or monitor your conversations on any server.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the collected anonymous data solely to:</p>
        <ul>
          <li>Establish and maintain WebRTC peer-to-peer audio calls between you and other users.</li>
          <li>Allow you to participate in public audio rooms (Podcasts, Debates, Anthakshari).</li>
          <li>Route push notifications to notify you of incoming calls or matching alerts.</li>
        </ul>

        <h2>3. Data Sharing and Third-Party Services</h2>
        <p>We do not sell or share any user data. We use Google Firebase (Authentication, Firestore, and Cloud Messaging) to store anonymous presence states and deliver push notifications. These third-party services process anonymous data in accordance with their standard privacy policies.</p>

        <h2>4. Data Retention and Deletion</h2>
        <p>All matchmaking queue documents and active call records are automatically deleted from our servers immediately upon completion of the match or call. If you wish to delete your anonymous user profile record entirely, you can reset your app storage at any time.</p>

        <h2>5. Children's Privacy</h2>
        <p>Our app does not knowingly address anyone under the age of 13. We do not collect personally identifiable information from anyone. If you are a parent or guardian and you are aware that your child has used our app, please contact us.</p>

        <h2>6. Changes to This Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

        <div class="footer">
          <p>© 2026 GenZ World. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Terms of Service Endpoint (For Play Store Approval)
app.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - GenZ World</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #E2E8F0; background-color: #0A0A1A; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 40px auto; background: #16162A; padding: 40px; border-radius: 16px; border: 1px solid #2D2D44; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #FFFFFF; font-size: 2.2rem; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; }
        h2 { color: #EC4899; margin-top: 30px; font-size: 1.4rem; }
        p, li { color: #94A3B8; font-size: 1rem; }
        ul { padding-left: 20px; }
        .footer { text-align: center; margin-top: 40px; color: #64748B; font-size: 0.85rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Terms of Service</h1>
        <p><strong>Effective Date: July 17, 2026</strong></p>
        <p>Welcome to GenZ World. By using our application, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>

        <h2>1. User Guidelines & Community Rules</h2>
        <p>GenZ World is a voice-based social platform. To ensure a safe and friendly community, you agree not to:</p>
        <ul>
          <li>Engage in harassment, hate speech, bullying, threat, or abuse towards any other user.</li>
          <li>Record or store any voice conversations of other users without their explicit verbal consent.</li>
          <li>Impersonate any person or entity or misrepresent your gender/identity to disrupt matchmaking.</li>
          <li>Share or broadcast sexually explicit, offensive, or illegal audio content.</li>
        </ul>

        <h2>2. Age Restrictions</h2>
        <p>You must be at least 13 years of age to use the general features of GenZ World. However, **Flirt Mode** is strictly restricted to users who are 18 years of age or older. By entering Flirt Mode, you explicitly confirm that you are at least 18 years old.</p>

        <h2>3. User Reporting and Bans</h2>
        <p>We maintain a zero-tolerance policy for abusive behavior. Users have the right to block and report anyone who violates these terms. Any user flagged for abusive behavior, harassment, or violating terms will be **permanently suspended** immediately from using the platform.</p>

        <h2>4. Disclaimers & Limitation of Liability</h2>
        <p>Our service is provided on an "as is" and "as available" basis. We do not guarantee that calls will be uninterrupted or error-free. We are not responsible or liable for any user behavior, conversation contents, or connections established through our matchmaking system.</p>

        <h2>5. Governing Law</h2>
        <p>These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>

        <div class="footer">
          <p>© 2026 GenZ World. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GenZ World backend server running on port ${PORT}`);
});
