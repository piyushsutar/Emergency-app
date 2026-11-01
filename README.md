# Emergency SOS & Safety Management Android App

A complete, professional, and fully functional Emergency SOS and Safety Management Mobile Application built with **HTML5, Modern CSS, Vanilla JavaScript, Capacitor, and Native Android Plugins**.

---

## 📱 Features Overview

### 1. User Registration & Authentication
- Full Name, Email ID, 10-digit Mobile Number, Password, and Confirm Password.
- Client-side SHA-256 password hashing via Web Crypto API (never stores plain text).
- Persistent multi-user session with automatic session restore on launch.
- Password reset flow for forgotten passwords.
- Secure logout mechanism.

### 2. User Personal Profile & Medical Info
- Profile fields: Full Name, Profile Photo, Email ID, Mobile Number, Date of Birth, Full Address, Blood Group.
- Blood Group options: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, and `Unknown`.
- Capture profile photo using Camera plugin or upload from file gallery.
- Dynamic profile synchronization with Home Dashboard.

### 3. Emergency Contact Management (Up to 5 Contacts)
- Store up to 5 trusted emergency contacts (Name, 10-digit Mobile, Relationship).
- Add, Edit, and Delete contacts with mobile validation.
- 1-Tap Emergency Direct Phone Call (launches phone dialer).
- 1-Tap Direct SMS dispatch with pre-filled SOS text.
- Mini contacts overview displayed directly on Dashboard.

### 4. Home Dashboard
- Premium Red, Deep Black, and Crisp White emergency theme (`#E50914`, `#141416`, `#FFFFFF`).
- Prominent animated SOS Button with 3-tier pulsing radar glow rings.
- Live IST Clock (Indian Standard Time) ticking every second.
- Live GPS Status Card showing real-time Latitude, Longitude, Accuracy, and direct Google Maps link (24-hour validity note).
- Rapid Emergency Helpline Strip (112 All Emergency, 100 Police, 108 Ambulance, 1091 Women Safety).
- Shake Alert status banner.

### 5. Emergency SOS Engine & Shake Detection
- Initiates SOS via the main button or shaking the phone.
- Configurable countdown timer (3s, 5s, 10s) with emergency siren sound and vibration.
- "Cancel SOS" button to immediately abort accidental triggers.
- Multi-trigger debounce lock to prevent accidental duplicate triggers.
- Dispatches emergency SMS to all 5 saved contacts containing:
  - User Full Name & Phone
  - Blood Group
  - Current GPS Coordinates
  - Direct Google Maps Link
  - Date & Exact Time in IST

### 6. Emergency SMS & Call History (Honest Tracking)
- Per-contact SMS dispatch records with status (`Dispatched / Intent Prepared` vs `Failed`).
- Verifiable Call attempt logging (`Dialer Opened (Attempted)`).
- Never displays fake delivery confirmations.

### 7. Advanced Emergency History
- Date-wise and Day-wise grouped records.
- Search by Date (DD/MM/YYYY), Day name, or Mobile number.
- Filter by All, SMS logs, or Call logs.

### 8. Auditable Reports & PDF Generation
- Aggregated metrics: Total SOS, SMS Dispatched, Successful SMS, Call Attempts.
- Export options:
  - Today's Daily Emergency Report (PDF)
  - Date-Range Custom Report (PDF)
  - Complete Emergency History Report (PDF)
  - Individual SOS Incident Report (PDF)
- Printable A4 layout with print stylesheets and auto-download.

### 9. Persistent Storage
- Offline-first IndexedDB database (`EmergencySOS_DB`) with LocalStorage fallback.
- Multi-user isolation.

---

## ☁️ How to Generate the APK Without Installing Android Studio

Since you do not have (and do not want) Android Studio on your computer, you can generate your `EmergencySOS.apk` using the **Cloud Android Build Services** provided below.

### Method 1: GitHub Actions (Recommended — 100% Free, Automated 1-Click APK Builder)

Your project already has `.github/workflows/build-apk.yml` configured. GitHub provides free cloud virtual machines with Android SDK 34, JDK 17, and Gradle pre-installed.

1. **Initialize Git and commit the project** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Emergency SOS Android App Initial Commit"
   ```
2. **Push to a GitHub repository**:
   - Create a new repository on [github.com/new](https://github.com/new) (e.g. `emergency-sos-app`).
   - Run:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/emergency-sos-app.git
     git branch -M main
     git push -u origin main
     ```
3. **Download your APK**:
   - Go to your repository on GitHub.
   - Click on the **Actions** tab at the top.
   - You will see the workflow **"Build Emergency SOS APK (Cloud Build)"** running automatically.
   - Once it finishes (~2 minutes), click on the completed run.
   - Under the **Artifacts** section at the bottom, click **EmergencySOS-Android-APK** to download your installable `EmergencySOS.apk`!

---

### Method 2: Expo EAS Build (Cloud APK Build Service)

Your project includes `eas.json` configured for Android APK generation (`"buildType": "apk"`).

1. Install EAS CLI globally (or run via npx):
   ```bash
   npm install -g eas-cli
   ```
2. Log into your Expo account (create one free at [expo.dev](https://expo.dev)):
   ```bash
   eas login
   ```
3. Run the cloud APK build:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
4. EAS Build will compile the APK in Expo's cloud and give you a direct download link and QR code to install the APK directly on your Android phone!

---

## 🛠️ Local Development & Web Asset Sync

To update web assets or test changes:
```bash
# 1. Sync web assets to Android
npm run sync

# 2. Re-run cloud build anytime you make changes!
```
