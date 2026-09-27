# Jiva Florist

Aplikasi sistem informasi akuntansi persediaan, biaya, dan profitabilitas dengan tiga entitas PostgreSQL: `products`, `inventory_movements`, dan `business_transactions`.

```text
frontend/
  index.html
  styles.css
  script.js
backend/
  app.js
  schema.sql
README.md
```

## Menjalankan

Gunakan Node.js 18 atau lebih baru. Aplikasi memakai modul bawaan Node dan tidak memerlukan `package.json` maupun instalasi dependensi.

```powershell
node backend/app.js
```

Buka `http://localhost:3000`. Tanpa kredensial database, aplikasi berjalan dalam mode demo. Perubahan demo disimpan di memori dan hilang ketika server dimulai ulang.

Untuk membuka dari folder tanpa server, buka `frontend/index.html`. Data demo dan perubahan disimpan pada `localStorage` browser di komputer ini, sehingga bertahan setelah halaman di-refresh. Data tersebut tidak tersinkron ke Supabase. Untuk penyimpanan database yang dapat dipakai bersama, jalankan backend melalui perintah di atas dan hubungkan Supabase.

## Menghubungkan Supabase

1. Jalankan seluruh isi `backend/schema.sql` pada SQL Editor proyek Supabase. Skrip membuat tiga tabel, view persediaan, indeks, fungsi transaksi, pembatasan akses, dan data awal.
2. Atur variabel lingkungan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` pada terminal/server Node. Kunci service role hanya boleh disimpan di backend, tidak boleh ditaruh di frontend atau dikirim ke browser.
3. Jalankan `node backend/app.js`. Indikator aplikasi menunjukkan apakah koneksi berjalan pada mode Supabase atau demo.

Contoh PowerShell untuk terminal saat ini:

```powershell
$env:SUPABASE_URL = 'https://PROJECT_REF.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = 'SERVICE_ROLE_KEY'
node backend/app.js
```

## Kebijakan dan batasan akuntansi

- Pembelian mencatat kuantitas serta biaya perolehan dan memperbarui biaya rata-rata tertimbang bergerak. Penjualan memakai biaya rata-rata saat transaksi, memvalidasi ketersediaan, dan memotong stok secara atomik.
- Biaya bahan, tenaga kerja, overhead produksi, dan biaya operasional dicatat terpisah agar profitabilitas dapat ditinjau.
- PSAK 202 mengatur persediaan sebesar nilai yang lebih rendah antara biaya perolehan dan nilai realisasi neto (NRV). Peringatan NRV pada aplikasi meminta peninjauan; penurunan nilai tidak dijurnal otomatis.
- PPN ditampilkan terpisah dan tidak dianggap pendapatan atau pengurang laba. Tarif formulir hanya untuk pencatatan; verifikasi tarif, dasar pengenaan, dan kewajiban faktur yang berlaku.
- Estimasi PPh final opsional dan bawaan 0%. Tarif yang dimasukkan diterapkan pada penjualan setelah diskon. Kelayakan skema, batas omzet, masa penggunaan, pengecualian, serta aturan pajak terbaru harus dikonfirmasi kepada DJP atau konsultan pajak.

Aplikasi ini alat bantu operasional, bukan pengganti kebijakan akuntansi, jurnal lengkap, rekonsiliasi, atau nasihat profesional. Tinjau dan rekonsiliasi transaksi sebelum memakai data untuk pelaporan resmi.
