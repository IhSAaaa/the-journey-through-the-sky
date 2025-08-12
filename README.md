# The Journey Through the Sky

Sebuah pengalaman storytelling 3D interaktif yang dibuat dengan React Three Fiber, menggambarkan perjalanan melalui pemandangan alam yang indah dari lembah hijau hingga lautan biru.

## 🌟 Fitur

- **4 Scene Berbeda**: Valley, Mountains, Clouds, dan Ocean
- **Kontrol Scroll**: Navigasi melalui scene dengan scroll halus
- **Animasi Procedural**: Semua elemen dibuat secara procedural tanpa aset gambar
- **Efek Visual**: Bloom, fog, lens flare, dan volumetric lighting
- **Responsive Design**: Optimized untuk berbagai ukuran layar

## 🚀 Instalasi

1. **Clone atau download proyek ini**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```

4. **Buka browser** dan akses `http://localhost:3002`

## 🎮 Cara Menggunakan

- **Scroll** untuk memulai perjalanan melalui 4 scene berbeda
- Nikmati transisi halus antar scene
- Perhatikan detail visual seperti:
  - Burung terbang di lembah
  - Efek parallax di pegunungan
  - Volumetric light di awan
  - Gelombang air di lautan

## 🛠️ Teknologi yang Digunakan

- **React 18** - Framework utama
- **React Three Fiber** - 3D rendering dengan Three.js
- **@react-three/drei** - Helper components untuk R3F
- **@react-three/postprocessing** - Post-processing effects
- **React Spring** - Animasi halus
- **Vite** - Build tool dan development server

## 📁 Struktur Proyek

```
src/
├── components/
│   ├── elements/
│   │   ├── Sun.jsx          # Komponen matahari
│   │   └── Birds.jsx        # Komponen burung terbang
│   ├── scenes/
│   │   ├── Valley.jsx       # Scene 1: Lembah hijau
│   │   ├── Mountains.jsx    # Scene 2: Pegunungan
│   │   ├── Clouds.jsx       # Scene 3: Awan
│   │   └── Ocean.jsx        # Scene 4: Lautan
│   ├── CameraController.jsx # Kontrol kamera
│   ├── LoadingScreen.jsx    # Loading screen
│   ├── Scene.jsx           # Scene utama
│   └── StoryText.jsx       # Teks cerita
├── App.jsx                 # Komponen utama
└── main.jsx               # Entry point
```

## 🎨 Scene Details

### 1. Valley (Lembah)
- Terrain hijau dengan variasi ketinggian
- Pohon-pohon procedural dengan animasi goyang
- Batu-batuan dan rumput
- Burung terbang di latar belakang

### 2. Mountains (Pegunungan)
- 3 layer pegunungan dengan efek parallax
- Puncak bersalju
- Kabut tipis di antara gunung
- Detail bebatuan

### 3. Clouds (Awan)
- Awan procedural dengan bentuk organik
- Volumetric light rays
- God rays effect
- Partikel atmosfer

### 4. Ocean (Lautan)
- Permukaan air dengan gelombang animasi
- Pantulan matahari di air
- Pulau-pulau di kejauhan
- Burung camar

## 🔧 Kustomisasi

Anda dapat mengkustomisasi berbagai aspek:

- **Warna**: Edit material colors di setiap scene component
- **Animasi**: Sesuaikan speed dan amplitude di useFrame hooks
- **Geometri**: Modifikasi parameter geometry untuk bentuk berbeda
- **Lighting**: Ubah intensitas dan posisi cahaya di Scene.jsx

## 📱 Performance

- Optimized untuk 60 FPS pada device modern
- LOD (Level of Detail) untuk objek jauh
- Efficient geometry dengan vertex count yang sesuai
- Post-processing effects yang ringan

## 🐛 Troubleshooting

**Jika aplikasi tidak berjalan:**
1. Pastikan Node.js versi 16+ terinstall
2. Hapus `node_modules` dan jalankan `npm install` ulang
3. Pastikan port 3002 tidak digunakan aplikasi lain

**Jika performance lambat:**
1. Tutup tab browser lain
2. Pastikan hardware acceleration aktif di browser
3. Gunakan browser modern (Chrome, Firefox, Safari)

## 📄 License

MIT License - Bebas digunakan untuk proyek personal dan komersial.

---

**Selamat menikmati perjalanan melalui langit! ✈️**