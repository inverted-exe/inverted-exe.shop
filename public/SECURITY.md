# 🔐 Admin Panel Security Guide

## Password Requirements
✅ **Current Password:** `Inv3rt3d!EXE2026#Admin`

**PENTING: Ubah password ini ke password yang lebih aman!**

Password Anda harus memiliki:
- Minimal 12 karakter
- Kombinasi huruf besar (A-Z)
- Kombinasi huruf kecil (a-z)
- Kombinasi angka (0-9)
- Kombinasi simbol spesial (!@#$%^&*)

**Contoh password yang aman:**
```
MyBrand!2026#Secure$Admin
```

---

## 🛡️ Security Features Aktif

### 1. **Rate Limiting / Brute Force Protection**
- ❌ Larangan login setelah 5 percobaan gagal
- ⏱️ Lockout otomatis selama 15 menit
- 📊 Counter reset setelah 15 menit atau login berhasil
- 📝 Semua attempt dicatat di localStorage

### 2. **Session Security**
- ⏰ Session timeout: 30 menit tanpa aktivitas
- 🔍 Auto logout jika tab tertutup
- 📍 Session check setiap 5 menit
- 🔐 Data sensitif auto-clear saat logout

### 3. **Activity Logging**
- 📋 Semua login attempt dicatat
- 🔴 Failed attempts dicatat dengan timestamp
- 🟢 Successful logins dicatat
- ⚠️ Account lockouts dicatat
- 🚪 Manual logout dicatat

### 4. **Token Management**
- 🎫 Session token disimpan di sessionStorage (bukan localStorage)
- 🔄 Token cleared saat browser ditutup
- ✅ Token diverifikasi setiap klik admin

### 5. **Form Protection**
- 🔒 Password field auto-clear saat page unload
- 🎯 Password di-mask dengan type="password"
- 🧹 Form auto-reset setelah login gagal

---

## 📱 Cara Mengubah Password

### Untuk Client-Side (Development):
1. Buka file: `admin/login.html`
2. Cari baris:
   ```javascript
   const ADMIN_PASSWORD = 'Inv3rt3d!EXE2026#Admin';
   ```
3. Ganti dengan password baru Anda:
   ```javascript
   const ADMIN_PASSWORD = 'YourNewPassword123!@#';
   ```
4. Save dan deploy

### Best Practice:
- Gunakan password manager untuk generate password kuat
- Jangan bagikan password dengan orang lain
- Ubah password setiap 3 bulan
- Gunakan password yang berbeda dari website lain

---

## 🔍 Monitoring & Security Audit

### Lihat Failed Login Attempts:
Buka Developer Console (F12) dan jalankan:
```javascript
const logs = JSON.parse(localStorage.getItem('adminSecurityLog') || '[]');
console.table(logs);
```

### Clear Security Logs:
```javascript
localStorage.removeItem('adminSecurityLog');
localStorage.removeItem('adminAttempts');
localStorage.removeItem('adminLockoutTime');
```

### Check Session Status:
```javascript
console.log({
  authenticated: sessionStorage.getItem('adminAuthenticated'),
  loginTime: new Date(parseInt(sessionStorage.getItem('adminLoginTime'))),
  currentTime: new Date()
});
```

---

## ⚠️ Security Warnings

### ❌ JANGAN:
- ❌ Gunakan password "admin" atau "123456"
- ❌ Bagikan admin URL ke orang yang tidak percaya
- ❌ Simpan password di sticky notes atau plain text
- ❌ Login dari WiFi publik tanpa VPN
- ❌ Biarkan browser mengingat password admin
- ❌ Keluar darihalaman admin tanpa logout
- ❌ Buka Developer Console saat login

### ✅ LAKUKAN:
- ✅ Gunakan password kompleks dan unik
- ✅ Logout setelah selesai
- ✅ Gunakan HTTPS (website sudah menggunakan)
- ✅ Monitor security logs secara berkala
- ✅ Ubah password jika dicurigai bocor
- ✅ Aktifkan 2FA jika tersedia
- ✅ Patuhi session timeout

---

## 🚨 Jika Terjadi Breach

Jika Anda curiga security terganggu:

1. **Langsung logout** dari semua perangkat
2. **Ubah password** ke yang lebih kompleks
3. **Clear all security logs** dari localStorage
4. **Check recent attacks:**
   ```javascript
   const logs = JSON.parse(localStorage.getItem('adminSecurityLog') || '[]');
   const recentAttacks = logs.filter(log => log.event === 'failed_login_attempt');
   console.log('Recent failed attempts:', recentAttacks);
   ```
5. **Reset account locks:**
   ```javascript
   localStorage.removeItem('adminLockoutTime');
   localStorage.removeItem('adminAttempts');
   ```

---

## 📊 Security Stats

**Session Timeout:** 30 menit
**Lockout Duration:** 15 menit
**Max Attempts:** 5 failed logins
**Log Retention:** Last 50 events
**Password Pattern:** Mixed case, numbers, symbols

---

## 🔐 Tips Keamanan Tambahan (Future Improvements)

Untuk keamanan ekstra di masa depan:
- [ ] Implement 2-Factor Authentication (2FA)
- [ ] Add CAPTCHA pada login form
- [ ] Use OAuth untuk multi-user auth
- [ ] Setup IP whitelist
- [ ] Add device fingerprinting
- [ ] Implement admin activity dashboard
- [ ] Add automated security alerts
- [ ] Use backend authentication service

---

**Last Updated:** April 14, 2026
**Status:** ✅ Security Enhanced

Untuk bantuan lebih lanjut, hubungi tim development.
