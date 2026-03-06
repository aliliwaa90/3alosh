
# دليل حل المشاكل التقنية (Firebase Troubleshooting)

إذا ظهرت لك رسائل خطأ مثل `Missing or insufficient permissions` أو `The query requires an index` في متصفحك، اتبع الخطوات التالية بدقة:

---

## 1. حل مشكلة الصلاحيات (Permissions Error)

اذهب إلى [Firebase Console](https://console.firebase.google.com/) -> اختر مشروعك -> **Firestore Database** -> تبويب **Rules**.

استبدل الكود الموجود هناك بهذا الكود (يسمح بالوصول لجميع الجداول المطلوبة):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قاعدة عامة للسماح بالقراءة والكتابة لجميع الجداول المستخدمة في التطبيق
    match /users/{document=**} { allow read, write: if true; }
    match /tasks/{document=**} { allow read, write: if true; }
    match /transactions/{document=**} { allow read, write: if true; }
    match /mining_machines/{document=**} { allow read, write: if true; }
    match /agents/{document=**} { allow read, write: if true; }
    match /chat/{document=**} { allow read, write: if true; }
    match /games/{document=**} { allow read, write: if true; }
    match /announcements/{document=**} { allow read, write: if true; }
    
    // تأمين الوصول للمجموعات (اختياري للتطوير)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
*ملاحظة: اضغط على **Publish** بعد لصق الكود.*

---

## 2. حل مشكلة الفهارس (Indexes Error)

عندما تظهر رسالة `The query requires an index` في الـ Console، اتبع الرابط المرفق في الرسالة مباشرة.

**الرابط الذي ظهر لك:**
`https://console.firebase.google.com/v1/r/project/scoolali-41f04/firestore/indexes?create_composite=ClNwcm9qZWN0cy9zY29vbGFsaS00MWYwNC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdHJhbnNhY3Rpb25zL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI`

1. افتح هذا الرابط في المتصفح.
2. سيفتح لك صفحة في Firebase تطلب منك إنشاء فهرس لجدول `transactions`.
3. اضغط على **Create Index**.
4. انتظر حوالي 3-5 دقائق حتى تتحول الحالة من `Building` إلى `Enabled`.

---

## 3. إعدادات تخزين الصور (Storage)

تأكد من تفعيل تبويب **Storage** لرفع صور المعدات:
1. اذهب إلى **Build** -> **Storage**.
2. في تبويب **Rules**، استخدم:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true; // يسمح للمدير برفع صور الأجهزة
    }
  }
}
```

باتباع هذه الخطوات، ستختفي جميع أخطاء "Insufficient Permissions" وسيعمل سجل العمليات (Transactions) بشكل صحيح.
