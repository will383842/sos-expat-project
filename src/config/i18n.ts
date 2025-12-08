// src/config/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      "availability": {
        "reminderMessage": "N'oubliez pas que vous êtes en ligne !",
        "reminder": {
          "title": "Rappel de disponibilité",
          "message": "Vous êtes toujours en ligne. Souhaitez-vous rester disponible ?",
          "actions": {
            "stayOnline": "Rester en ligne",
            "goOffline": "Passer hors ligne",
            "disableToday": "Ne plus me le rappeler aujourd'hui"
          }
        },
        "status": {
          "online": "En ligne",
          "offline": "Hors ligne"
        },
        "actions": {
          "goOnline": "Se mettre en ligne",
          "goOffline": "Se mettre hors ligne"
        },
        "errors": {
          "notApproved": "Votre profil n'est pas encore validé par l'administration.",
          "updateFailed": "Échec de la mise à jour du statut.",
          "syncFailed": "Échec de synchronisation avec Firestore."
        }
      },
      "common": {
        "refresh": "Rafraîchir"
      },
      "profileValidation": {
        "pending": {
          "title": "Profil en cours de validation",
          "description": "Votre profil est actuellement en cours d'examen par notre équipe. Cette étape est nécessaire pour garantir la qualité de notre plateforme et la sécurité de nos utilisateurs.",
          "whatHappensNow": "📋 Que se passe-t-il maintenant ?",
          "steps": {
            "teamVerifies": "Notre équipe vérifie les informations de votre profil",
            "emailNotification": "Vous recevrez un email dès que votre profil sera approuvé",
            "profileVisible": "Une fois approuvé, votre profil sera visible par tous les clients"
          },
          "validationTime": "Temps de validation habituel :"
        },
        "rejected": {
          "title": "Profil non validé",
          "description": "Malheureusement, votre profil n'a pas pu être approuvé pour le moment.",
          "rejectionReason": "📝 Raison du rejet :",
          "contactSupport": "Contacter le support",
          "editProfile": "Modifier mon profil"
        }
      },
      "kyc": {
        "verified": {
          "title": "Compte vérifié !",
          "description": "Vous pouvez maintenant recevoir des paiements de la part des clients."
        }
      }
    }
  },
  en: {
    translation: {
      "availability": {
        "reminderMessage": "Don't forget you're online!",
        "reminder": {
          "title": "Availability Reminder",
          "message": "You're still online. Would you like to stay available?",
          "actions": {
            "stayOnline": "Stay Online",
            "goOffline": "Go Offline",
            "disableToday": "Don't remind me today"
          }
        },
        "status": {
          "online": "Online",
          "offline": "Offline"
        },
        "actions": {
          "goOnline": "Go Online",
          "goOffline": "Go Offline"
        },
        "errors": {
          "notApproved": "Your profile has not yet been approved by the administration.",
          "updateFailed": "Failed to update status.",
          "syncFailed": "Failed to sync with Firestore."
        }
      },
      "common": {
        "refresh": "Refresh"
      },
      "profileValidation": {
        "pending": {
          "title": "Profile Under Review",
          "description": "Your profile is currently being reviewed by our team. This step is necessary to ensure the quality of our platform and the security of our users.",
          "whatHappensNow": "📋 What happens now?",
          "steps": {
            "teamVerifies": "Our team verifies your profile information",
            "emailNotification": "You will receive an email as soon as your profile is approved",
            "profileVisible": "Once approved, your profile will be visible to all clients"
          },
          "validationTime": "Usual validation time:"
        },
        "rejected": {
          "title": "Profile Not Validated",
          "description": "Unfortunately, your profile could not be approved at this time.",
          "rejectionReason": "📝 Rejection reason:",
          "contactSupport": "Contact Support",
          "editProfile": "Edit My Profile"
        }
      },
      "kyc": {
        "verified": {
          "title": "Account Verified!",
          "description": "You can now receive payments from clients."
        }
      }
    }
  },
  es: {
    translation: {
      "availability": {
        "reminderMessage": "¡No olvides que estás en línea!",
        "reminder": {
          "title": "Recordatorio de disponibilidad",
          "message": "Sigues en línea. ¿Deseas permanecer disponible?",
          "actions": {
            "stayOnline": "Permanecer en línea",
            "goOffline": "Pasar a desconectado",
            "disableToday": "No recordarme hoy"
          }
        },
        "status": {
          "online": "En línea",
          "offline": "Desconectado"
        },
        "actions": {
          "goOnline": "Ponerse en línea",
          "goOffline": "Pasar a desconectado"
        },
        "errors": {
          "notApproved": "Su perfil aún no ha sido aprobado por la administración.",
          "updateFailed": "Error al actualizar el estado.",
          "syncFailed": "Error de sincronización con Firestore."
        }
      },
      "common": {
        "refresh": "Actualizar"
      },
      "profileValidation": {
        "pending": {
          "title": "Perfil en proceso de validación",
          "description": "Su perfil está siendo revisado por nuestro equipo. Este paso es necesario para garantizar la calidad de nuestra plataforma y la seguridad de nuestros usuarios.",
          "whatHappensNow": "📋 ¿Qué sucede ahora?",
          "steps": {
            "teamVerifies": "Nuestro equipo verifica la información de su perfil",
            "emailNotification": "Recibirá un correo electrónico tan pronto como su perfil sea aprobado",
            "profileVisible": "Una vez aprobado, su perfil será visible para todos los clientes"
          },
          "validationTime": "Tiempo de validación habitual:"
        },
        "rejected": {
          "title": "Perfil no validado",
          "description": "Desafortunadamente, su perfil no pudo ser aprobado en este momento.",
          "rejectionReason": "📝 Razón del rechazo:",
          "contactSupport": "Contactar soporte",
          "editProfile": "Editar mi perfil"
        }
      },
      "kyc": {
        "verified": {
          "title": "¡Cuenta verificada!",
          "description": "Ahora puede recibir pagos de los clientes."
        }
      }
    }
  },
  ru: {
    translation: {
      "availability": {
        "reminderMessage": "Не забудьте, что вы в сети!",
        "reminder": {
          "title": "Напоминание о доступности",
          "message": "Вы все еще в сети. Хотите остаться доступным?",
          "actions": {
            "stayOnline": "Остаться в сети",
            "goOffline": "Перейти в офлайн",
            "disableToday": "Не напоминать мне сегодня"
          }
        },
        "status": {
          "online": "В сети",
          "offline": "Не в сети"
        },
        "actions": {
          "goOnline": "Войти в сеть",
          "goOffline": "Выйти из сети"
        },
        "errors": {
          "notApproved": "Ваш профиль еще не одобрен администрацией.",
          "updateFailed": "Не удалось обновить статус.",
          "syncFailed": "Ошибка синхронизации с Firestore."
        }
      },
      "common": {
        "refresh": "Обновить"
      },
      "profileValidation": {
        "pending": {
          "title": "Профиль на проверке",
          "description": "Ваш профиль в настоящее время проверяется нашей командой. Этот шаг необходим для обеспечения качества нашей платформы и безопасности наших пользователей.",
          "whatHappensNow": "📋 Что происходит сейчас?",
          "steps": {
            "teamVerifies": "Наша команда проверяет информацию вашего профиля",
            "emailNotification": "Вы получите электронное письмо, как только ваш профиль будет одобрен",
            "profileVisible": "После одобрения ваш профиль будет виден всем клиентам"
          },
          "validationTime": "Обычное время проверки:"
        },
        "rejected": {
          "title": "Профиль не подтвержден",
          "description": "К сожалению, ваш профиль не может быть одобрен в данный момент.",
          "rejectionReason": "📝 Причина отклонения:",
          "contactSupport": "Связаться с поддержкой",
          "editProfile": "Редактировать мой профиль"
        }
      },
      "kyc": {
        "verified": {
          "title": "Аккаунт подтвержден!",
          "description": "Теперь вы можете получать платежи от клиентов."
        }
      }
    }
  },
  de: {
    translation: {
      "availability": {
        "reminderMessage": "Vergessen Sie nicht, dass Sie online sind!",
        "reminder": {
          "title": "Verfügbarkeitserinnerung",
          "message": "Sie sind noch online. Möchten Sie verfügbar bleiben?",
          "actions": {
            "stayOnline": "Online bleiben",
            "goOffline": "Offline gehen",
            "disableToday": "Heute nicht mehr erinnern"
          }
        },
        "status": {
          "online": "Online",
          "offline": "Offline"
        },
        "actions": {
          "goOnline": "Online gehen",
          "goOffline": "Offline gehen"
        },
        "errors": {
          "notApproved": "Ihr Profil wurde noch nicht von der Verwaltung genehmigt.",
          "updateFailed": "Status konnte nicht aktualisiert werden.",
          "syncFailed": "Fehler bei der Synchronisation mit Firestore."
        }
      },
      "common": {
        "refresh": "Aktualisieren"
      },
      "profileValidation": {
        "pending": {
          "title": "Profil wird überprüft",
          "description": "Ihr Profil wird derzeit von unserem Team überprüft. Dieser Schritt ist notwendig, um die Qualität unserer Plattform und die Sicherheit unserer Benutzer zu gewährleisten.",
          "whatHappensNow": "📋 Was passiert jetzt?",
          "steps": {
            "teamVerifies": "Unser Team überprüft Ihre Profilinformationen",
            "emailNotification": "Sie erhalten eine E-Mail, sobald Ihr Profil genehmigt wurde",
            "profileVisible": "Nach der Genehmigung ist Ihr Profil für alle Kunden sichtbar"
          },
          "validationTime": "Übliche Validierungszeit:"
        },
        "rejected": {
          "title": "Profil nicht validiert",
          "description": "Leider konnte Ihr Profil derzeit nicht genehmigt werden.",
          "rejectionReason": "📝 Ablehnungsgrund:",
          "contactSupport": "Support kontaktieren",
          "editProfile": "Mein Profil bearbeiten"
        }
      },
      "kyc": {
        "verified": {
          "title": "Konto verifiziert!",
          "description": "Sie können jetzt Zahlungen von Kunden erhalten."
        }
      }
    }
  },
  hi: {
    translation: {
      "availability": {
        "reminderMessage": "मत भूलें कि आप ऑनलाइन हैं!",
        "reminder": {
          "title": "उपलब्धता अनुस्मारक",
          "message": "आप अभी भी ऑनलाइन हैं। क्या आप उपलब्ध रहना चाहेंगे?",
          "actions": {
            "stayOnline": "ऑनलाइन रहें",
            "goOffline": "ऑफ़लाइन जाएं",
            "disableToday": "आज मुझे याद न दिलाएं"
          }
        },
        "status": {
          "online": "ऑनलाइन",
          "offline": "ऑफ़लाइन"
        },
        "actions": {
          "goOnline": "ऑनलाइन जाएं",
          "goOffline": "ऑफ़लाइन जाएं"
        },
        "errors": {
          "notApproved": "आपकी प्रोफ़ाइल अभी तक प्रशासन द्वारा अनुमोदित नहीं की गई है।",
          "updateFailed": "स्थिति अपडेट करने में विफल।",
          "syncFailed": "Firestore के साथ सिंक करने में विफल।"
        }
      },
      "common": {
        "refresh": "ताज़ा करें"
      },
      "profileValidation": {
        "pending": {
          "title": "प्रोफ़ाइल सत्यापनाधीन है",
          "description": "आपकी प्रोफ़ाइल वर्तमान में हमारी टीम द्वारा जांची जा रही है। यह कदम हमारे प्लेटफ़ॉर्म की गुणवत्ता और हमारे उपयोगकर्ताओं की सुरक्षा सुनिश्चित करने के लिए आवश्यक है।",
          "whatHappensNow": "📋 अब क्या होगा?",
          "steps": {
            "teamVerifies": "हमारी टीम आपकी प्रोफ़ाइल की जानकारी सत्यापित करती है",
            "emailNotification": "आपकी प्रोफ़ाइल स्वीकृत होते ही आपको एक ईमेल प्राप्त होगा",
            "profileVisible": "एक बार स्वीकृत होने के बाद, आपकी प्रोफ़ाइल सभी ग्राहकों को दिखाई देगी"
          },
          "validationTime": "सामान्य सत्यापन समय:"
        },
        "rejected": {
          "title": "प्रोफ़ाइल सत्यापित नहीं",
          "description": "दुर्भाग्य से, आपकी प्रोफ़ाइल इस समय स्वीकृत नहीं की जा सकी।",
          "rejectionReason": "📝 अस्वीकृति का कारण:",
          "contactSupport": "सहायता से संपर्क करें",
          "editProfile": "मेरी प्रोफ़ाइल संपादित करें"
        }
      },
      "kyc": {
        "verified": {
          "title": "खाता सत्यापित!",
          "description": "अब आप ग्राहकों से भुगतान प्राप्त कर सकते हैं।"
        }
      }
    }
  },
  pt: {
    translation: {
      "availability": {
        "reminderMessage": "Não se esqueça de que você está online!",
        "reminder": {
          "title": "Lembrete de disponibilidade",
          "message": "Você ainda está online. Gostaria de permanecer disponível?",
          "actions": {
            "stayOnline": "Permanecer online",
            "goOffline": "Ficar offline",
            "disableToday": "Não me lembrar hoje"
          }
        },
        "status": {
          "online": "Online",
          "offline": "Offline"
        },
        "actions": {
          "goOnline": "Ficar online",
          "goOffline": "Ficar offline"
        },
        "errors": {
          "notApproved": "Seu perfil ainda não foi aprovado pela administração.",
          "updateFailed": "Falha ao atualizar o status.",
          "syncFailed": "Falha na sincronização com Firestore."
        }
      },
      "common": {
        "refresh": "Atualizar"
      },
      "profileValidation": {
        "pending": {
          "title": "Perfil em validação",
          "description": "Seu perfil está sendo revisado por nossa equipe. Esta etapa é necessária para garantir a qualidade de nossa plataforma e a segurança de nossos usuários.",
          "whatHappensNow": "📋 O que acontece agora?",
          "steps": {
            "teamVerifies": "Nossa equipe verifica as informações do seu perfil",
            "emailNotification": "Você receberá um e-mail assim que seu perfil for aprovado",
            "profileVisible": "Uma vez aprovado, seu perfil será visível para todos os clientes"
          },
          "validationTime": "Tempo de validação usual:"
        },
        "rejected": {
          "title": "Perfil não validado",
          "description": "Infelizmente, seu perfil não pôde ser aprovado no momento.",
          "rejectionReason": "📝 Motivo da rejeição:",
          "contactSupport": "Contatar suporte",
          "editProfile": "Editar meu perfil"
        }
      },
      "kyc": {
        "verified": {
          "title": "Conta verificada!",
          "description": "Agora você pode receber pagamentos de clientes."
        }
      }
    }
  },
  ch: {
    translation: {
      "availability": {
        "reminderMessage": "不要忘记您在线！",
        "reminder": {
          "title": "可用性提醒",
          "message": "您仍然在线。您想保持可用吗？",
          "actions": {
            "stayOnline": "保持在线",
            "goOffline": "切换离线",
            "disableToday": "今天不再提醒我"
          }
        },
        "status": {
          "online": "在线",
          "offline": "离线"
        },
        "actions": {
          "goOnline": "上线",
          "goOffline": "离线"
        },
        "errors": {
          "notApproved": "您的个人资料尚未获得管理部门的批准。",
          "updateFailed": "更新状态失败。",
          "syncFailed": "与 Firestore 同步失败。"
        }
      },
      "common": {
        "refresh": "刷新"
      },
      "profileValidation": {
        "pending": {
          "title": "个人资料审核中",
          "description": "您的个人资料目前正在由我们的团队审核。此步骤对于确保我们平台的质量和用户的安全是必要的。",
          "whatHappensNow": "📋 现在会发生什么？",
          "steps": {
            "teamVerifies": "我们的团队正在验证您的个人资料信息",
            "emailNotification": "一旦您的个人资料获得批准，您将收到一封电子邮件",
            "profileVisible": "一旦获得批准，您的个人资料将对所有客户可见"
          },
          "validationTime": "通常验证时间："
        },
        "rejected": {
          "title": "个人资料未通过验证",
          "description": "很抱歉，您的个人资料目前无法获得批准。",
          "rejectionReason": "📝 拒绝原因：",
          "contactSupport": "联系支持",
          "editProfile": "编辑我的个人资料"
        }
      },
      "kyc": {
        "verified": {
          "title": "账户已验证！",
          "description": "您现在可以接收客户的付款。"
        }
      }
    }
  },
  ar: {
    translation: {
      "availability": {
        "reminderMessage": "لا تنس أنك متصل!",
        "reminder": {
          "title": "تذكير التوفر",
          "message": "ما زلت متصلاً. هل تريد البقاء متاحاً؟",
          "actions": {
            "stayOnline": "البقاء متصلاً",
            "goOffline": "الانتقال إلى وضع عدم الاتصال",
            "disableToday": "لا تذكرني اليوم"
          }
        },
        "status": {
          "online": "متصل",
          "offline": "غير متصل"
        },
        "actions": {
          "goOnline": "الاتصال",
          "goOffline": "قطع الاتصال"
        },
        "errors": {
          "notApproved": "لم تتم الموافقة على ملفك الشخصي بعد من قبل الإدارة.",
          "updateFailed": "فشل تحديث الحالة.",
          "syncFailed": "فشل المزامنة مع Firestore."
        }
      },
      "common": {
        "refresh": "تحديث"
      },
      "profileValidation": {
        "pending": {
          "title": "الملف الشخصي قيد المراجعة",
          "description": "ملفك الشخصي قيد المراجعة حاليًا من قبل فريقنا. هذه الخطوة ضرورية لضمان جودة منصتنا وأمان مستخدمينا.",
          "whatHappensNow": "📋 ماذا يحدث الآن؟",
          "steps": {
            "teamVerifies": "فريقنا يتحقق من معلومات ملفك الشخصي",
            "emailNotification": "ستتلقى بريدًا إلكترونيًا بمجرد الموافقة على ملفك الشخصي",
            "profileVisible": "بمجرد الموافقة عليه، سيكون ملفك الشخصي مرئيًا لجميع العملاء"
          },
          "validationTime": "وقت التحقق المعتاد:"
        },
        "rejected": {
          "title": "الملف الشخصي غير معتمد",
          "description": "للأسف، لم يتم اعتماد ملفك الشخصي في هذا الوقت.",
          "rejectionReason": "📝 سبب الرفض:",
          "contactSupport": "اتصل بالدعم",
          "editProfile": "تعديل ملفي الشخصي"
        }
      },
      "kyc": {
        "verified": {
          "title": "تم التحقق من الحساب!",
          "description": "يمكنك الآن تلقي المدفوعات من العملاء."
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
