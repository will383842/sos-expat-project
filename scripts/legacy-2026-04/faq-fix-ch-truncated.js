// Correction des 3 réponses chinoises tronquées (orders 33, 36, 63)
// Lance avec: node faq-fix-ch-truncated.js

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  (process.env.APPDATA || require("os").homedir() + "/AppData/Roaming") +
  "/firebase/williamsjullin_gmail_com_application_default_credentials.json";

const admin = require("./sos/firebase/functions/node_modules/firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sos-urgently-ac307",
});
const db = admin.firestore();

const corrections = {

  // ORDER 33 — SOS Holidays voyages d'affaires : ajouter liste <ul> manquante
  33: {
    "answer.ch": "是的，SOS Holidays 特别适合商务出行。在专业出差期间，意外情况可能影响您的任务：与当地合作伙伴的合同纠纷、海关问题、东道国劳动法问题，或简单的行政紧急事务。SOS Holidays 可在5分钟内将您与了解当地法律的本地专家连接。\n<ul>\n<li><strong>与当地合作伙伴的商业或合同纠纷</strong></li>\n<li><strong>海关或进出口问题</strong></li>\n<li><strong>长期派遣中的当地劳动法问题</strong></li>\n<li><strong>行政紧急事务</strong>（签证、专业文件）</li>\n<li><strong>事故或住院时的指导</strong></li>\n</ul>\n按次付费（49€/20分钟或19€/30分钟），无需订阅——非常适合出行频率不高的商务旅客。"
  },

  // ORDER 36 — Recontacter même prestataire : ajouter détails complets
  36: {
    "answer.ch": "是的，SOS-Expat 允许您查找并直接联系您之前合作过的服务提供商。每位提供商都有包含客户评价、专业领域和实时可用状态的个人资料页面。如果该提供商在您想要拨打电话时在线，您可以直接从其个人资料页面联系他们。如果他们正忙或离线，您可以浏览同一专业领域和国家的其他可用提供商。\n\n此功能在处理需要多次交流的复杂情况时特别有用——提供商已了解您的情况，您无需重新解释所有内容。每次通话单独计费（49€/20分钟或19€/30分钟），无需订阅。"
  },

  // ORDER 63 — Mise à jour téléphone/email : ajouter liste <ul> manquante
  63: {
    "answer.ch": "您可以直接从 SOS-Expat 仪表板更新联系信息。登录您的账户，进入「个人资料」或「设置」选项卡，修改您的电话号码或电子邮件地址。将发送验证码以确认更改并保护您的账户。如果您经常更换国家，保持电话号码更新非常重要，因为：\n<ul>\n<li><strong>服务提供商通过此号码在配对时联系您</strong></li>\n<li><strong>用于接收与通话相关的通知</strong></li>\n<li><strong>有助于账户安全</strong>（身份验证）</li>\n</ul>\n如果您在修改联系信息时遇到问题，请通过平台上的联系表单与 SOS-Expat 支持团队联系。"
  }
};

async function applyCorrections() {
  for (const [order, updates] of Object.entries(corrections)) {
    const snap = await db.collection("app_faq").where("order", "==", Number(order)).get();
    if (snap.empty) {
      console.log(`⚠️  Order ${order} non trouvé`);
      continue;
    }
    const docRef = snap.docs[0].ref;
    await docRef.update(updates);
    const newLen = Object.values(updates)[0].length;
    console.log(`✅ Order ${order} — answer.ch mis à jour (${newLen} chars)`);
  }
  console.log("\n🎉 3 corrections CH appliquées !");
  process.exit(0);
}

applyCorrections().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
