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
});

// Privacy Policy Endpoint (For Play Store Approval)
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Terms of Service Endpoint (For Play Store Approval)
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GenZ World backend server running on port ${PORT}`);
});
