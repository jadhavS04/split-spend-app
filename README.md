# Split Spend

**A shared expense-splitting app for Android, built for groups that need transparency, accountability and zero data loss.**

Add people to a group, record who paid what, and every member sees the same bills, totals and balances in real time. Every action is stored in a permanent, tamper-resistant activity log, and every other member is notified when something changes.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Guide](#setup-guide)
  - [1. Create the Firebase project](#1-create-the-firebase-project)
  - [2. Add your Firebase config](#2-add-your-firebase-config)
  - [3. Build the APK with GitHub Actions](#3-build-the-apk-with-github-actions)
  - [4. Install the app](#4-install-the-app)
- [Using the App](#using-the-app)
- [Data Safety and Accountability](#data-safety-and-accountability)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Features

**Shared groups**
- Create a group and get a random 10-character group code.
- Others join with the code and pick their name or add themselves.
- Bills, people and totals sync across all phones within seconds.

**Fair splitting**
- Total spend of the whole group.
- Equal share per person.
- Per-person balance: who gets money back and who owes.
- A "who pays whom" settlement list that minimises the number of payments.

**Transparency and accountability**
- Permanent **Activity log** showing who did what and when.
- Edits record the old and new values (amount, note, payer).
- Every bill shows who added it, who edited it, and when.

**No data loss**
- Bills are never deleted. They can only be cancelled with a required reason, and restored later.
- People are never erased. They can be removed with a required reason, and added back.
- Data is stored online in Google Firestore, so a lost phone loses nothing.
- Works offline: changes are saved on the phone and sent when the connection returns.
- One-tap **Copy full backup** exports all members, bills and the log as text.

**Notifications**
- Every other member is notified when a bill is added, edited, cancelled or restored, or when a person is added or removed.

---

## How It Works

```
 Phone A ─┐                                  ┌─ Phone B
          ├──►  Firebase Anonymous Auth  ◄───┤
 Phone C ─┘            │                      └─ Phone D
                       ▼
                Cloud Firestore
        groups/{code}
            ├── members/{id}     people in the group
            ├── expenses/{id}    bills (never deleted, only cancelled)
            └── log/{id}         append-only audit trail
```

All writes that change data are sent as a **single atomic batch** together with their log entry, so a change can never exist without a record of it.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App shell | [Capacitor 6](https://capacitorjs.com/) (Android) |
| UI | Plain HTML, CSS and JavaScript (single file) |
| Database | Google Cloud Firestore (real-time listeners, offline persistence) |
| Auth | Firebase Anonymous Authentication |
| Notifications | `@capacitor/local-notifications` |
| Local storage | `@capacitor/preferences` |
| Build | GitHub Actions (Node 20, Java 17, Gradle) |

---

## Project Structure

```
split-spend-app/
├── .github/workflows/
│   └── build-apk.yml        # Builds the debug APK on every push
├── www/
│   ├── index.html           # The whole app (UI + logic)
│   └── firebase-config.js   # Your Firebase project settings
├── capacitor.config.json    # App id and name
├── firestore.rules          # Security rules to publish in Firebase
├── package.json             # Capacitor and Firebase dependencies
└── README.md
```

The Firebase SDK files are copied into `www/lib/` automatically during the build, so they are not stored in the repository.

---

## Setup Guide

You need a free Google account (for Firebase) and a free GitHub account (to build the APK). No Android Studio or coding tools are required.

### 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Create a project**. Analytics is not needed.
2. **Enable anonymous sign-in:** open **Authentication → Sign-in method → Anonymous**, switch **Enable** on and **Save**.
3. **Create the database:** open **Firestore Database → Create database**. Choose **Standard edition**, pick a location near your users, and select **Production mode**.
4. **Publish the rules:** open the Firestore **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules), and click **Publish**.
5. **Register a web app:** open **Project settings → General → Your apps**, click the web icon `</>`, register the app (skip Hosting), and copy the `firebaseConfig` values.

### 2. Add your Firebase config

Edit `www/firebase-config.js` and fill in your own values. The first line must be exactly `window.FB_CFG = {`:

```js
window.FB_CFG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> If the app shows **"Setup needed"**, the first line is wrong or a value is still `PASTE_HERE`.

### 3. Build the APK with GitHub Actions

1. Push all files to a GitHub repository, including the hidden `.github` folder.
2. Open the **Actions** tab. The **Build APK** workflow starts automatically (about 3 to 5 minutes). You can also start it manually with **Run workflow**.
3. When it shows a green tick, open the newest run and download the **split-spend-apk** artifact at the bottom of the page.
4. Unzip it. Inside is `app-debug.apk`.

### 4. Install the app

1. Copy `app-debug.apk` to the phone (USB, WhatsApp, Google Drive).
2. **Uninstall any older version first.** Each build is signed with a different debug key, and Android refuses to install over an app signed with another key.
3. Tap the APK and allow **Install unknown apps** if Android asks.
4. Allow notifications when prompted.

---

## Using the App

1. **One person** taps **Create group**, enters a group name and their own name, and receives the group code.
2. Tap **Share code** and send it to the others.
3. **Everyone else** taps **Join with group code**, enters the code, and picks their name (or joins as a new person).
4. Use the tabs:
   - **Summary:** total spend, equal share, each person's balance, settlement list, add or remove people, copy backup.
   - **Bills:** add a bill (who paid, amount, note), edit it, or cancel it with a reason.
   - **Activity:** the permanent log of every action.

**Removing a person:** tap **Remove** on the Summary tab and give a reason. A person who has active bills cannot be removed until those bills are cancelled, so totals never change silently. Removed people can be added back.

---

## Data Safety and Accountability

| Guarantee | How it is enforced |
|---|---|
| Nothing is hard-deleted | Security rules block deletes on groups, people, bills and log entries |
| The log cannot be altered | Log entries can be created but never updated or deleted |
| Every change is recorded | The change and its log entry are written in one atomic batch |
| Changes are traceable | Each entry stores the member name, the device's anonymous user id and a timestamp |
| Phone loss does not lose data | Data lives in Firestore; a new phone rejoins with the group code |
| Offline-safe | Firestore offline persistence queues writes until the phone is online |

Tap **Copy full backup** regularly and keep the text somewhere safe (Notes, a chat with yourself, a cloud drive). Also keep the **group code** safe.

---

## Security Notes

- The values in `firebase-config.js` identify your Firebase project and are **not secrets**. Access is controlled by the Firestore rules, not by hiding this file.
- Anyone who has the **group code** can join and see the group. Share it only with people you trust. Codes are random and 10 characters long, and groups cannot be listed or searched.
- Names are chosen by users and are not verified. The log also stores each device's anonymous user id for reference, but the app has no phone-number or email verification.
- The rules in `firestore.rules` require sign-in for every read and write. For stricter control (for example, only group members can read), the app would need real accounts.

---

## Known Limitations

- **Debug build.** The APK is a debug build. It is fine for personal use but cannot be published on Google Play. A signed release build is needed for that.
- **Notifications** arrive when the app is open or recently used. Alerts when the app is fully closed require Firebase Cloud Messaging and Cloud Functions, which are not included.
- **Equal split only.** Every active member pays the same share. Unequal shares and per-bill participants are not supported yet.
- **Single currency (₹).**
- **No export to PDF or spreadsheet.** The backup is plain JSON text.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| App shows **"Setup needed"** | In `www/firebase-config.js`, make sure line 1 is `window.FB_CFG = {` and no value says `PASTE_HERE` |
| **"Could not sign in"** | Check the internet connection and that **Anonymous** sign-in is enabled in Firebase Authentication |
| **"Group not found"** | Re-check the code (it is not case-sensitive, but must be complete) |
| Permission or "Failed" errors when saving | Make sure the rules from `firestore.rules` are **published** in the Firestore Rules tab |
| **"App not installed"** | Uninstall the old version first, then install the new APK |
| Phone still shows an old screen | Download the artifact from the **newest** green run in the Actions tab |
| Nothing appears on other phones | Everyone must join the **same** group code. Only one person should tap **Create group** |
| The APK is missing inside the download | GitHub wraps it in a ZIP. Unzip the artifact to find `app-debug.apk` |

---

## Roadmap

- [ ] Unequal splits and per-bill participants
- [ ] Push notifications when the app is closed (Firebase Cloud Messaging)
- [ ] Real accounts with member-only access control
- [ ] Multiple currencies
- [ ] Export to PDF and CSV
- [ ] Signed release build for Google Play

---

## Author

Built by **Shubham Jadhav** ([@jadhavS04](https://github.com/jadhavS04)).

Contributions and suggestions are welcome. Open an issue to report a bug or propose a feature.
