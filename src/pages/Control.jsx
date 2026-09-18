import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import "../styles/control.css";

export default function Control() {
    // =====================================================
    // REFS
    // =====================================================
    const ws = useRef(null);
    const consoleEndRef = useRef(null);

    // =====================================================
    // STATES
    // =====================================================
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [mqttConnected, setMqttConnected] = useState(false);
    const [selectedAgv, setSelectedAgv] = useState("agv1");
    const [conveyorMode, setConveyorMode] = useState("stop");
    const [itemLimit, setItemLimit] = useState("");
    const [selectedPort, setSelectedPort] = useState(1);
    const [pid, setPid] = useState({
        setpoint: "",
        p: "",
        i: "",
        d: "",
        sens: ""
    });

    // =====================================================
    // EFFECTS
    // =====================================================
    // Auto-scroll console
    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [consoleLogs]);

    // WebSocket Connection
    useEffect(() => {
        console.log("🔌 Connecting WebSocket...");
        const socket = new WebSocket("ws://localhost:1234");
        ws.current = socket;

        socket.onopen = () => {
            console.log("✅ Control WebSocket Connected");
            setWsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📨 WebSocket Message:", data);

                if (data.type === "mqtt_status") {
                    setMqttConnected(data.connected === true);
                }
                if (data.type === "mqtt_data") {
                    console.log("📡 MQTT DATA:", data);
                }
                if (data.type === "control_result") {
                    console.log("✅ Control Result:", data);
                }
                if (data.type === "control_error") {
                    console.error("❌ Control Error:", data);
                    alert(data.message || "Gagal mengirim control.");
                }
            } catch {
                console.log("📨 WebSocket:", event.data);
            }
        };

        socket.onclose = () => {
            console.log("🔴 Control WebSocket Closed");
            setWsConnected(false);
            setMqttConnected(false);
        };

        socket.onerror = (error) => {
            console.log("❌ Control WebSocket Error:", error);
            setWsConnected(false);
        };

        return () => {
            socket.close();
        };
    }, []);

    // =====================================================
    // CONSOLE FUNCTIONS
    // =====================================================
    const addConsoleLog = (topic, value) => {
        const now = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const newLog = {
            id: Date.now() + Math.random(),
            time: now,
            agv: selectedAgv,
            topic: topic,
            value: String(value)
        };

        setConsoleLogs((prev) => [...prev, newLog]);
    };

    const clearConsole = () => setConsoleLogs([]);

    // =====================================================
    // PUBLISH FUNCTION
    // =====================================================
    const publish = (control, value) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.log("❌ WebSocket belum terhubung");
            alert("WebSocket belum terhubung!");
            return;
        }

        const topic = `${selectedAgv}/control/${control}`;
        const payload = {
            type: "control",
            agv: selectedAgv,
            topic: topic,
            message: String(value)
        };

        console.log("📤 CONTROL:", payload);
        ws.current.send(JSON.stringify(payload));
        console.log("📤 WebSocket SEND:", payload);

        addConsoleLog(topic, value);
    };

    // =====================================================
    // HANDLERS
    // =====================================================
    const handleAgvChange = (agv) => {
        setSelectedAgv(agv);
        setConveyorMode("stop");
        console.log("🚗 Selected:", agv);
    };

    const handleReset = () => publish("reset", 1);
    const handleContinue = () => publish("continue", 1);
    const handleHome = () => publish("home", 1);
    const handleWork = () => publish("work", 1);
    const handleEmergency = () => publish("emergency", 1);

    const handleSaveItemLimit = () => {
        if (itemLimit === "") {
            alert("Masukkan Item Limit terlebih dahulu!");
            return;
        }
        publish("itemlimit", Number(itemLimit));
    };

    const handlePortChange = (port) => {
        setSelectedPort(port);
        publish("port", port);
        console.log("🔌 RETURN PORT:", selectedAgv, "=>", port);
    };

    const handleConveyor = (mode) => {
        console.log("=================================");
        console.log("🎮 CONVEYOR CONTROL");
        console.log("AGV :", selectedAgv);
        console.log("MODE :", mode);
        console.log("=================================");

        if (mode === "forward") {
            if (conveyorMode === "forward") {
                setConveyorMode("stop");
                publish("forward", 0);
                publish("reverse", 0);
                return;
            }
            setConveyorMode("forward");
            publish("forward", 1);
            publish("reverse", 0);
            return;
        }

        if (mode === "reverse") {
            if (conveyorMode === "reverse") {
                setConveyorMode("stop");
                publish("forward", 0);
                publish("reverse", 0);
                return;
            }
            setConveyorMode("reverse");
            publish("forward", 0);
            publish("reverse", 1);
            return;
        }

        if (mode === "stop") {
            setConveyorMode("stop");
            publish("forward", 0);
            publish("reverse", 0);
        }
    };

    const handleChange = (e) => {
        setPid((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSavePID = () => {
        if (pid.setpoint !== "") publish("rpm", Number(pid.setpoint));
        if (pid.p !== "") publish("pel", Number(pid.p));
        if (pid.i !== "") publish("iel", Number(pid.i));
        if (pid.d !== "") publish("del", Number(pid.d));
        if (pid.sens !== "") publish("sens", Number(pid.sens));
        
        console.log("⚙️ PID:", pid);
    };

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <Layout>
            <div className="control-page">
                {/* HEADER */}
                <div className="page-header">
                    <h1>AGV Control Panel</h1>
                    <p>Manual Control & PID Configuration</p>
                </div>

                {/* AGV SELECTOR */}
                <div className="control-card agv-selector-card">
                    <h2>Select AGV</h2>
                    <div className="agv-buttons">
                        <button
                            type="button"
                            className={`agv-select-btn ${selectedAgv === "agv1" ? "selected" : ""}`}
                            onClick={() => handleAgvChange("agv1")}
                        >
                            AGV-01
                        </button>
                        <button
                            type="button"
                            className={`agv-select-btn ${selectedAgv === "agv2" ? "selected" : ""}`}
                            onClick={() => handleAgvChange("agv2")}
                        >
                            AGV-02
                        </button>
                    </div>

                    <div className="connection-status">
                        <span>
                            Controlling: <strong>{selectedAgv === "agv1" ? "AGV-01" : "AGV-02"}</strong>
                        </span>
                        <span className="status-divider">|</span>
                        <span className="mqtt-status">
                            <span className={`status-dot ${mqttConnected ? "connected" : "disconnected"}`} />
                            {mqttConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="control-grid">
                    
                    {/* BASIC CONTROL CARD */}
                    <div className="control-card basic-control-card">
                        <h2>Basic Control</h2>
                        
                        <div className="small-control-grid">
                            <button type="button" className="btn save small-btn" onClick={handleReset}>RESET</button>
                            <button type="button" className="btn save small-btn" onClick={handleContinue}>CONTINUE</button>
                            <button type="button" className="btn save small-btn" onClick={handleHome}>HOME</button>
                            <button type="button" className="btn save small-btn" onClick={handleWork}>WORK</button>
                        </div>

                        <button type="button" className="btn emergency" onClick={handleEmergency}>
                            EMERGENCY STOP
                        </button>

                        {/* ITEM LIMIT */}
                        <div className="item-limit">
                            <h3>Item Limit</h3>
                            <input
                                type="number"
                                placeholder="Enter Item Limit"
                                value={itemLimit}
                                onChange={(e) => setItemLimit(e.target.value)}
                            />
                            <button type="button" className="btn save" onClick={handleSaveItemLimit}>
                                Save Item Limit
                            </button>
                        </div>

                        {/* MANUAL CONVEYOR */}
                        <div className="manual-conveyor">
                            <h3>Manual Conveyor</h3>
                            <div className="rotary-wrapper">
                                <button
                                    type="button"
                                    className={`rotary-label ${conveyorMode === "forward" ? "active" : ""}`}
                                    onMouseDown={() => handleConveyor("forward")}
                                    onMouseUp={() => handleConveyor("stop")}
                                    onMouseLeave={() => handleConveyor("stop")}
                                    onTouchStart={(e) => { e.preventDefault(); handleConveyor("forward"); }}
                                    onTouchEnd={(e) => { e.preventDefault(); handleConveyor("stop"); }}
                                >
                                    ▲ Forward
                                </button>

                                <div className="rotary-switch">
                                    <div className={`rotary-knob ${conveyorMode}`}>
                                        <div className="rotary-pointer"></div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={`rotary-label ${conveyorMode === "reverse" ? "active" : ""}`}
                                    onMouseDown={() => handleConveyor("reverse")}
                                    onMouseUp={() => handleConveyor("stop")}
                                    onMouseLeave={() => handleConveyor("stop")}
                                    onTouchStart={(e) => { e.preventDefault(); handleConveyor("reverse"); }}
                                    onTouchEnd={(e) => { e.preventDefault(); handleConveyor("stop"); }}
                                >
                                    ▼ Reverse
                                </button>
                            </div>
                        </div>

                        {/* CONTROL CONSOLE */}
                        <div className="control-console">
                            <div className="console-header">
                                <span>Control Console</span>
                                <button type="button" className="console-clear-btn" onClick={clearConsole}>
                                    CLEAR
                                </button>
                            </div>
                            <div className="console-body">
                                {consoleLogs.length === 0 ? (
                                    <div className="console-empty">Waiting for control command...</div>
                                ) : (
                                    consoleLogs.map((log) => (
                                        <div className="console-line" key={log.id}>
                                            <span className="console-time">[{log.time}]</span>
                                            <span className="console-agv">{log.agv.toUpperCase()}</span>
                                            <span className="console-topic">{log.topic}</span>
                                            <span className="console-arrow">→</span>
                                            <span className="console-value">{log.value}</span>
                                        </div>
                                    ))
                                )}
                                <div ref={consoleEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* RETURN PORT CARD */}
                    <div className="control-card port-card">
                        <h2>Return Port</h2>
                        <p className="port-description">Select port untuk jalur pulang robot AGV.</p>
                        <div className="port-buttons">
                            {[1, 2, 3].map((port) => (
                                <button
                                    key={port}
                                    type="button"
                                    className={`port-btn ${selectedPort === port ? "selected" : ""}`}
                                    onClick={() => handlePortChange(port)}
                                >
                                    PORT {port}
                                </button>
                            ))}
                        </div>
                        <div className="port-current">
                            Current Port: <strong>PORT {selectedPort}</strong>
                        </div>
                    </div>

                    {/* PID CONFIGURATION CARD */}
                    <div className="control-card pid-card">
                        <h2>PID Configuration</h2>

                        <label>RPM</label>
                        <input
                            type="number"
                            name="setpoint"
                            value={pid.setpoint}
                            onChange={handleChange}
                            placeholder="Enter Speed Setpoint"
                        />

                        <label>P Gain</label>
                        <input
                            type="number"
                            name="p"
                            value={pid.p}
                            onChange={handleChange}
                            placeholder="Enter P Gain"
                        />

                        <label>I Gain</label>
                        <input
                            type="number"
                            name="i"
                            value={pid.i}
                            onChange={handleChange}
                            placeholder="Enter I Gain"
                        />

                        <label>D Gain</label>
                        <input
                            type="number"
                            name="d"
                            value={pid.d}
                            onChange={handleChange}
                            placeholder="Enter D Gain"
                        />

                        <label>Line Sensor Sensitivity</label>
                        <input
                            type="number"
                            name="sens"
                            value={pid.sens}
                            onChange={handleChange}
                            placeholder="Enter Sensor Sensitivity"
                        />

                        <button type="button" className="btn save" onClick={handleSavePID}>
                            Save PID Configuration
                        </button>
                    </div>

                </div>
            </div>
        </Layout>
    );
}