<div align="center">
  <h1>🚀 Xplore AGV</h1>
  <h3>Fleet Management System (FMS)</h3>
  <p><em>Sistem terpusat pintar untuk pemantauan dan kendali armada Automated Guided Vehicle (AGV) secara real-time.</em></p>
</div>

---

Sistem FMS (Fleet Management System) ini dirancang untuk mengintegrasikan keandalan perangkat keras mekanik, kecepatan lalu lintas data IoT, dan antarmuka web interaktif ke dalam satu ekosistem yang mulus. Proyek ini memfasilitasi pelacakan titik koordinat presisi tinggi, pemantauan status operasional (termasuk mode *homing*), serta eksekusi kendali jarak jauh untuk multi-AGV melalui perpaduan protokol MQTT dan WebSocket.

## 👥 Tim Pengembang
Proyek ini dikembangkan melalui kolaborasi multidisiplin:
* **💻 Putri Amelia** — *Web Developer* ([putria5678@gmail.com](mailto:putria5678@gmail.com))
  Membangun sistem *frontend* interaktif, visualisasi peta 2D, *trail history*, serta *backend* jembatan komunikasi WebSocket.
* **⚙️ Faisal** — *Mechanic*
  Merancang arsitektur mekanis, sasis, sistem penggerak (aktuator), dan integrasi komponen fisik pada robot AGV agar dapat bermanuver presisi di lapangan.
* **📡 Zaidan** — *Data Communication*
  Mengelola arsitektur telemetri IoT, memastikan stabilitas transmisi data sensor/odometri dari mikrokontroler (ESP32/PLC) ke MQTT Broker tanpa hambatan (*low-latency*).

---

## ✨ Fitur Utama

* 🎯 **Live AGV Tracking** 
  Pemantauan posisi visual secara *real-time* untuk armada robot (AGV-01 dan AGV-02) di atas peta antarmuka.
* 🗺️ **Interactive Map System** 
  Peta jalur kustom berukuran ~190 × 152 cm dengan fitur navigasi *Pan / Drag* visual yang intuitif tanpa mengubah data koordinat absolut mikrokontroler.
* 🛤️ **Trail History** 
  Visualisasi *real-time* berupa garis jejak (*trail*) dinamis yang merekam rute pergerakan yang telah dilewati oleh setiap unit AGV.
* 📊 **Telemetry & Homing Status** 
  Pemantauan langsung titik koordinat (X, Y) dalam satuan milimeter, arah hadap (*heading* / theta), dan deteksi otomatis saat AGV mengaktifkan mode *Homing* untuk kembali ke pangkalan.
* ⚡ **Real-time Communication** 
  Sinkronisasi penuh dengan broker MQTT untuk komunikasi tingkat *hardware* dan WebSocket untuk mendistribusikan pembaruan data secara instan ke *dashboard* React.
* 🎮 **Centralized Control** 
  Pusat kendali operasional langsung dari web (Maju, Mundur, *Emergency Stop*, *Continue*, *Home*, kalibrasi sensor, dan pengaturan parameter PID).

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
| :--- | :--- |
| **Frontend UI/UX** | React.js, Vite, Vanilla CSS, HTML5/SVG (Peta & Kendaraan) |
| **Backend & Bridge** | Node.js, `mqtt.js` (Klien MQTT), `ws` (Server WebSocket) |
| **IoT & Komunikasi** | EMQX (MQTT Broker), JSON Payload |
| **Version Control** | Git & GitHub |

---

## 📡 Arsitektur Sistem & Alur Data

Sistem ini menjembatani hasil rancangan mekanik Faisal dan jalur komunikasi data Zaidan ke dalam *dashboard* visual Putri Amelia. Alur datanya beroperasi dua arah:

> `AGV (Sensor & Mekanik) ↔ MQTT Broker ↔ Node.js Backend ↔ WebSocket ↔ React Web UI`

### 📋 Topik MQTT yang Digunakan

**Monitor (Subscribe dari AGV ke Web):**
* `agv1/monitor/livetrack`, `agv2/monitor/livetrack` *(Data koordinat X, Y, Theta)*
* `agv1/monitor/normal`, `agv2/monitor/normal` *(Status state mesin)*
* `agv1/monitor/alarm`, `agv2/monitor/alarm` *(Notifikasi error/kendala)*
* `agv1/monitor/pid`, `agv2/monitor/pid` *(Data telemetri kendali motor)*

**Control (Publish dari Web ke AGV):**
* `agv[1/2]/control/home` *(Siklus Push-button Home-Porting)*
* `agv[1/2]/control/emergency` *(Sinyal henti darurat seketika)*
* `agv[1/2]/control/continue` *(Sinyal melanjutkan rute aman)*
* `agv[1/2]/control/forward`, `agv[1/2]/control/reverse` *(Kendali gerak manual)*
* `agv[1/2]/control/sens`, `agv[1/2]/control/del` *(Kalibrasi parameter AGV)*

---

## 💻 Instalasi dan Penggunaan

**1. Clone Repository**
```bash
git clone [https://github.com/XploreRobot/xplore-agv.git](https://github.com/XploreRobot/xplore-agv.git)
cd xplore-agv