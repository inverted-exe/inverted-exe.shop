# 🔥 FIREBASE SETUP GUIDE untuk inverted.exe

## STEP 1: Buat Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Create a project"** atau gunakan project yang sudah ada
3. Nama project: `inverted-exe` (atau nama pilihan Anda)
4. Pilih negara: **Indonesia**
5. Click **Create Project** → tunggu selesai

---

## STEP 2: Setup Realtime Database

1. Di Firebase Console, klik **Build** → **Realtime Database**
2. Click **Create Database**
3. Pilih lokasi: **asia-southeast1** (Singapore, terdekat dengan Indonesia)
4. Pilih Security Rules mode: **Start in test mode** (untuk testing)
5. Click **Enable** 
6. Tunggu database dibuat (~2 menit)

---

## STEP 3: Copy Database URL

1. Di Realtime Database tab, cari **Database URL** (atas halaman)
   - Format: `https://PROJECT-NAME-rtdb.asia-southeast1.firebasedatabase.app`
2. **Copy URL ini**
3. Buka file `public/database.js` di project
4. Cari variabel `databaseURL` dalam `firebaseConfig`
5. **Paste URL yang sudah di-copy**

Contoh:
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://inverted-exe-database-default-rtdb.asia-southeast1.firebasedatabase.app",  // ← Paste di sini
  projectId: "...",
  // ...
};
```

---

## STEP 4: Setup Security Rules (PENTING!)

### Untuk DEVELOPMENT (Test Mode - Terbuka):
1. Klik tab **Rules** di Realtime Database
2. Hapus isi yang sudah ada
3. **Paste kode ini:**

```json
{
  "rules": {
    "content": {
      ".read": true,
      ".write": true,
      "$key": {
        ".validate": "true"
      }
    }
  }
}
```

4. Click **Publish** - tunggu 30 detik hingga selesai

### Untuk PRODUCTION (Aman - Butuh Password):
**JANGAN pakai untuk production!** Setup authentication dulu. Untuk sekarang gunakan test mode di atas.

---

## STEP 5: Setup Firebase Authentication (Opsional untuk Admin)

### Untuk Admin Panel Login:
1. Klik **Build** → **Authentication**
2. Click **Get started**
3. Di **Sign-in method**, click **Email/Password**
4. Enable both toggle:
   - ✅ Email/Password
   - ✅ Enable anonymous sign-in
5. Click **Save**

Atau gunakan cara sekarang yang lebih simple:
- Password di-hash di client (sudah ada di `admin/login.html`)
- Tidak perlu Firebase Auth untuk sekarang

---

## STEP 6: Test Connection

Go to website Anda dan test:

### Test 1: Contact Form
1. Go to `/contact/` page
2. Isi form:
   - Name: "Test Name"
   - Email: "test@example.com"
   - Message: "This is a test message"
3. Click **Send**
4. Harus muncul: ✓ message sent — thanks!

### Test 2: Check Firebase Console
1. Kembali ke Firebase Console
2. Buka **Realtime Database** tab
3. Klik expand **content** → **contact**
4. Harus terlihat data Anda ada di sana:
```
contact
  0
    createdAt: "2026-02-22T10:30:00.000Z"
    email: "test@example.com"
    id: 1708606200000
    message: "This is a test message"
    name: "Test Name"
```

### Test 3: Admin Panel
1. Go to `/admin/login.html`
2. Password: `inverted2025` (default)
3. Masuk ke **blog** section
4. Click **add article**
5. Isi form:
   - Title: "Test Article"
   - Category: "test"
   - Date: (auto-filled)
   - Excerpt: "Test excerpt"
   - Content: "This is test content"
6. Click **Save article**
7. Harus muncul notification: "article saved successfully"
8. Kembali ke Firebase Console
9. Buka **content** → **blog**
10. Harus terlihat artikel baru Anda

---

## STEP 7: Download Firebase SecurityRules (Backup)

⚠️ **Ada file sudah siap!** Lihat: `firebase-security-rules.json`

Kalau mau pakai rules yang lebih kompleks (untuk nanti):
- Ada rules untuk user authentication
- Ada validation untuk struktur data
- Ada rules untuk admin only access

---

## ✅ CHECKLIST SETUP

- [ ] Firebase Project dibuat
- [ ] Realtime Database dibuat di asia-southeast1
- [ ] Database URL di-copy ke `public/database.js`
- [ ] Security Rules di-publish (test mode)
- [ ] Contact form test → data muncul di Firebase ✓
- [ ] Admin panel test → blog article terseimpan ✓
- [ ] Mobile navigation tested
- [ ] All pages can access Firebase

---

## 🐛 TROUBLESHOOTING

### Problem: "Database operation failed"
**Solution:**
1. Cek Firebase Console → Realtime Database
2. Pastikan database sudah "Enable" (bukan "Disabled")
3. Refresh website Ctrl+Shift+R
4. Check console error (F12 → Console tab)

### Problem: "Permission denied at path"
**Solution:**
1. Buka Firebase Console → Rules tab
2. Pastikan sudah **Publish** rule yang benar
3. Rules harus punya `.write: true` untuk development
4. Wait 30 seconds setelah publish

### Problem: "TypeError: Cannot read property 'ref' of undefined"
**Solution:**
1. Pastikan Firebase SDK sudah loaded
2. Check HTML file include script:
```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
<script src="database.js"></script>
```
3. Order harus seperti di atas
4. Refresh page

### Problem: Data tidak muncul di admin panel
**Solution:**
1. Pastikan data sudah di Firebase Console (step di atas)
2. Klik **blog** nav di admin panel
3. Wait 3-5 seconds untuk load data
4. Kalau masih tidak muncul, buka F12 Console check error
5. Refresh page

---

## 📞 NEXT STEPS

Setelah database setup selesai:

1. **Change Admin Password** → Edit `admin/login.html`
2. **Add more security rules** → Later kalau sudah production
3. **Setup Analytics** → Google Analytics (optional)
4. **Setup Email Notifications** → Cloud Functions (advanced)
5. **Setup Backups** → Firebase Backups (paid feature)

---

## 🔐 SECURITY NOTES

⚠️ Test mode (`write: true`) hanya untuk development!

Untuk production, buat authentication system:
- Email/Password auth
- Or Anonymous auth + validation
- Or Custom token dari backend

Sekarang gunakan test mode saja untuk coba-coba.

---

**Di step mana Anda sekarang? Sudah buat Firebase project?**
