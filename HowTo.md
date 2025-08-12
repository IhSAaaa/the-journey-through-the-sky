# Prompt AI untuk Claude 4 Sonnet – "The Journey Through the Sky"

**Tujuan:**  
Membuat **single-page storytelling interaktif** menggunakan **React Three Fiber (R3F)** yang menggambarkan perjalanan melalui pemandangan alam yang indah dengan langit cerah, awan putih, pegunungan, dan cahaya matahari hangat. Semua elemen dibuat **procedural**, tanpa aset gambar eksternal.

---

## Instruksi Utama untuk Claude
1. Gunakan **React Three Fiber** (`@react-three/fiber`) dan `@react-three/drei` untuk setup kamera, cahaya, dan objek.
2. Semua bentuk, warna, dan efek harus dibuat secara **procedural** (plane untuk tanah, sphere untuk matahari, cube atau custom geometry untuk batu/pepohonan).
3. Gunakan **scroll** untuk memindahkan kamera melalui scene, seolah-olah user sedang terbang melintasi alam.
4. Animasi transisi antar scene harus halus menggunakan **React Spring** atau **GSAP**.
5. Gunakan **postprocessing ringan** untuk efek cahaya matahari dan atmosfer.

---

## Gaya Visual
- **Tema:** Cerah, natural, menenangkan.
- **Warna dominan:** Biru muda (langit), putih (awan), hijau segar (pepohonan), kuning hangat (matahari).
- **Pencahayaan:** Directional light (matahari), ambient light lembut, dan sedikit fog putih untuk kesan jarak.
- **Efek tambahan:** Lens flare matahari, bloom tipis, gentle cloud movement.
- **Geometri:** Plane untuk tanah/air, box kecil untuk batu, sphere untuk matahari, custom geometry untuk pohon dan awan.

---

## Struktur Cerita & Scene

### 1. Opening Scene – The Valley
- Kamera berada di atas lembah hijau luas.
- Latar langit biru dengan awan tipis bergerak perlahan.
- Matahari rendah di langit, memberikan cahaya keemasan.
- Burung kecil terbang jauh di latar (partikel procedural).

### 2. Mid Scene – Over the Mountains
- Kamera naik perlahan melintasi pegunungan.
- Puncak gunung tertutup salju, cahaya matahari menyinari lembut.
- Awan lebih tebal, bergerak lebih cepat.
- Efek parallax antar lapisan gunung.

### 3. Climax – Into the Clouds
- Kamera menembus awan besar, cahaya matahari menembus sela-sela awan.
- Efek volumetric light tipis di antara awan.
- Warna langit menjadi lebih biru cerah di atas awan.

### 4. Ending Scene – The Horizon
- Kamera melayang di atas laut biru luas.
- Matahari tinggi di langit, pantulan cahaya di permukaan laut.
- Angin seolah berhembus pelan, permukaan air bergelombang lembut.
- Teks tipis di bawah: `"End of Journey"`.

---

## Elemen Teknis
- **Framework:** React, @react-three/fiber, @react-three/drei
- **Kontrol Kamera:** `CameraControls` atau `useScroll`
- **Animasi:** React Spring / GSAP
- **Awan:** Mesh procedural dengan perlin noise untuk bentuk organik.
- **Air:** Plane dengan shader gelombang sederhana.
- **Efek Postprocessing:** Bloom tipis, fog putih, lens flare.

---

## Output yang Diharapkan dari Claude
1. **Kode React lengkap** (bisa langsung dijalankan di Vite atau CRA) dengan komponen modular.
2. Setup kamera, cahaya, dan kontrol scroll.
3. Empat scene sesuai alur cerita.
4. Efek visual dan warna sesuai deskripsi.
5. Komentar kode untuk menjelaskan bagian penting.

---

**Prompt Final untuk Claude:**
> Kamu adalah developer React Three Fiber ahli. Buat proyek single-page storytelling 3D berjudul **"The Journey Through the Sky"** sesuai spesifikasi di atas. Gunakan React Three Fiber, @react-three/drei, dan animasi halus dengan React Spring atau GSAP. Semua visual dibuat procedural tanpa aset gambar. Implementasikan efek cinematic seperti bloom tipis, lens flare, dan fog putih. Bagi scene menjadi 4 bagian sesuai deskripsi, dengan transisi mulus berbasis scroll. Sertakan komentar di kode dan pastikan bisa langsung dijalankan.