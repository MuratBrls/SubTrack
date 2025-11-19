# SubTrack AI 🚀

SubTrack AI is a modern, intelligent subscription tracking dashboard built as a Progressive Web App (PWA). It helps users manage recurring payments, visualize spending habits, and get AI-powered insights using Google's Gemini API.

It features a secure **Vault system** for storing subscription credentials and supports **Real-time Authentication** via Google and Apple (Firebase).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)
![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)

## ✨ Key Features

### 📊 Smart Management
- **Dashboard:** Track monthly and yearly expenses in mixed currencies (USD, EUR, TRY).
- **Visual Analytics:** Interactive charts showing spending distribution by category.
- **Gemini AI Integration:** Gets personalized spending insights, savings tips, and automatic category suggestions based on service names.

### 🔒 Security & Vault
- **Credential Vault:** Securely store email/usernames and passwords for each subscription.
- **PIN Protection:** A secondary, 4-digit PIN is required to unlock and view credentials, adding an extra layer of security beyond the login screen.
- **Copy-to-Clipboard:** Easy one-tap copy for stored credentials.

### 🔐 Authentication
- **Social Login:** Native integration with **Google** and **Apple** Sign-In via Firebase Authentication.
- **Data Persistence:** User data is synced with their account ID.

### 📱 PWA Experience
- **Installable:** Works like a native app on iOS and Android.
- **Offline Ready:** Caches core assets for faster loading.
- **Dark Mode:** Fully supported dark/light themes.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite (implied environment)
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (`@google/genai`)
- **Auth:** Firebase Authentication (Google & Apple Providers)
- **Icons:** Lucide React
- **Charts:** Recharts

---

## 🚀 Getting Started

### 1. Configuration

This project requires two main API configurations to function fully: **Firebase** (for Auth) and **Gemini** (for AI).

#### A. Firebase Setup (Authentication)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Navigate to **Build > Authentication > Sign-in method**.
4. Enable **Google** and **Apple** providers.
5. Go to **Project Settings > General** and create a "Web App".
6. Copy the `firebaseConfig` object.
7. Open `services/firebase.ts` in this project and replace the placeholder config:

```typescript
// services/firebase.ts
const firebaseConfig = {
  apiKey: "YOUR_REAL_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  // ... other fields
};
```

#### B. Gemini AI Setup
The project expects a Google GenAI API key to provide insights.
1. Get an API key from [Google AI Studio](https://aistudio.google.com/).
2. Ensure the API key is available in your environment variables as `API_KEY`.

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/subtrack-ai.git

# Navigate into the directory
cd subtrack-ai

# Install dependencies
npm install

# Start the development server
npm start
```

---

## 📖 Usage Guide

### Adding a Subscription
1. Click the **"Add"** or **"+"** button.
2. Enter the service name (e.g., Netflix). The AI will attempt to auto-categorize it.
3. Enter price, currency, and billing cycle.
4. (Optional) Add login credentials for the "Vault".

### Using the Vault
1. In the dashboard list, click the **Key icon** next to a subscription.
2. If it's your first time, you will be asked to set a **4-digit Vault PIN**.
3. This PIN is independent of your Google/Apple login password.
4. Once entered correctly, you can view or copy your saved passwords.

### AI Analysis
1. Go to the **Analytics** tab.
2. Click **"AI Spending Analysis"**.
3. The Gemini model will analyze your subscriptions and provide actionable tips to save money.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.