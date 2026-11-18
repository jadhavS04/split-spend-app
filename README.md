# Split Spend

**A shared expense-splitting app for Android, built for groups that need transparency, accountability and zero data loss.**

Add people to a group, record who paid what, and every member sees the same bills, totals and balances in real time. Every action is stored in a permanent activity log, and other members are notified when something changes.

[**Download the latest APK**](https://github.com/jadhavS04/split-spend-app/releases/latest)

---

## Table of Contents

- [Features](#features)
- [Download and Install](#download-and-install)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Guide](#setup-guide)
- [Publishing a Release](#publishing-a-release)
- [Using the App](#using-the-app)
- [Data Safety and Accountability](#data-safety-and-accountability)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Features

**Multiple shared groups**
- Create a group and get a random 10-character group code.
- Others join with the code and pick their name or add themselves.
- A **My groups** screen lists every group on your phone. Tap one to open it, and use **Groups** to switch back.
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

**Stay up to date**
- **Refresh** button in every group, and pull down from the top of the screen to refresh.
- The app also refreshes by itself when you reopen it or the internet comes back.
- Notifications appear when another member adds, edits, cancels or restores a bill, or adds or removes a person (see [Known Limitations](#known-limitations)).

---

## Download and Install

1. Open the [latest release](https://github.com/jadhavS04/split-spend-app/releases/latest) on your phone and download **split-spend.apk**.
2. Tap the file and allow **Install unknown apps** if Android asks. Android may show a Play Protect warning for apps from outside the Play Store. Tap **Install anyway**.
3. Allow notifications when prompted.

**Updating:** releases are signed with the same key, so a new version installs over the old one and keeps your groups. If a build made before the shared key was added is installed on your phone, uninstall it once first. Note down your group codes before uninstalling, so you can rejoin.

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

The list of groups you joined is stored on your phone (using native app storage). The group data itself lives in Firestore.

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
| Build and release | GitHub Actions (Node 20, Java 17, Gradle) |

---

## Project Structure

```
split-spend-app/
├── .github/workflows/
│   └── build-apk.yml        # Builds the APK; attaches it to a release
├── www/
│   ├── index.html           # The whole app (UI + logic)
│   └── firebase-config.js   # Your Firebase project settings
├── capacitor.config.json    # App id and name
├── debug.keystore           # Shared signing key so updates install over old versions
├── firestore.rules          # Security rules to publish in Firebase
├── package.json             # Capacitor and Firebase dependencies
└── README.md
```

The Firebase SDK files are copied into `www/lib/` automatically during the build, so they are not stored in the repository.

---

## Setup Guide

Use this section to run the app with **your own** Firebase project. You need a free Google account (for Firebase) and a free GitHub account (to build the APK). No Android Studio is required.

### 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Create a project**. Analytics is not needed.
2. **Enable anonymous sign-in:** open **Security → Authentication → Sign-in method → Anonymous**, switch **Enable** on and **Save**.
3. **Create the database:** open **Databases & Storage → Firestore → Create database**. Choose **Standard edition**, pick a location near your users, and select **Production mode**.
4. **Publish the rules:** open the Firestore **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules), and click **Publish**.
5. **Register a web app:** open **Project settings → General → Your apps**, click the web icon `</>`, register the app (skip Hosting), and copy the `firebaseConfig` values.

> Menu names change between Firebase console versions. Use the search box in the console if you cannot find an item.

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

1. Push all files to a GitHub repository, including the hidden `.github` folder and `debug.keystore`.
2. Open the **Actions** tab. The **Build APK** workflow starts on every push (about 3 to 5 minutes).
3. When it shows a green tick, open the newest run and download the **split-spend-apk** artifact at the bottom of the page.
4. Unzip it. Inside is `split-spend.apk`. Install it as described in [Download and Install](#download-and-install).

---

## Publishing a Release

1. Merge your changes into `main`.
2. On the repository page, open **Releases → Create a new release**.
3. Choose a new tag such as `v1.0.1` (target `main`), add a title and notes, and click **Publish release**.
4. The workflow builds the app and attaches **split-spend.apk** to the release after about 5 minutes.

The build number increases with every build, so each release installs over the previous one. The version name comes from the tag.

---

## Using the App

1. **One person** taps **Create group**, enters a group name and their own name, and receives the group code.
2. Tap **Share code** and send it to the others.
3. **Everyone else** taps **Join with group code**, enters the code, and picks their name (or joins as a new person).
4. Use the tabs inside a group:
   - **Summary:** total spend, equal share, each person's balance, settlement list, add or remove people, copy backup.
   - **Bills:** add a bill (who paid, amount, note), edit it, or cancel it with a reason.
   - **Activity:** the permanent log of every action.
5. Tap **Groups** to return to the list of your groups, or **Refresh** to load the latest data.

**Removing a person:** tap **Remove** on the Summary tab and give a reason. A person who has active bills cannot be removed until those bills are cancelled, so totals never change silently. Removed people can be added back.

**Removing a group from your phone:** tap **Remove** next to the group on the My groups screen. The data stays online, and you can rejoin with the group code.

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

Tap **Copy full backup** regularly and keep the text somewhere safe (Notes, a chat with yourself, a cloud drive). Also keep your **group codes** safe, because they are needed to rejoin on a new phone.

---

## Security Notes

- The values in `firebase-config.js` identify your Firebase project and are **not secrets**. Access is controlled by the Firestore rules, not by hiding this file.
- Anyone who has the **group code** can join and see the group. Share it only with people you trust. Codes are random and 10 characters long, and groups cannot be listed or searched.
- Names are chosen by users and are not verified. The log also stores each device's anonymous user id for reference, but the app has no phone-number or email verification.
- The rules in `firestore.rules` require sign-in for every read and write. For stricter control (for example, only group members can read), the app would need real accounts.
- **Shared database:** everyone who installs the released APK uses the same Firebase project. Groups stay private behind their codes, but strangers could create groups in that project. If you share the app widely, others should build it with their own Firebase project (see [Setup Guide](#setup-guide)).
- `debug.keystore` is a standard debug key committed to the repository. It makes updates install over old versions but is **not** suitable for the Play Store.

---

## Known Limitations

- **Notifications work only while the app is running.** They appear on screen while the app is open, and Android may show them in the notification bar while the app is still in the background. When the app is fully closed, nothing arrives until you open it, and then all changes are visible immediately. Alerts for a closed app need Firebase Cloud Messaging with Cloud Functions, which require a paid Firebase plan and are not included.
- **Debug build.** The APK is a debug build. It is fine for personal distribution but cannot be published on Google Play. A signed release build is needed for that.
- **Equal split only.** Every active member pays the same share. Unequal shares and per-bill participants are not supported yet.
- **Single currency (₹).**
- **No export to PDF or spreadsheet.** The backup is plain JSON text.
- **Group list is stored per phone.** On a new phone, rejoin each group with its code.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| App shows **"Setup needed"** | In `www/firebase-config.js`, make sure line 1 is `window.FB_CFG = {` and no value says `PASTE_HERE` |
| **"Could not sign in"** | Check the internet connection and that **Anonymous** sign-in is enabled in Firebase Authentication |
| **"Group not found"** | Re-check the code (it is not case-sensitive, but must be complete) |
| Permission or "Failed" errors when saving | Make sure the rules from `firestore.rules` are **published** in the Firestore Rules tab |
| **"App not installed"** | The installed app was signed with a different key. Uninstall it once, then install the new APK. Later updates install over it |
| Phone still shows an old screen | Download the APK from the **newest** green run or the latest release |
| Nothing appears on other phones | Everyone must join the **same** group code. Only one person should tap **Create group**. Tap **Refresh** to reload |
| A group is missing from My groups | The list is per phone. Tap **Join with group code** and enter the code again |
| The APK is missing inside the download | GitHub wraps workflow artifacts in a ZIP. Unzip it to find `split-spend.apk` |

---

## Roadmap

- [ ] Push notifications when the app is closed (Firebase Cloud Messaging)
- [ ] Unequal splits and per-bill participants
- [ ] Real accounts with member-only access control
- [ ] Multiple currencies
- [ ] Export to PDF and CSV
- [ ] Signed release build for Google Play

---

## Author

Built by **Shubham Jadhav** ([@jadhavS04](https://github.com/jadhavS04)).

Contributions and suggestions are welcome. Open an issue to report a bug or propose a feature.
