# SubTrack AI 🚀

**SubTrack AI** is a comprehensive, cross-platform subscription tracking ecosystem designed to help you take control of your recurring expenses. It combines a modern **Web Dashboard** (PWA) and a native **Mobile App** (React Native/Expo) powered by **Google Gemini AI** to provide intelligent insights into your spending habits.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB)
![Expo](https://img.shields.io/badge/Expo-51-black)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2)

## ✨ Key Features

### 🧠 AI-Powered Intelligence
- **Smart Analysis:** Generates personalized spending reports and savings tips using Google Gemini Models.
- **Auto-Categorization:** Automatically detects categories (Entertainment, Utilities, etc.) based on the subscription name.
- **Spending Forecast:** Estimates monthly and yearly costs across different currencies (USD, EUR, TRY).

### 🔒 Security Vault
- **Credential Storage:** Securely store login details (email/password) for each subscription.
- **Double Encryption Layer:** Access to the vault requires a user-defined **4-digit PIN**, adding a second layer of security beyond the app login.
- **Local & Secure:** Sensitive data is handled with strict security practices.

### 📱 Cross-Platform Experience
- **Web App (PWA):** Fully responsive React application with dark mode, charts, and comprehensive management tools.
- **Mobile App:** Native iOS and Android experience built with Expo, featuring smooth gestures and offline capabilities.

### 📊 Analytics & Management
- **Visual Charts:** Interactive pie charts breakdown spending by category.
- **Payment History:** Track past payments and due dates.
- **Multi-Currency:** Support for global currencies with automatic normalization for totals.

---

## 🛠️ Tech Stack

### Web (Frontend)
- **Framework:** React 19, Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State/Storage:** LocalStorage (with sync logic) & Firebase Auth

### Mobile
- **Framework:** React Native, Expo SDK 51
- **Navigation:** React Navigation (Bottom Tabs)
- **Storage:** Async Storage

### Services
- **AI:** Google GenAI SDK (`gemini-2.5-flash`)
- **Auth:** Firebase (Google, Apple, Email/Password)
- **Icons:** Lucide React / Lucide React Native

---

## 🚀 Getting Started

This repository contains both the web application and the mobile application.

### Prerequisites
- Node.js (v18 or higher)
- NPM or Yarn
- A Google Gemini API Key
- A Firebase Project (optional for Auth, required for cloud sync)

### 1. Web Application Setup

The web app is located in the root directory.

```bash
# Install dependencies
npm install

# Configure Environment
# Create a .env file or set process.env.API_KEY in your environment variables for Gemini AI.

# Start Development Server
npm run dev
```

### 2. Mobile Application Setup

The mobile app is located in the `mobile/` folder.

```bash
# Navigate to mobile folder
cd mobile

# Install dependencies
npm install

# Start Expo
npx expo start -c
```
*Use the Expo Go app on your phone to scan the QR code, or run on an emulator (Android Studio / Xcode).*

---

## ⚙️ Configuration

### AI Setup (Gemini)
To enable the "Analyze" and "Auto-Categorize" features, you need a Google Gemini API Key.
1. Get a key from [Google AI Studio](https://aistudio.google.com/).
2. Ensure `process.env.API_KEY` is accessible in `services/geminiService.ts`.

### Firebase Setup (Auth)
To enable real authentication:
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable Auth providers (Google, Apple, Email).
3. Update `services/firebase.ts` with your config object.

---

## 📸 Project Structure

```
subtrack-ai/
├── components/         # Shared React Web Components (Charts, Modals, Vault)
├── services/           # Shared Logic (Gemini AI, Firebase, Storage)
├── mobile/             # React Native Expo Project
│   ├── screens/        # Mobile Screens (Dashboard, Add)
│   └── App.tsx         # Mobile Entry Point
├── index.tsx           # Web Entry Point
└── types.ts            # Shared TypeScript Interfaces
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
