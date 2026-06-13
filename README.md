# Airsoft Tactic Admin Dashboard

## Chạy Local (Nhanh nhất)

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file môi trường
cp .env.local.example .env.local

# 3. Chạy dev server
npm run dev
```

Mở http://localhost:3000 — bấm "Đăng nhập với Google" là vào được luôn (chạy mock mode, không cần backend hay Firebase thật).

---

## Chế độ Mock vs Real Backend

### Mock Mode (mặc định — để test UI)
Trong `.env.local`:
```
NEXT_PUBLIC_USE_MOCK=true
```
- Không cần backend, không cần Firebase config
- Dữ liệu giả lập sẵn (fields, users, stats)
- Đăng nhập bằng nút Google → vào thẳng dashboard

### Kết nối Backend Local
Trong `.env.local`:
```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Và điền đủ Firebase config bên dưới
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## Lấy Firebase Config

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn Project → **Project Settings** → tab **General**
3. Kéo xuống phần **Your apps** → chọn web app (hoặc tạo mới)
4. Copy thông tin vào `.env.local`
5. Trong Firebase Console → **Authentication** → **Sign-in method** → bật **Google**
6. Thêm `localhost` vào **Authorized domains**

---

## Build & Deploy Firebase Hosting

```bash
# Build static export
npm run build

# Deploy
firebase deploy --only hosting
```

Cập nhật `.firebaserc` với Project ID thật của bạn trước khi deploy.

---

## Cấu trúc Project

```
src/
├── app/
│   ├── dashboard/page.tsx   # Thống kê tổng quan
│   ├── fields/page.tsx      # CRUD sân chơi
│   ├── users/page.tsx       # Quản lý người dùng
│   └── login/page.tsx       # Google Sign-In
├── components/layout/
│   ├── AdminLayout.tsx      # Route guard + layout wrapper
│   └── Sidebar.tsx          # Navigation sidebar
├── contexts/
│   └── AuthContext.tsx      # Firebase Auth + adminToken state
├── lib/
│   ├── firebase.ts          # Firebase app init
│   ├── axios.ts             # Axios client + interceptors + mock adapter
│   ├── mockData.ts          # Dữ liệu giả lập cho dev
│   └── utils.ts             # cn() helper
└── types/index.ts           # TypeScript interfaces
```

## API Endpoints

| Chức năng | Method | Endpoint |
|-----------|--------|----------|
| Firebase login | POST | `/v1/admin/auth/firebase-login` |
| Stats | GET | `/v1/admin/stats` |
| Fields list | GET | `/v1/fields` |
| Create field | POST | `/v1/admin/fields` |
| Update field | PUT | `/v1/admin/fields/{id}` |
| Delete field | DELETE | `/v1/admin/fields/{id}` |
| Users list | GET | `/v1/admin/users?page=0&size=10` |
| Update role | PATCH | `/v1/admin/users/{id}/role` |
