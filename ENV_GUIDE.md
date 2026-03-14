# دليل متغيرات البيئة

## متغيرات البيئة المطلوبة

### 🤖 متغيرات البوت التلجرام
```
TELEGRAM_BOT_TOKEN = رمز API البوت من @BotFather
VITE_TELEGRAM_BOT_USERNAME = اسم البوت (بدون @)
```

**كيفية الحصول على TELEGRAM_BOT_TOKEN:**
1. تحدث مع [@BotFather](https://t.me/botfather)
2. أرسل `/newbot`
3. اكتب اسم البوت (مثل: TlikerBot)
4. اكتب اسم مستخدم فريد (مثل: tliker_awesome_bot)
5. سيعطيك رمز الـ Token

**مثال:**
```
TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIJKlmnoPQRstUVwxyz
VITE_TELEGRAM_BOT_USERNAME=tliker_awesome_bot
```

---

### 🗄️ متغيرات MongoDB

```
MONGODB_URI = رابط الاتصال بـ MongoDB
MONGODB_DB = اسم قاعدة البيانات (افتراضي: tliker)
```

**كيفية الحصول على MONGODB_URI:**

#### الخيار 1️⃣: MongoDB Atlas (سحابي - موصى به)
1. اذهب إلى: https://www.mongodb.com/cloud/atlas
2. أنشئ تجمع cluster مجاني
3. أضف Username و Password
4. انسخ الرابط: `mongodb+srv://username:password@cluster.mongodb.net/`

#### الخيار 2️⃣: MongoDB محلي
```
MONGODB_URI=mongodb://localhost:27017/
```

**تنسيق الرابط:**
```
mongodb+srv://[username]:[password]@[cluster].mongodb.net/
```

**مثال:**
```
MONGODB_URI=mongodb+srv://admin:password123@tliker.mongodb.net/
MONGODB_DB=tliker
```

---

### 🔐 متغيرات الإدارة

```
ADMIN_PASSWORD = كلمة مرور الإدارة (قوية وآمنة)
ADMIN_USER_IDS = (اختياري) معرفات المسؤولين في تلجرام
ADMIN_SECRET = (اختياري) سر إضافي لتوقيع الجلسات
ALLOW_WEB_ADMIN_LOGIN = true/false (السماح بدخول الويب)
```

**نصائح الأمان:**
- استخدم كلمة مرور قوية: `MyAdmin@2026!Secure123`
- لا تشاركها مع أحد
- غيرها دورياً

**ADMIN_USER_IDS (اختياري):**
إذا أردت تحديد من يمكنه تسجيل الدخول:
```
ADMIN_USER_IDS=123456789,987654321,555555555
```

**مثال آمن:**
```
ADMIN_PASSWORD=MyAdmin@2026!Secure123
ADMIN_USER_IDS=123456789
ALLOW_WEB_ADMIN_LOGIN=true
```

---

### 🌐 متغيرات التطبيق

```
APP_URL = الرابط الأساسي للتطبيق
```

**في التطوير محلياً:**
```
APP_URL=http://localhost:3000
```

**على Vercel:**
```
APP_URL=https://your-project.vercel.app
```

---

## الملف .env الكامل

```env
# ============ البوت التلجرام ============
TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIJKlmnoPQRstUVwxyz
VITE_TELEGRAM_BOT_USERNAME=tliker_awesome_bot

# ============ قاعدة البيانات MongoDB ============
MONGODB_URI=mongodb+srv://admin:password123@tliker.mongodb.net/
MONGODB_DB=tliker

# ============ الإدارة ============
ADMIN_PASSWORD=MyAdmin@2026!Secure123
ADMIN_USER_IDS=123456789
ADMIN_SECRET=optional_extra_secret_key
ALLOW_WEB_ADMIN_LOGIN=true

# ============ التطبيق ============
APP_URL=https://your-project.vercel.app
```

---

## كيفية استخدام متغيرات البيئة في الكود

### في Node.js (Backend)
```typescript
const mongoUri = process.env.MONGODB_URI;
const adminPassword = process.env.ADMIN_PASSWORD;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
```

### في React (Frontend) - يجب أن تبدأ بـ VITE_
```typescript
const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
const appUrl = import.meta.env.VITE_APP_URL; // إذا أضفته
```

---

## أمان متغيرات البيئة 🔒

### ✅ افعل:
- استخدم `.env.local` للتطوير المحلي
- ضع المتغيرات الحساسة في Vercel Dashboard
- استخدم كلمات مرور قوية
- أعد التحقق من المتغيرات دورياً

### ❌ لا تفعل:
- لا تضع `.env` في Git
- لا تشارك متغيراتك مع أحد
- لا تكتب كلمات المرور في الكود
- لا تستخدم نفس كلمات المرور في التطبيقات المختلفة

---

## اختبار متغيرات البيئة

### من Terminal:
```bash
# في Windows PowerShell
$env:TELEGRAM_BOT_TOKEN = "your_token"
echo $env:TELEGRAM_BOT_TOKEN

# في Linux/Mac
export TELEGRAM_BOT_TOKEN="your_token"
echo $TELEGRAM_BOT_TOKEN
```

### في الكود:
```typescript
console.log('BOT Token exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
```

---

## استكشاف المشاكل

### ❌ "TELEGRAM_BOT_TOKEN is not defined"
- تأكد من `.env` موجود في المجلد الرئيسي
- امسح الـ cache إعادة تشغيل الخادم: `npm run dev`

### ❌ "Cannot connect to MongoDB"
- تحقق من MONGODB_URI صحيح
- تأكد من إضافة IP عنوانك في MongoDB Atlas
  - في Atlas → Network Access → اضف IP

### ❌ في Vercel "undefined"
- تأكد من إضافة المتغيرات في Vercel Settings
- أعد النشر بعد إضافة المتغيرات

---

## الخلاصة الأمنية 🛡️
1. **لا تشارك `.env`** في GitHub (موجود في .gitignore)
2. **محلياً**: استخدم `.env`
3. **Vercel**: استخدم Environment Variables من Dashboard
4. **استخدم كلمات مرور قوية** لكل متغير حساس
