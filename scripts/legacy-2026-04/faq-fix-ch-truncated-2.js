// Correction des 7 réponses chinoises trop courtes (orders 17, 42, 43, 44, 48, 51, 60)
// Ajout des paragraphes d'intro et conclusion manquants
// Lance avec: node faq-fix-ch-truncated-2.js

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

  // ORDER 17 — Assurance santé : ajout intro contexte + conclusion disclaimer
  17: {
    "answer.ch": "是的，海外健康和医疗保险问题是 SOS-Expat 华人助理服务商经常处理的咨询主题。这些服务提供商在相关国家生活或曾经居住过，可以为您提供当地医疗体系的具体指导。\n<ul>\n<li><strong>选择外籍人员医疗保险</strong>：根据所在国家确定必要的保障范围</li>\n<li><strong>了解当地医疗体系</strong>：社会保障体系、报销制度、签约医生</li>\n<li><strong>寻找能用您语言沟通的医生或医院</strong>：多个城市的推荐联系方式</li>\n<li><strong>事故或紧急住院</strong>：如何获得治疗、如何与医院沟通、语言障碍处理</li>\n<li><strong>医疗回国</strong>：当健康状况需要返回原籍国时应遵循的步骤</li>\n</ul>\nSOS-Expat 不是医疗服务，不能替代医生的诊断和治疗。但在保险选择、就医指导和行政手续方面，我们的专家可以为您节省大量宝贵时间。"
  },

  // ORDER 42 — Litige propriétaire : ajout intro droit local + conclusion démarches
  42: {
    "answer.ch": "是的，海外租赁纠纷是 SOS-Expat 的典型使用案例。房地产法规因国而异：押金、通知期限、房屋检查、驱逐——每个国家都有自己的法律和程序。5分钟内即可为您联系了解您所在国法律的本地服务提供商。SOS-Expat 可帮助处理：\n<ul>\n<li><strong>拒绝退还押金</strong></li>\n<li><strong>不合理的租金上涨</strong></li>\n<li><strong>无正当理由的驱逐或驱逐程序</strong></li>\n<li><strong>不合格或未维护的住房</strong></li>\n<li><strong>提前终止租约及罚款</strong></li>\n<li><strong>与房产中介的纠纷</strong></li>\n</ul>\n本地服务提供商会根据当地法律解释您的权利，并指导您采取适当步骤（正式催告函、诉诸当地法院、调解）。"
  },

  // ORDER 43 — Problème employeur : ajout intro complexité + conclusion tarifs
  43: {
    "answer.ch": "是的，海外劳动法纠纷是外籍人士面临的最复杂情况之一——而 SOS-Expat 正是为解决此类问题而设计。劳动法因国而异，本地服务提供商了解实际适用的法规。SOS-Expat 可帮助处理：\n<ul>\n<li><strong>不当解雇或未按法定通知期解雇</strong></li>\n<li><strong>工资或加班费未支付</strong></li>\n<li><strong>违反劳动合同</strong></li>\n<li><strong>职场骚扰或歧视</strong></li>\n<li><strong>工伤事故及赔偿权利</strong></li>\n<li><strong>非法劳动条件</strong></li>\n<li><strong>合同终止及遣散费计算</strong></li>\n</ul>\n通话时长：律师20分钟（49€）或华人助理30分钟（19€）。复杂情况可能需要多次通话。"
  },

  // ORDER 44 — Succession internationale : ajout intro contexte + conclusion tarif
  44: {
    "answer.ch": "是的，国际遗产继承是特别复杂的情况，本地专家必不可少。当亲属在国外去世或在多个国家拥有财产时，适用的法律规则（哪国法律？哪些税收？）往往令人困惑。SOS-Expat 在相关国家的服务提供商可以为您解释：\n<ul>\n<li><strong>哪国法律适用于遗产</strong>（居住国法律、国籍国法律还是财产所在地法律）</li>\n<li><strong>开立遗产案的当地程序</strong></li>\n<li><strong>该国适用的遗产税</strong></li>\n<li><strong>外国遗嘱在相关国家的有效性</strong></li>\n<li><strong>资产或资金回返程序</strong></li>\n</ul>\n首次电话咨询（律师49€/20分钟）可帮助您在启动更长期的法律程序之前快速了解关键问题。"
  },

  // ORDER 48 — Retraite/protection sociale : ajout intro contexte + conclusion
  48: {
    "answer.ch": "是的，养老金和社会保障问题是 SOS-Expat 上的常见咨询，尤其是对于曾在多个国家工作过的人士。本地服务提供商可就以下方面提供信息：\n<ul>\n<li><strong>居住国社会保障体系</strong>（医疗保险、养老金、失业保险）</li>\n<li><strong>原籍国与居住国之间的双边社会保障协议</strong></li>\n<li><strong>养老金计算的保险期合并</strong></li>\n<li><strong>从外国领取养老金的程序</strong></li>\n<li><strong>海外人士的强制或自愿医疗保障</strong></li>\n</ul>\n各国规则和现行双边协议差异巨大——本地专家是为您的具体情况提供准确信息的最佳来源。"
  },

  // ORDER 51 — Nomades numériques : ajout intro 197 pays + conclusion paiement
  51: {
    "answer.ch": "是的，SOS-Expat 特别适合数字游牧族。每个国家在签证、税务、住房和劳动法方面都有各自的规定，这些规定还会因居留时间而变化。5分钟内即可联系平台覆盖的197个国家中任意一国的本地专家。SOS-Expat 可帮助处理：\n<ul>\n<li><strong>各国旅游签证与数字游牧签证规则</strong></li>\n<li><strong>何时成为某国税务居民</strong></li>\n<li><strong>无固定住所人员的税务居所问题</strong></li>\n<li><strong>与共享办公空间或短期房东的纠纷</strong></li>\n<li><strong>数字游牧族的国际医疗保险</strong></li>\n</ul>\n无需订阅，按次付费：非常适合随行程需要进行临时咨询。"
  },

  // ORDER 60 — Afrique subsaharienne : ajout intro pays + conclusion langues
  60: {
    "answer.ch": "是的，SOS-Expat 覆盖整个撒哈拉以南非洲地区，包括塞内加尔、科特迪瓦、加纳、喀麦隆、加蓬、刚果、刚果民主共和国、肯尼亚、坦桑尼亚、埃塞俄比亚、卢旺达、南非和尼日利亚。该地区的外籍人士社区正在快速增长。本地服务提供商可帮助处理：\n<ul>\n<li><strong>各国居留和工作签证</strong></li>\n<li><strong>公司注册和当地商法</strong></li>\n<li><strong>外国人房产和土地收购</strong></li>\n<li><strong>劳动法和外籍员工合同</strong></li>\n<li><strong>与当地政府的纠纷</strong></li>\n<li><strong>投资的法律安全</strong></li>\n</ul>\n平台支持法语（撒哈拉以南非洲许多国家的官方语言）、英语和阿拉伯语。"
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
    const oldLen = snap.docs[0].data().answer?.ch?.length || 0;
    await docRef.update(updates);
    const newLen = Object.values(updates)[0].length;
    console.log(`✅ Order ${order} — answer.ch: ${oldLen} → ${newLen} chars (+${newLen - oldLen})`);
  }
  console.log("\n🎉 7 corrections CH appliquées !");
  process.exit(0);
}

applyCorrections().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
