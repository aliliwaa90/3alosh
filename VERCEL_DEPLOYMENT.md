# خطوات نشر المشروع على Vercel

## ما تم إنجازه ✅
- تم رفع المشروع إلى GitHub: `https://github.com/aliliwaa90/3alosh`
- جميع التحديثات (نظام السحب، الشاشة الترحيبية) موجودة

## خطوات النشر على Vercel

### 1️⃣ الذهاب إلى Vercel
- اذهب إلى: https://vercel.com
- سجل الدخول بحسابك (أو أنشئ حساب جديد)

### 2️⃣ ربط GitHub
- في صفحة Vercel، انقر على **"New Project"**
- اختر **"Import Git Repository"**
- ختر repository: **3alosh** (aliliwaa90/3alosh)
- انقر **"Import"**

### 3️⃣ إعدادات المشروع
- **Project Name**: اترك اسم المشروع الافتراضي أو غيره
- **Framework Preset**: اختر **"Vite"**
- **Root Directory**: اترك فارغ (/)
- في قسم **"Build and Output Settings"**:
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

### 4️⃣ إضافة متغيرات البيئة (الأهم)
اضغط على **"Environment Variables"** وأضف المتغيرات التالية:

| المتغير | القيمة | ملاحظات |
|--------|--------|--------|
| `TELEGRAM_BOT_TOKEN` | رمز البوت من BotFather | مطلوب |
| `VITE_TELEGRAM_BOT_USERNAME` | اسم البوت | مطلوب |
| `MONGODB_URI` | رابط MongoDB | مطلوب للقاعدة البيانات |
| `MONGODB_DB` | `tliker` | افتراضي |
| `ADMIN_PASSWORD` | كلمة مرور الإدارة | مطلوب |
| `ADMIN_USER_IDS` | معرفات المسؤولين (اختياري) | (اختياري) |
| `ADMIN_SECRET` | سر إضافي للتوقيع (اختياري) | (اختياري) |
| `ALLOW_WEB_ADMIN_LOGIN` | `true` | السماح بتسجيل الدخول من المتصفح |

**مثال:**
```
TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIJKlmnoPQRstUVwxyz
VITE_TELEGRAM_BOT_USERNAME=MyAwesomeBot
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
ADMIN_PASSWORD=MySecurePassword123
```

### 5️⃣ النشر
- اضغط **"Deploy"**
- انتظر حتى ينتهي النشر (عادة 2-5 دقائق)
- ستحصل على رابط URL: `https://your-project.vercel.app`

## ملاحظات مهمة ⚠️

### محافظة على متغيرات البيئة
✅ **المتغيرات مخزنة بأمان** في لوحة Vercel  
✅ **لن تُفقد** عند التحديثات المستقبلية  
⚠️ **لا تنشر كلمات المرور** في الملفات - استخدم متغيرات البيئة فقط

### آلية التحديثات المستقبلية
1. عدل الملفات محلياً
2. اضغط إلى GitHub: `git push origin main`
3. Vercel ستحدث تلقائياً عند كل push للـ main

```bash
# الخطوات:
git add .
git commit -m "وصف التحديث"
git push origin main
```

### أخذ نسخة احتياطية من متغيرات البيئة
احفظ نسختك المحلية من `.env`:
```
TELEGRAM_BOT_TOKEN=your_token
VITE_TELEGRAM_BOT_USERNAME=your_username
MONGODB_URI=your_mongodb_uri
MONGODB_DB=tliker
ADMIN_PASSWORD=your_password
ALLOW_WEB_ADMIN_LOGIN=true
```

## مشاكل شائعة وحلولها

### ❌ "Deployment Failed"
- تحقق من متغيرات البيئة في Vercel
- تأكد من MONGODB_URI صحيح
- افحص أخطاء البناء في Logs

### ❌ "Cannot find module"
- تأكد من تشغيل `npm install` محلياً
- اضغط إلى GitHub من جديد

### ❌ أخطاء API
- تحقق من ADMIN_PASSWORD و TELEGRAM_BOT_TOKEN
- تأكد من وصول MongoDB من Vercel IP

## الروابط المفيدة
- 📚 [توثيق Vercel](https://vercel.com/docs)
- 🔐 [إدارة متغيرات البيئة](https://vercel.com/docs/concepts/projects/environment-variables)
- 🚀 [نشر مشاريع Vite](https://vercel.com/docs/frameworks/vite)
