# Xplore AGV - Fleet Management System (FMS)

Sistem FMS (Fleet Management System) terpusat untuk memonitor dan mengontrol armada Automated Guided Vehicle (AGV) secara *real-time*. Proyek ini menyediakan antarmuka interaktif berbasis web untuk melacak posisi koordinat, memantau status operasional (termasuk mode *homing*), dan mengendalikan pergerakan AGV melalui protokol MQTT dan WebSocket.

**Pengembang Utama (Web Developer):** [Putri Amelia](mailto:putria5678@gmail.com)

---

## 🚀 Fitur Utama

* **Live AGV Tracking:** Pemantauan posisi visual secara *real-time* untuk multi-AGV (AGV-01 dan AGV-02) di atas peta interaktif.
* **Interactive Map System:** Peta jalur kustom berukuran ~190 × 152 cm dengan fitur navigasi *Pan / Drag* visual tanpa mengubah data koordinat absolut.
* **Trail History:** Fitur rekam jejak (*trail/history*) yang menampilkan visualisasi garis rute yang telah dilewati oleh setiap AGV.
* **Telemetry & Homing Status:** Pemantauan langsung titik koordinat (X, Y) dalam satuan milimeter, arah (*heading* / theta), dan deteksi otomatis saat AGV memasuki mode *Homing*.
* **Real-time Communication:** Terintegrasi penuh dengan broker MQTT untuk komunikasi ke *hardware* (ESP32/PLC) dan WebSocket untuk mendistribusikan pembaruan data secara instan ke antarmuka React.
* **Centralized Control:** Pengiriman perintah kontrol operasional langsung dari web (Maju, Mundur, *Emergency Stop*, *Continue*, *Home*, pengaturan sensor, dll).

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, HTML5/SVG (untuk *rendering* peta dan AGV), Vanilla CSS.
* **Backend:** Node.js, MQTT.js (Klien MQTT), `ws` (Server WebSocket).
* **Komunikasi IoT:** MQTT Broker (EMQX), JSON Payload.
* **Version Control:** Git & GitHub.

## 📡 Arsitektur Sistem & Topik MQTT

Sistem ini menjembatani perangkat keras fisik AGV dengan *dashboard* web. Alur datanya adalah sebagai berikut:
`AGV (Sensor/Odometry) -> MQTT Broker -> Node.js Backend -> WebSocket -> React Web UI`

**Daftar Topik MQTT yang Digunakan:**
* **Monitor (Subscribe):**
  * `agv1/monitor/livetrack`, `agv2/monitor/livetrack` (Data posisi X, Y, Theta)
  * `agv1/monitor/normal`, `agv2/monitor/normal` (Status state mesin)
  * `agv1/monitor/alarm`, `agv2/monitor/alarm`
  * `agv1/monitor/pid`, `agv2/monitor/pid`
* **Control (Publish):**
  * `agv[1/2]/control/home` (Push-button *Home-Porting-Cycle*)
  * `agv[1/2]/control/emergency` (*Emergency Stop*)
  * `agv[1/2]/control/continue` (*Resume/Jalan*)
  * `agv[1/2]/control/forward`, `agv[1/2]/control/reverse`
  * `agv[1/2]/control/sens`, `agv[1/2]/control/del`

## 💻 Instalasi dan Penggunaan

1. **Clone Repository**
   ```bash
   git clone [https://github.com/XploreRobot/xplore-agv.git](https://github.com/XploreRobot/xplore-agv.git)
   cd xplore-agv