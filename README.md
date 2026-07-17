# GenZ World Backend Server

This is the secure backend server for sending FCM Push Notifications to the **GenZ World** app. It uses the official Firebase Admin SDK and is ready to deploy to **Render** or run locally.

---

## Getting Started (Local Development)

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Download Firebase Service Account Credentials
1. Go to your **Firebase Console** → **Project Settings** → **Service Accounts**.
2. Click **Generate new private key** (this downloads a `.json` file).
3. Rename the downloaded file to `serviceAccountKey.json` and save it directly in this folder (`genz-world-backend/`).
4. Start the server:
   ```bash
   npm start
   ```

---

## Deploying to Render (Production)

1. **Commit and Push to GitHub**:
   Push this folder (`genz-world-backend/`) to a private repository on your GitHub.

2. **Deploy on Render**:
   - Go to [Render](https://render.com/) and create a new **Web Service**.
   - Link your GitHub repository.
   - Choose the **Free** tier.

3. **Configure Environment Variables**:
   In your Render dashboard for this Web Service:
   - Go to **Environment** tab.
   - Add a new variable:
     - **Key**: `FIREBASE_SERVICE_ACCOUNT`
     - **Value**: (Open your `serviceAccountKey.json` file, copy the *entire* text content, and paste it here).
   - Click **Save changes**.

Render will automatically deploy the server, and your secure API will be active at:
`https://your-app-name.onrender.com`
