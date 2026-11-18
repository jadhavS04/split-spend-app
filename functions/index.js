const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

// Sends a phone notification to every other member whenever a log entry is created.
exports.notifyGroup = onDocumentCreated(
  { document: "groups/{g}/log/{l}", region: "asia-south1" },
  async (event) => {
    const d = event.data.data();
    const g = event.params.g;
    const db = admin.firestore();
    const [members, group] = await Promise.all([
      db.collection("groups/" + g + "/members").get(),
      db.doc("groups/" + g).get(),
    ]);
    const tokens = [];
    members.forEach((m) => {
      const x = m.data();
      if (m.id !== d.by && !x.removed && x.fcmToken) tokens.push(x.fcmToken);
    });
    if (!tokens.length) return;
    await admin.messaging().sendEachForMulticast({
      tokens: [...new Set(tokens)],
      notification: { title: (group.data() || {}).name || "Split Spend", body: d.text },
      android: { priority: "high" },
    });
  }
);
