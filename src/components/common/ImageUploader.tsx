import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Image as ImageIcon, Check, AlertCircle, Upload, Camera, FileImage } from 'lucide-react';
import ImageCropModal from './ImageCropModal';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  StorageReference
} from 'firebase/storage';

type Locale = 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'pt' | 'ch' | 'ar';

/** ====== I18N types ====== */
type I18nUI = {
  dropHere: string;
  clickOrDrag: string;
  formatInfo: (maxSizeMB: number) => string;
  uploading: (p: number) => string;
  uploadSuccess: string;
  replaceImage: string;
  removeImage: string;
  profileImage: string;
  converting: string;
  takePhoto: string;
  chooseFromGallery: string;
  webcamInfo: string;
  chooseImage: string;
  cancel: string;
};
type I18nErrors = {
  unsupportedFormat: string;
  fileTooLarge: (sizeMB: number, maxSizeMB: number) => string;
  uploadFailed: (error: string) => string;
  previewFailed: string;
  deleteFailed: string;
  imageLoadError: string;
  cameraNotSupported: string;
  cameraAccessFailed: string;
};
type I18n = { errors: I18nErrors; ui: I18nUI };

/** ====== I18N data ====== */
// const I18N: Record<Locale, I18n> = {
//   fr: {
//     errors: {
//       unsupportedFormat: 'Format non supporté. Formats acceptés: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
//       fileTooLarge: (sizeMB: number, maxSizeMB: number) => `L'image ne doit pas dépasser ${maxSizeMB}MB (actuelle: ${sizeMB.toFixed(1)}MB)`,
//       uploadFailed: (error: string) => `Erreur d'upload: ${error}`,
//       previewFailed: "Erreur lors de la création de l'aperçu",
//       deleteFailed: 'Erreur lors de la suppression',
//       imageLoadError: 'Erreur de chargement',
//       cameraNotSupported: 'Caméra non supportée sur cet appareil',
//       cameraAccessFailed: "Impossible d'accéder à la caméra",
//     },
//     ui: {
//       dropHere: "Déposez l'image ici",
//       clickOrDrag: 'Cliquez ou glissez une image',
//       formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Max ${maxSizeMB}MB`,
//       uploading: (p: number) => `Upload en cours... ${p}%`,
//       uploadSuccess: 'Image uploadée avec succès !',
//       replaceImage: "Remplacer l'image",
//       removeImage: "Supprimer l'image",
//       profileImage: 'Photo de profil',
//       converting: "Conversion de l'image...",
//       takePhoto: 'Prendre une photo',
//       chooseFromGallery: 'Galerie',
//       webcamInfo: 'Ou utilisez la webcam via les boutons de remplacement',
//       chooseImage: 'Choisir une image',
//       cancel: 'Annuler',
//     }
//   },
//   en: {
//     errors: {
//       unsupportedFormat: 'Unsupported format. Accepted: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
//       fileTooLarge: (sizeMB: number, maxSizeMB: number) => `Image must be ≤ ${maxSizeMB}MB (current: ${sizeMB.toFixed(1)}MB)`,
//       uploadFailed: (error: string) => `Upload error: ${error}`,
//       previewFailed: 'Error creating preview',
//       deleteFailed: 'Error deleting image',
//       imageLoadError: 'Image load error',
//       cameraNotSupported: 'Camera not supported on this device',
//       cameraAccessFailed: 'Cannot access the camera',
//     },
//     ui: {
//       dropHere: 'Drop image here',
//       clickOrDrag: 'Click or drag an image',
//       formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Max ${maxSizeMB}MB`,
//       uploading: (p: number) => `Uploading... ${p}%`,
//       uploadSuccess: 'Image uploaded successfully!',
//       replaceImage: 'Replace image',
//       removeImage: 'Remove image',
//       profileImage: 'Profile photo',
//       converting: 'Converting image...',
//       takePhoto: 'Take a photo',
//       chooseFromGallery: 'Gallery',
//       webcamInfo: 'Or use your webcam from the replace buttons',
//       chooseImage: 'Choose an image',
//       cancel: 'Cancel',
//     }
//   }
// };

// ========== Helpers ==========

const I18N: Record<Locale, I18n> = {
  fr: {
    errors: {
      unsupportedFormat: 'Format non supporté. Formats acceptés: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `L'image ne doit pas dépasser ${maxSizeMB}MB (actuelle: ${sizeMB.toFixed(1)}MB)`,
      uploadFailed: (error: string) => `Erreur d'upload: ${error}`,
      previewFailed: "Erreur lors de la création de l'aperçu",
      deleteFailed: 'Erreur lors de la suppression',
      imageLoadError: 'Erreur de chargement',
      cameraNotSupported: 'Caméra non supportée sur cet appareil',
      cameraAccessFailed: "Impossible d'accéder à la caméra",
    },
    ui: {
      dropHere: "Déposez l'image ici",
      clickOrDrag: 'Cliquez ou glissez une image',
      formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Max ${maxSizeMB}MB`,
      uploading: (p: number) => `Upload en cours... ${p}%`,
      uploadSuccess: 'Image uploadée avec succès !',
      replaceImage: "Remplacer l'image",
      removeImage: "Supprimer l'image",
      profileImage: 'Photo de profil',
      converting: "Conversion de l'image...",
      takePhoto: 'Prendre une photo',
      chooseFromGallery: 'Galerie',
      webcamInfo: 'Ou utilisez la webcam via les boutons de remplacement',
      chooseImage: 'Choisir une image',
      cancel: 'Annuler',
    }
  },
  en: {
    errors: {
      unsupportedFormat: 'Unsupported format. Accepted: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `Image must be ≤ ${maxSizeMB}MB (current: ${sizeMB.toFixed(1)}MB)`,
      uploadFailed: (error: string) => `Upload error: ${error}`,
      previewFailed: 'Error creating preview',
      deleteFailed: 'Error deleting image',
      imageLoadError: 'Image load error',
      cameraNotSupported: 'Camera not supported on this device',
      cameraAccessFailed: 'Cannot access the camera',
    },
    ui: {
      dropHere: 'Drop image here',
      clickOrDrag: 'Click or drag an image',
      formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Max ${maxSizeMB}MB`,
      uploading: (p: number) => `Uploading... ${p}%`,
      uploadSuccess: 'Image uploaded successfully!',
      replaceImage: 'Replace image',
      removeImage: 'Remove image',
      profileImage: 'Profile photo',
      converting: 'Converting image...',
      takePhoto: 'Take a photo',
      chooseFromGallery: 'Gallery',
      webcamInfo: 'Or use your webcam from the replace buttons',
      chooseImage: 'Choose an image',
      cancel: 'Cancel',
    }
  },
  es: {
    errors: {
      unsupportedFormat: 'Formato no soportado. Aceptados: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `La imagen debe ser ≤ ${maxSizeMB}MB (actual: ${sizeMB.toFixed(1)}MB)`,
      uploadFailed: (error: string) => `Error de subida: ${error}`,
      previewFailed: 'Error al crear vista previa',
      deleteFailed: 'Error al eliminar imagen',
      imageLoadError: 'Error de carga de imagen',
      cameraNotSupported: 'Cámara no soportada en este dispositivo',
      cameraAccessFailed: 'No se puede acceder a la cámara',
    },
    ui: {
      dropHere: 'Suelta la imagen aquí',
      clickOrDrag: 'Haz clic o arrastra una imagen',
      formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Máx ${maxSizeMB}MB`,
      uploading: (p: number) => `Subiendo... ${p}%`,
      uploadSuccess: '¡Imagen subida con éxito!',
      replaceImage: 'Reemplazar imagen',
      removeImage: 'Eliminar imagen',
      profileImage: 'Foto de perfil',
      converting: 'Convirtiendo imagen...',
      takePhoto: 'Tomar una foto',
      chooseFromGallery: 'Galería',
      webcamInfo: 'O usa tu webcam desde los botones de reemplazo',
      chooseImage: 'Elegir una imagen',
      cancel: 'Cancelar',
    }
  },
  ru: {
    errors: {
      unsupportedFormat: 'Неподдерживаемый формат. Допустимые: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `Изображение должно быть ≤ ${maxSizeMB}МБ (текущее: ${sizeMB.toFixed(1)}МБ)`,
      uploadFailed: (error: string) => `Ошибка загрузки: ${error}`,
      previewFailed: 'Ошибка создания предпросмотра',
      deleteFailed: 'Ошибка удаления изображения',
      imageLoadError: 'Ошибка загрузки изображения',
      cameraNotSupported: 'Камера не поддерживается на этом устройстве',
      cameraAccessFailed: 'Невозможно получить доступ к камере',
    },
    ui: {
      dropHere: 'Перетащите изображение сюда',
      clickOrDrag: 'Нажмите или перетащите изображение',
      formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Макс ${maxSizeMB}МБ`,
      uploading: (p: number) => `Загрузка... ${p}%`,
      uploadSuccess: 'Изображение успешно загружено!',
      replaceImage: 'Заменить изображение',
      removeImage: 'Удалить изображение',
      profileImage: 'Фото профиля',
      converting: 'Конвертация изображения...',
      takePhoto: 'Сделать фото',
      chooseFromGallery: 'Галерея',
      webcamInfo: 'Или используйте веб-камеру через кнопки замены',
      chooseImage: 'Выбрать изображение',
      cancel: 'Отмена',
    }
  },
  de: {
    errors: {
      unsupportedFormat: 'Nicht unterstütztes Format. Akzeptiert: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `Bild muss ≤ ${maxSizeMB}MB sein (aktuell: ${sizeMB.toFixed(1)}MB)`,
      uploadFailed: (error: string) => `Upload-Fehler: ${error}`,
      previewFailed: 'Fehler beim Erstellen der Vorschau',
      deleteFailed: 'Fehler beim Löschen des Bildes',
      imageLoadError: 'Bildladefehler',
      cameraNotSupported: 'Kamera auf diesem Gerät nicht unterstützt',
      cameraAccessFailed: 'Kein Zugriff auf die Kamera möglich',
    },
    ui: {
      dropHere: 'Bild hier ablegen',
      clickOrDrag: 'Klicken oder Bild ziehen',
      formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Max ${maxSizeMB}MB`,
      uploading: (p: number) => `Wird hochgeladen... ${p}%`,
      uploadSuccess: 'Bild erfolgreich hochgeladen!',
      replaceImage: 'Bild ersetzen',
      removeImage: 'Bild entfernen',
      profileImage: 'Profilfoto',
      converting: 'Bild wird konvertiert...',
      takePhoto: 'Foto aufnehmen',
      chooseFromGallery: 'Galerie',
      webcamInfo: 'Oder verwenden Sie Ihre Webcam über die Ersetzungsschaltflächen',
      chooseImage: 'Bild auswählen',
      cancel: 'Abbrechen',
    }
  },
  hi: {
    errors: {
      unsupportedFormat: 'असमर्थित प्रारूप। स्वीकृत: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `छवि ${maxSizeMB}MB से कम होनी चाहिए (वर्तमान: ${sizeMB.toFixed(1)}MB)`,
      uploadFailed: (error: string) => `अपलोड त्रुटि: ${error}`,
      previewFailed: 'पूर्वावलोकन बनाने में त्रुटि',
      deleteFailed: 'छवि हटाने में त्रुटि',
      imageLoadError: 'छवि लोड त्रुटि',
      cameraNotSupported: 'इस डिवाइस पर कैमरा समर्थित नहीं है',
      cameraAccessFailed: 'कैमरे तक पहुंच नहीं हो सकती',
    },
    ui: {
      dropHere: 'छवि यहाँ छोड़ें',
      clickOrDrag: 'क्लिक करें या छवि खींचें',
      formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • अधिकतम ${maxSizeMB}MB`,
      uploading: (p: number) => `अपलोड हो रहा है... ${p}%`,
      uploadSuccess: 'छवि सफलतापूर्वक अपलोड हुई!',
      replaceImage: 'छवि बदलें',
      removeImage: 'छवि हटाएं',
      profileImage: 'प्रोफ़ाइल फ़ोटो',
      converting: 'छवि परिवर्तित हो रही है...',
      takePhoto: 'फ़ोटो लें',
      chooseFromGallery: 'गैलरी',
      webcamInfo: 'या बदलें बटन से अपना वेबकैम उपयोग करें',
      chooseImage: 'छवि चुनें',
      cancel: 'रद्द करें',
    }
  },
  pt: {
  errors: {
    unsupportedFormat: 'Formato não suportado. Aceitos: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
    fileTooLarge: (sizeMB: number, maxSizeMB: number) => `Imagem deve ser menor que ${maxSizeMB}MB (atual: ${sizeMB.toFixed(1)}MB)`,
    uploadFailed: (error: string) => `Erro no upload: ${error}`,
    previewFailed: 'Erro ao criar visualização',
    deleteFailed: 'Erro ao remover imagem',
    imageLoadError: 'Erro ao carregar imagem',
    cameraNotSupported: 'Câmera não é suportada neste dispositivo',
    cameraAccessFailed: 'Não foi possível acessar a câmera',
  },
  ui: {
    dropHere: 'Solte a imagem aqui',
    clickOrDrag: 'Clique ou arraste uma imagem',
    formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • Máximo ${maxSizeMB}MB`,
    uploading: (p: number) => `Enviando... ${p}%`,
    uploadSuccess: 'Imagem enviada com sucesso!',
    replaceImage: 'Alterar imagem',
    removeImage: 'Remover imagem',
    profileImage: 'Foto de perfil',
    converting: 'Convertendo imagem...',
    takePhoto: 'Tirar foto',
    chooseFromGallery: 'Galeria',
    webcamInfo: 'Ou use a webcam pelo botão Alterar',
    chooseImage: 'Escolher imagem',
    cancel: 'Cancelar',
  }
},
  ch: {
    errors: {
      unsupportedFormat: '不支持的格式。可接受格式：JPG、PNG、WEBP、GIF、HEIC、BMP、TIFF、AVIF',
      fileTooLarge: (sizeMB: number, maxSizeMB: number) => `图片大小必须 ≤ ${maxSizeMB}MB（当前：${sizeMB.toFixed(1)}MB）`,
      uploadFailed: (error: string) => `上传错误：${error}`,
      previewFailed: '创建预览时出错',
      deleteFailed: '删除图片时出错',
      imageLoadError: '图片加载错误',
      cameraNotSupported: '此设备不支持相机功能',
      cameraAccessFailed: '无法访问相机',
    },
    ui: {
      dropHere: '将图片拖到此处',
      clickOrDrag: '点击或拖拽上传图片',
      formatInfo: (maxSizeMB: number) => `JPG、PNG、WEBP、GIF、HEIC • 最大 ${maxSizeMB}MB`,
      uploading: (p: number) => `正在上传... ${p}%`,
      uploadSuccess: '图片上传成功！',
      replaceImage: '更换图片',
      removeImage: '删除图片',
      profileImage: '头像照片',
      converting: '正在转换图片...',
      takePhoto: '拍摄照片',
      chooseFromGallery: '相册',
      webcamInfo: '或使用“更换图片”按钮通过摄像头拍摄',
      chooseImage: '选择图片',
      cancel: '取消',
    }
  },
  ar: {
  errors: {
    unsupportedFormat: 'صيغة غير مدعومة. الصيغ المقبولة: JPG, PNG, WEBP, GIF, HEIC, BMP, TIFF, AVIF',
    fileTooLarge: (sizeMB: number, maxSizeMB: number) => `يجب أن تكون الصورة ≤ ${maxSizeMB}MB (الحالية: ${sizeMB.toFixed(1)}MB)`,
    uploadFailed: (error: string) => `خطأ في الرفع: ${error}`,
    previewFailed: 'خطأ في إنشاء المعاينة',
    deleteFailed: 'خطأ في حذف الصورة',
    imageLoadError: 'خطأ في تحميل الصورة',
    cameraNotSupported: 'الكاميرا غير مدعومة على هذا الجهاز',
    cameraAccessFailed: 'لا يمكن الوصول إلى الكاميرا',
  },
  ui: {
    dropHere: 'أفلت الصورة هنا',
    clickOrDrag: 'انقر أو اسحب صورة',
    formatInfo: (maxSizeMB: number) => `JPG, PNG, WEBP, GIF, HEIC • الحد الأقصى ${maxSizeMB}MB`,
    uploading: (p: number) => `جاري الرفع... ${p}%`,
    uploadSuccess: 'تم رفع الصورة بنجاح!',
    replaceImage: 'استبدال الصورة',
    removeImage: 'حذف الصورة',
    profileImage: 'صورة الملف الشخصي',
    converting: 'جاري تحويل الصورة...',
    takePhoto: 'التقط صورة',
    chooseFromGallery: 'المعرض',
    webcamInfo: 'أو استخدم كاميرا الويب من خلال أزرار الاستبدال',
    chooseImage: 'اختر صورة',
    cancel: 'إلغاء',
  }
}

};


const generateUniqueId = (): string =>
  Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);

// Native dropzone (léger, accessible)
interface UseDropzoneOptions {
  onDrop: (files: File[]) => void;
  accept: Record<string, readonly string[]>;
  maxSize: number;
  multiple: boolean;
  disabled: boolean;
}
const useDropzone = (opts: UseDropzoneOptions) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); if (!opts.disabled) setIsDragActive(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) setIsDragActive(false); };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragActive(false);
    if (opts.disabled) return;
    const files = Array.from(e.dataTransfer.files);

    // validation simple: type image/* OU extension acceptée
    const acceptedExts = new Set<string>(Object.values(opts.accept).flat().map(String));
    const valid = files.filter(f => {
      const byMime = f.type.startsWith('image/');
      const byExt = acceptedExts.has('.' + (f.name.split('.').pop() || '').toLowerCase());
      return byMime || byExt;
    });

    if (valid.length) opts.onDrop(valid);
  };
  const onClick = () => { if (!opts.disabled) inputRef.current?.click(); };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) opts.onDrop(files);
  };
  const acceptString = useMemo(() => {
    // pour l'input, concatène le type + extensions
    const parts = new Set<string>([
      ...Object.keys(opts.accept),
      ...Object.values(opts.accept).flat().map(String)
    ]);
    return Array.from(parts).join(',');
  }, [opts.accept]);

  return {
    getRootProps: () => ({ onDragEnter, onDragLeave, onDragOver, onDrop, onClick, role: 'button', tabIndex: opts.disabled ? -1 : 0 }),
    getInputProps: () => ({ ref: inputRef, type: 'file', accept: acceptString, multiple: opts.multiple, onChange: onInputChange, style: { display: 'none' } }),
    isDragActive
  };
};

/* =========================
   Caméra (mobile + desktop)
   ========================= */
interface CameraCapture {
  openCamera: (facingMode?: 'user' | 'environment') => Promise<void>;
  isSupported: boolean;
}

const useCameraCapture = (
  onCapture: (file: File) => void,
  t: I18n
): CameraCapture => {
  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const streamRef = useRef<MediaStream | null>(null);

  async function getBestStream(preferred: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    // 1) tenter facingMode
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: preferred }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
    } catch { /* no-op */ }

    // 2) chercher une cam dos / back, ou première dispos
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      const back = videos.find(d =>
        /back|rear|environment|arrière|dos/i.test(d.label)
      ) || videos[0];
      if (back) {
        return await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: back.deviceId }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
      }
    } catch { /* no-op */ }

    // 3) fallback
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  const openCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    if (!isSupported) throw new Error(t.errors.cameraNotSupported);

    try {
      const stream = await getBestStream(facingMode);
      streamRef.current = stream;

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90';

      const container = document.createElement('div');
      container.className = 'bg-white rounded-lg p-4 max-w-sm w-full mx-4';

      const video = document.createElement('video');
      video.autoplay = true;
      (video as HTMLVideoElement).playsInline = true; // iOS
      video.className = 'w-full h-64 object-cover rounded-lg bg-black';
      (video as HTMLVideoElement).srcObject = stream;

      const btns = document.createElement('div');
      btns.className = 'flex gap-3 mt-4';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = t.ui.cancel;
      cancelBtn.className = 'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50';

      const switchBtn = document.createElement('button');
      switchBtn.textContent = '🔄';
      switchBtn.title = 'Changer de caméra';
      switchBtn.className = 'px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50';

      const captureBtn = document.createElement('button');
      captureBtn.textContent = t.ui.takePhoto;
      captureBtn.className = 'flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700';

      btns.append(cancelBtn, switchBtn, captureBtn);
      container.append(video, btns);
      modal.appendChild(container);
      document.body.appendChild(modal);

      const cleanup = () => {
        try { streamRef.current?.getTracks().forEach(tr => tr.stop()); } catch { /* no-op */ }
        streamRef.current = null;
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      };

      // fermer si clic en fond
      modal.onclick = (e) => { if (e.target === modal) cleanup(); };
      cancelBtn.onclick = cleanup;

      // capture via canvas
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = (video as HTMLVideoElement).videoWidth || 1280;
        const h = (video as HTMLVideoElement).videoHeight || 1280;
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(video as unknown as CanvasImageSource, 0, 0, w, h);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            onCapture(file);
          }
          cleanup();
        }, 'image/jpeg', 0.9);
      };

      // switch caméra
      let currentFacing: 'user' | 'environment' = facingMode;
      switchBtn.onclick = async () => {
        try {
          const desired = currentFacing === 'user' ? 'environment' : 'user';
          const newStream = await getBestStream(desired);
          try { streamRef.current?.getTracks().forEach(tr => tr.stop()); } catch { /* no-op */ }
          streamRef.current = newStream;
          (video as HTMLVideoElement).srcObject = newStream;
          currentFacing = desired;
        } catch (err) {
          console.warn('Could not switch camera:', err);
        }
      };

    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        throw new Error(t.errors.cameraNotSupported);
      }
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new Error(t.errors.cameraAccessFailed);
      }
      throw e instanceof Error ? e : new Error(t.errors.cameraAccessFailed);
    }
  }, [isSupported, onCapture, t]);

  return { openCamera, isSupported };
};

// Config images
const SUPPORTED_IMAGE_CONFIG = {
  extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff', '.tif', '.avif', '.apng', '.ico'] as const,
  mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/avif'] as const,
  maxDimension: 2048,
  jpegQuality: 0.85
} as const;

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  className?: string;
  maxSizeMB?: number;
  uploadPath?: string;
  disabled?: boolean;
  aspectRatio?: number;
  preferredCamera?: 'user' | 'environment';
  outputSize?: number;
  cropShape?: 'rect' | 'round';
  locale?: Locale;
  hideNativeFileLabel?: boolean;
  isRegistration?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUploaded,
  currentImage,
  className = '',
  maxSizeMB = 10,
  uploadPath = 'temp_profiles',
  disabled = false,
  aspectRatio = 1,
  preferredCamera = 'user',
  outputSize = 512,
  cropShape = 'rect',
  locale = 'fr',
  isRegistration = false,
}) => {
  const t = I18N[locale];

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const { openCamera, isSupported: isCameraSupported } = useCameraCapture((file) => handleFileSelect([file]), t);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreviewUrl(currentImage || null);
    if (currentImage) { setSuccess(false); setError(null); }
  }, [currentImage]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    return () => { if (tempImageUrl?.startsWith('blob:')) URL.revokeObjectURL(tempImageUrl); };
  }, [tempImageUrl]);

  const validateFile = useCallback((file: File): string | null => {
    const fileName = file.name.toLowerCase();
    const hasExt = SUPPORTED_IMAGE_CONFIG.extensions.some(ext => fileName.endsWith(ext));
    const hasMime = file.type === '' || (SUPPORTED_IMAGE_CONFIG.mimeTypes as readonly string[]).includes(file.type);
    if (!hasExt && !hasMime) return t.errors.unsupportedFormat;

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) return t.errors.fileTooLarge(file.size / 1024 / 1024, maxSizeMB);
    return null;
  }, [maxSizeMB, t]);

  const processImage = useCallback(async (file: File): Promise<File> => {
    const needsConversion = /\.(heic|heif|tiff|tif|bmp)$/i.test(file.name);
    if (!needsConversion) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          let { width, height } = img;
          const { maxDimension } = SUPPORTED_IMAGE_CONFIG;
          if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          canvas.width = width; canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.(heic|heif|tiff|tif|bmp)$/i, '.jpg'), {
                type: 'image/jpeg', lastModified: Date.now()
              }));
            } else resolve(file);
          }, 'image/jpeg', SUPPORTED_IMAGE_CONFIG.jpegQuality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * SUPPRESSION ROBUSTE D'UNE ANCIENNE IMAGE
   * - On décode le chemin exact de l'objet à partir de l'URL Firebase:
   *   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path encodé>?alt=media&token=...
   * - Pas d'heuristique sur le fileName. On supprime l'objet exact.
   */
  const deleteFromStorage = useCallback(async (url: string): Promise<void> => {
    try {
      if (!url) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return; // pas une URL valide -> on ignore
      }

      // on accepte les hôtes Firebase Storage usuels
      const host = parsed.host.toLowerCase();
      if (!/firebasestorage\.googleapis\.com$/.test(host) && !/storage\.googleapis\.com$/.test(host)) {
        return;
      }

      const afterO = parsed.pathname.split('/o/')[1];
      if (!afterO) return;
      const encodedObjectPath = afterO.split('?')[0];
      const fullObjectPath = decodeURIComponent(encodedObjectPath); // ex: "profilePhotos/uid/filename.jpg"
      if (!fullObjectPath) return;

      const storage = getStorage();
      const refObj = storageRef(storage, fullObjectPath);
      await deleteObject(refObj);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('Delete previous image failed:', e);
    }
  }, []);

  const uploadImage = useCallback(async (file: File | Blob): Promise<string> => {
    console.log('🔄 Starting image upload and optimization...', {
      blobSize: file.size,
      isRegistration,
      uploadPath: isRegistration ? 'registration_temp' : uploadPath
    });

    const storage = getStorage();
    
    // First, convert legacy formats if needed
    const processed = await (file instanceof File ? processImage(file) : processImage(new File([file], 'image.jpg', { type: 'image/jpeg' })));
    
    // Then optimize: standardize size and convert to WebP
    const { optimizeProfileImage, getOptimalFormat, getFileExtension } = await import('../../utils/imageOptimizer');
    
    try {
      const format = await getOptimalFormat();
      const optimized = await optimizeProfileImage(processed, {
        targetSize: 512,
        quality: 0.85,
        format,
      });

      console.log(`📊 Image optimized: ${(optimized.originalSize / 1024).toFixed(1)}KB → ${(optimized.optimizedSize / 1024).toFixed(1)}KB (${optimized.compressionRatio.toFixed(1)}x compression)`);

      const extension = getFileExtension(format);
      const fileName = `${generateUniqueId()}${extension}`;
      const finalUploadPath = isRegistration ? 'registration_temp' : uploadPath;
      const refObj: StorageReference = storageRef(storage, `${finalUploadPath}/${fileName}`);

      console.log(`💾 [ImageUploader] Saving to Firebase Storage as: ${format.toUpperCase()} format (${extension} extension)`);
      console.log('📁 Upload path:', `${finalUploadPath}/${fileName}`);

      return new Promise((resolve, reject) => {
        const task = uploadBytesResumable(refObj, optimized.blob);
        task.on('state_changed',
          (snap) => {
            const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setUploadProgress(p);
            console.log('📈 Upload progress:', p + '%');
          },
          (err) => {
            console.error('❌ Upload error:', err);
            setUploadProgress(0);
            
            // Messages d'erreur spécifiques selon le code
            let userMessage = t.errors.uploadFailed('Upload failed');
            if (err.code === 'storage/unauthorized') {
              userMessage = locale === 'fr' 
                ? 'Permissions insuffisantes. Réessayez ou contactez le support.'
                : 'Insufficient permissions. Try again or contact support.';
            } else if (err.code === 'storage/quota-exceeded') {
              userMessage = locale === 'fr'
                ? 'Quota de stockage dépassé. Contactez le support.'
                : 'Storage quota exceeded. Contact support.';
            } else if (err.code === 'storage/invalid-format') {
              userMessage = locale === 'fr'
                ? 'Format de fichier invalide. Utilisez JPG, PNG ou WEBP.'
                : 'Invalid file format. Use JPG, PNG or WEBP.';
            }
            
            reject(new Error(userMessage));
          },
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              setUploadProgress(100);
              console.log('✅ Upload successful:', url);
              resolve(url);
            } catch (e) {
              console.error('❌ GetDownloadURL error:', e);
              reject(e);
            }
          }
        );
      });
    } catch (optimizationError) {
      console.error('❌ Optimization error:', optimizationError);
      throw new Error(locale === 'fr' 
        ? "Erreur lors de l'optimisation de l'image"
        : 'Image optimization error');
    }
  }, [uploadPath, processImage, isRegistration, t, locale]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    const file = files?.[0];
    if (!file || disabled || isUploading) return;

    setError(null);
    setSuccess(false);

    const err = validateFile(file);
    if (err) { setError(err); return; }

    try {
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setShowCropModal(true);
    } catch (e) {
      setError(I18N[locale].errors.previewFailed);
      if (process.env.NODE_ENV === 'development') console.error('Preview error:', e);
    }
  }, [validateFile, disabled, isUploading, locale]);

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    console.log('🔄 Starting image upload...', {
      blobSize: croppedBlob.size,
      isRegistration,
      uploadPath: isRegistration ? 'registration_temp' : uploadPath
    });
    
    setShowCropModal(false);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      if (previewUrl) await deleteFromStorage(previewUrl);
      const url = await uploadImage(croppedBlob);
      console.log('✅ Upload successful:', url);
      setPreviewUrl(url);
      setSuccess(true);
      onImageUploaded(url);
      setTimeout(() => setUploadProgress(0), 1200);
    } catch (e) {
      console.error('❌ Upload failed:', e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(I18N[locale].errors.uploadFailed(msg));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      if (tempImageUrl) { URL.revokeObjectURL(tempImageUrl); setTempImageUrl(null); }
    }
  }, [previewUrl, deleteFromStorage, uploadImage, onImageUploaded, tempImageUrl, locale, isRegistration, uploadPath]);

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    if (tempImageUrl) { URL.revokeObjectURL(tempImageUrl); setTempImageUrl(null); }
  }, [tempImageUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: { 'image/*': SUPPORTED_IMAGE_CONFIG.extensions },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: disabled || isUploading,
  });

  const openCameraCapture = useCallback(async (facing: 'user' | 'environment' = preferredCamera) => {
    if (!disabled && !isUploading && isCameraSupported) {
      try { await openCamera(facing); } catch {
        setError(I18N[locale].errors.cameraAccessFailed);
      }
    } else if (!isCameraSupported) {
      setError(I18N[locale].errors.cameraNotSupported);
    }
  }, [disabled, isUploading, isCameraSupported, openCamera, preferredCamera, locale]);

  const openFileSelector = useCallback((accept = 'image/*', capture?: 'user' | 'environment') => {
    if (disabled || isUploading) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = false;
    if (capture) (input as unknown as { capture?: string }).capture = capture; // hint mobile
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.length) handleFileSelect(Array.from(files));
    };
    input.click();
  }, [disabled, isUploading, handleFileSelect]);

  const handleRemoveImage = useCallback(async () => {
    if (isUploading || disabled) return;
    setIsUploading(true);
    try {
      if (previewUrl) await deleteFromStorage(previewUrl);
      setPreviewUrl(null);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);
      onImageUploaded('');
    } catch (e) {
      setError(I18N[locale].errors.deleteFailed);
      if (process.env.NODE_ENV === 'development') console.error('Delete error:', e);
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, disabled, previewUrl, deleteFromStorage, onImageUploaded, locale]);

  const handleReplaceImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isUploading || disabled) return;

    // Show modal with camera option if camera is supported (all devices)
    if (isCameraSupported) {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
      const container = document.createElement('div');
      container.className = 'bg-white rounded-lg p-6 max-w-sm w-full mx-4';
      const title = document.createElement('h3');
      title.textContent = I18N[locale].ui.chooseImage;
      title.className = 'text-lg font-semibold mb-4 text-center';

      const buttons = document.createElement('div');
      buttons.className = 'space-y-3';

      const cameraBtn = document.createElement('button');
      cameraBtn.className = 'w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700';
      cameraBtn.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span>${I18N[locale].ui.takePhoto}</span>`;
      
      const galleryBtn = document.createElement('button');
      galleryBtn.className = 'w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50';
      galleryBtn.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span>${I18N[locale].ui.chooseFromGallery}</span>`;
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'w-full px-4 py-2 text-gray-500 text-sm hover:text-gray-700';
      cancelBtn.textContent = I18N[locale].ui.cancel;

      const cleanup = () => { if (modal.parentNode) document.body.removeChild(modal); };
      cameraBtn.onclick = () => { cleanup(); openCameraCapture('user'); };
      galleryBtn.onclick = () => { cleanup(); openFileSelector('image/*'); };
      cancelBtn.onclick = cleanup;

      buttons.append(cameraBtn, galleryBtn, cancelBtn);
      container.append(title, buttons);
      modal.appendChild(container);
      document.body.appendChild(modal);
      modal.onclick = (evt) => { if (evt.target === modal) cleanup(); };
    } else {
      // If camera not supported, just open file selector
      openFileSelector('image/*');
    }
  }, [isUploading, disabled, isCameraSupported, openCameraCapture, openFileSelector, locale]);

  return (
    <div className={`w-full ${className}`}>
      {previewUrl ? (
        <div className="relative group">
          <div className="relative">
            <div
              className={`absolute inset-0 z-10 ${disabled || isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={disabled || isUploading ? undefined : handleReplaceImage}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
                  e.preventDefault(); handleReplaceImage();
                }
              }}
              tabIndex={disabled || isUploading ? -1 : 0}
              role="button"
              aria-label={disabled || isUploading ? t.ui.profileImage : t.ui.replaceImage}
            />
            <img
              src={previewUrl}
              alt={t.ui.profileImage}
              className={`w-full h-auto rounded-lg object-cover max-h-72 sm:max-h-96 border border-gray-200 transition-opacity ${disabled || isUploading ? 'opacity-75' : 'group-hover:opacity-90'}`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0iI2Y2ZjZmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
              }}
              loading="lazy"
            />
            {!isUploading && !disabled && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-lg sm:hidden">
                <div className="bg-white/90 rounded-full p-3">
                  <Camera className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 flex gap-1 sm:gap-2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleReplaceImage(); }}
              disabled={isUploading || disabled}
              className="p-2.5 sm:p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title={t.ui.replaceImage}
              aria-label={t.ui.replaceImage}
            >
              <Camera size={18} className="sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
              disabled={isUploading || disabled}
              className="p-2.5 sm:p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title={t.ui.removeImage}
              aria-label={t.ui.removeImage}
            >
              <X size={18} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg z-40" aria-live="polite">
              <div className="text-white text-sm font-medium mb-4 px-4 text-center">{t.ui.uploading(uploadProgress)}</div>
              <div className="w-3/4 bg-gray-300 rounded-full h-2 overflow-hidden" aria-label="upload progress">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {success && !isUploading && (
            <div className="absolute bottom-2 right-2 bg-green-500 text-white p-2 rounded-full shadow-lg z-30" role="status" aria-live="polite">
              <Check size={16} aria-label="OK" />
            </div>
          )}
        </div>
      ) : (
        // Dropzone
        <div
          {...getRootProps()}
          onClick={(e) => {
            if (!disabled && !isUploading && !isDragActive) {
              e.preventDefault();
              e.stopPropagation();
              // Let the buttons below handle camera/file selection
              // Clicking the dropzone area itself does nothing (buttons handle it)
            }
          }}
          className={
            [
              'border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : (isUploading || disabled)
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
              'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
            ].join(' ')
          }
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          aria-label={isDragActive ? t.ui.dropHere : t.ui.clickOrDrag}
        >
          <input
            {...getInputProps()}
            ref={fileInputRef}
            aria-describedby="upload-description"
            className="sr-only pointer-events-none absolute -m-px w-px h-px overflow-hidden border-0 p-0 clip-[rect(0,0,0,0)]"
            tabIndex={-1}
            aria-hidden="true"
          />
          {isUploading ? (
            <div className="space-y-3">
              <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto animate-pulse" />
              <p className="text-gray-600 text-sm sm:text-base">{t.ui.uploading(uploadProgress)}</p>
              <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  {isDragActive ? t.ui.dropHere : t.ui.clickOrDrag}
                </p>
                <p id="upload-description" className="text-gray-500 text-xs sm:text-sm mt-1">
                  {t.ui.formatInfo(maxSizeMB)}
                </p>

                {/* Quick actions - Available on all devices */}
                <div className="mt-4 flex gap-2">
                  {isCameraSupported && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openCameraCapture('user'); }}
                      disabled={disabled || isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.ui.takePhoto}</span>
                      <span className="sm:hidden">📷</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openFileSelector('image/*'); }}
                    disabled={disabled || isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <FileImage className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.ui.chooseFromGallery}</span>
                    <span className="sm:hidden">🖼️</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Erreurs */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2" role="alert" aria-live="polite">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Succès */}
      {success && !isUploading && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2" role="status" aria-live="polite">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">{t.ui.uploadSuccess}</span>
        </div>
      )}

      {/* Modal crop */}
      {tempImageUrl && (
        <ImageCropModal
          imageUrl={tempImageUrl}
          isOpen={showCropModal}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={aspectRatio}
          cropShape={cropShape}
          outputSize={outputSize}
          locale={locale}
        />
      )}
    </div>
  );
};

export default ImageUploader;