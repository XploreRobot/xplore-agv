import mqtt from "mqtt";
import { broadcast } from "./websocket.js";

console.log("🚀 Starting MQTT Client...");

const client = mqtt.connect(
    "mqtt://192.168.0.12:1883",
    {
        username: "emqx",
        password: "public",
        reconnectPeriod: 2000,
    }
);

// =========================================================
// MQTT CONNECT
// =========================================================
client.on("connect", () => {
    console.log("✅ MQTT Connected");

    const topics = [
        // AGV 1
        "agv1/monitor/livetrack",
        "agv1/monitor/normal",
        "agv1/monitor/alarm",
        "agv1/monitor/pid",
        // AGV 2
        "agv2/monitor/livetrack",
        "agv2/monitor/normal",
        "agv2/monitor/alarm",
        "agv2/monitor/pid"
    ];

    client.subscribe(topics, (err) => {
        if (err) {
            console.log("❌ Subscribe Error:", err);
            broadcast({ type: "mqtt_status", connected: false });
            return;
        }

        console.log("✅ Subscribe Success");
        console.log("📡 Topics:");
        topics.forEach(topic => console.log("   └─", topic));

        broadcast({ type: "mqtt_status", connected: true });
    });
});

// =========================================================
// MQTT MESSAGE
// =========================================================
client.on("message", (topic, payload) => {
    try {
        const raw = payload.toString();

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            data = raw;
        }

        // Broadcast ke React via WebSocket tanpa fungsi safety
        broadcast({
            type: "mqtt_data",
            topic: topic,
            data: data
        });

    } catch (err) {
        console.log("❌ MQTT Message Error:", err);
    }
});

// =========================================================
// MQTT ERROR, CLOSE, RECONNECT
// =========================================================
client.on("error", (err) => {
    console.log("❌ MQTT ERROR:", err.message);
    broadcast({ type: "mqtt_status", connected: false });
});

client.on("close", () => {
    console.log("🔴 MQTT Closed");
    broadcast({ type: "mqtt_status", connected: false });
});

client.on("reconnect", () => {
    console.log("🟡 MQTT Reconnecting...");
    broadcast({ type: "mqtt_status", connected: false });
});

// =========================================================
// PUBLISH CONTROL
// =========================================================
export function publishControl(topic, message) {
    if (!client.connected) {
        console.log("❌ MQTT belum connected");
        return false;
    }

    client.publish(
        topic,
        String(message),
        { qos: 0, retain: false },
        (err) => {
            if (err) {
                console.log("❌ MQTT Publish Error:", err);
            } else {
                console.log("📤 MQTT PUBLISH:", topic, "=>", String(message));
            }
        }
    );
    return true;
}

export default client;