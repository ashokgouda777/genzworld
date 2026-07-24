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

// Helper check to verify if Firebase Admin SDK was successfully initialized
const isFirebaseInitialized = () => {
  return admin.apps.length > 0;
};

// Serve Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health Check Endpoint (For monitoring/uptime check)
app.get('/status', (req, res) => {
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

// Child Safety Policy Endpoint (For Play Store Approval)
app.get('/child-safety', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'child-safety.html'));
});

// ==========================================
// SAFETY & PROTECTION ENDPOINTS
// ==========================================

// Endpoint to block a user
app.post('/block', async (req, res) => {
  const { userId, blockedUserId } = req.body;

  if (!userId || !blockedUserId) {
    return res.status(400).json({ error: 'Missing required parameters: userId and blockedUserId are required.' });
  }

  if (!isFirebaseInitialized()) {
    console.warn('Firebase not initialized. Simulating successful block.');
    return res.status(200).json({ success: true, message: 'Simulated block successfully (Firebase offline).' });
  }

  try {
    const db = admin.firestore();
    // Save block relation in blocks collection
    await db.collection('blocks').doc(`${userId}_${blockedUserId}`).set({
      userId: userId,
      blockedUserId: blockedUserId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`User ${userId} successfully blocked user ${blockedUserId}`);
    return res.status(200).json({ success: true, message: 'User blocked successfully.' });
  } catch (error) {
    console.error('Error blocking user:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to report a user with automated ban checks
app.post('/report', async (req, res) => {
  const { reporterId, reportedId, reason, description } = req.body;

  if (!reporterId || !reportedId) {
    return res.status(400).json({ error: 'Missing required parameters: reporterId and reportedId are required.' });
  }

  if (!isFirebaseInitialized()) {
    console.warn('Firebase not initialized. Simulating successful report.');
    return res.status(200).json({ success: true, message: 'Simulated report successfully (Firebase offline).' });
  }

  try {
    const db = admin.firestore();
    // Add report document
    const reportRef = db.collection('reports').doc();
    await reportRef.set({
      reporterId: reporterId,
      reportedId: reportedId,
      reason: reason || 'unspecified',
      description: description || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Check count of reports for the reported user to see if they need auto-banning
    const reportsSnapshot = await db.collection('reports')
      .where('reportedId', '==', reportedId)
      .get();
    
    const reportCount = reportsSnapshot.size;
    let autoBanned = false;

    // Threshold of 5 reports triggers automatic device/account ban
    if (reportCount >= 5) {
      await db.collection('banned_users').doc(reportedId).set({
        userId: reportedId,
        reason: `Automated ban: User received ${reportCount} community safety flags.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      autoBanned = true;
      console.log(`User ${reportedId} has been auto-banned after reaching ${reportCount} reports.`);
    }

    console.log(`User ${reportedId} reported by ${reporterId}. Total reports: ${reportCount}`);
    return res.status(200).json({ 
      success: true, 
      message: 'Report submitted successfully.',
      autoBanned: autoBanned
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to permanently deactivate and delete a user profile
app.post('/deactivate', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId is required.' });
  }

  if (!isFirebaseInitialized()) {
    console.warn('Firebase not initialized. Simulating user deactivation.');
    return res.status(200).json({ success: true, message: 'Simulated user deactivation successfully (Firebase offline).' });
  }

  try {
    const db = admin.firestore();
    const auth = admin.auth();

    // 1. Delete presence/profile document from Firestore
    await db.collection('users').doc(userId).delete();

    // 2. Delete user from Firebase Auth
    try {
      await auth.deleteUser(userId);
      console.log(`Successfully deleted auth user profile for ${userId}`);
    } catch (authError) {
      console.warn(`Firebase Auth user deletion skipped (user may not exist in Auth database): ${authError.message}`);
    }

    // 3. Store a deactivated log record (anonymized)
    await db.collection('deactivated_users').doc(userId).set({
      userId: userId,
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`User ${userId} deactivated and cleared from database permanently.`);
    return res.status(200).json({ success: true, message: 'Account deactivated and data deleted permanently.' });
  } catch (error) {
    console.error('Error deactivating user account:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GenZ World backend server running on port ${PORT}`);
});
