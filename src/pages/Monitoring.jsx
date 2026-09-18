import { useState } from "react";
import Layout from "../components/Layout";
import useRealtime from "../hooks/useRealtime";
import "../styles/monitoring.css";

/* =========================================================
   PID / FMS SENSOR CHART
   Sensor0 - Sensor7 = BAR
   Ref0 = HORIZONTAL LIMIT LINE
========================================================= */
function PIDSensorChart({ pid = {}, agvName = "AGV" }) {
    const [hoveredSensor, setHoveredSensor] = useState(null);

    const sensors = Array.from({ length: 8 }, (_, index) => ({
        key: `Sensor${index}`,
        label: `Sensor${index}`,
        value: Number(pid[`Sensor${index}`] ?? 0)
    }));

    const ref0 = Number(pid.Ref0 ?? 0);
    const rawMax = Math.max(ref0, ...sensors.map((sensor) => sensor.value), 1);
    const maxValue = Math.ceil(rawMax / 50) * 50 || 50;

    const chartTop = 30;
    const chartBottom = 275;
    const chartLeft = 82;
    const chartRight = 1160;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;
    const slotWidth = chartWidth / 8;
    const barWidth = 62;

    const refY = chartBottom - (ref0 / maxValue) * chartHeight;
    const gridSteps = 5;

    const tooltip = hoveredSensor !== null ? sensors[hoveredSensor] : null;

    return (
        <div className="monitor-card full-width pid-chart-wrapper">
            <div className="pid-chart-header">
                <div className="pid-chart-title-group">
                    <div className="pid-chart-icon">◈</div>
                    <div>
                        <h3>{agvName} — PID / FMS SENSOR</h3>
                        <p>Real-time sensor reading terhadap Ref0</p>
                    </div>
                </div>

                <div className="pid-ref-value">
                    <span>REFERENCE</span>
                    <strong>{Number.isFinite(ref0) ? ref0 : "--"}</strong>
                </div>
            </div>

            <div className="pid-chart">
                <svg className="pid-chart-svg" viewBox="0 0 1200 330" preserveAspectRatio="xMidYMid meet">
                    {/* Horizontal Grid */}
                    {Array.from({ length: gridSteps + 1 }, (_, index) => {
                        const value = (maxValue / gridSteps) * index;
                        const y = chartBottom - (value / maxValue) * chartHeight;
                        return (
                            <g key={`grid-${index}`}>
                                <line x1={chartLeft} y1={y} x2={chartRight} y2={y} className="pid-grid-line" />
                                <text x={chartLeft - 12} y={y + 4} textAnchor="end" className="pid-y-label">
                                    {Math.round(value)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Axes */}
                    <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} className="pid-axis" />
                    <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} className="pid-axis" />

                    {/* Ref0 Limit */}
                    <line
                        x1={chartLeft}
                        y1={Math.max(chartTop, Math.min(chartBottom, refY))}
                        x2={chartRight}
                        y2={Math.max(chartTop, Math.min(chartBottom, refY))}
                        className="pid-ref-line"
                    />
                    <rect
                        x={chartRight - 96}
                        y={Math.max(chartTop + 5, Math.min(chartBottom - 27, refY - 11))}
                        width="90"
                        height="22"
                        rx="11"
                        className="pid-ref-pill"
                    />
                    <text
                        x={chartRight - 51}
                        y={Math.max(chartTop + 20, Math.min(chartBottom - 10, refY + 4))}
                        textAnchor="middle"
                        className="pid-ref-label"
                    >
                        REF {ref0}
                    </text>

                    {/* Bars */}
                    {sensors.map((sensor, index) => {
                        const x = chartLeft + index * slotWidth + (slotWidth - barWidth) / 2;
                        const barHeight = Math.max(sensor.value > 0 ? 3 : 0, (sensor.value / maxValue) * chartHeight);
                        const y = chartBottom - barHeight;
                        const isHovered = hoveredSensor === index;

                        return (
                            <g
                                key={sensor.key}
                                className={`pid-bar-group ${isHovered ? "is-hovered" : ""}`}
                                onMouseEnter={() => setHoveredSensor(index)}
                                onMouseLeave={() => setHoveredSensor(null)}
                            >
                                <rect x={x - 9} y={chartTop} width={barWidth + 18} height={chartHeight} rx="8" className="pid-hover-zone" />
                                <rect x={x} y={y} width={barWidth} height={barHeight} rx="7" className="pid-bar" />
                                <text x={x + barWidth / 2} y={Math.max(y - 10, chartTop + 16)} textAnchor="middle" className="pid-bar-value">
                                    {sensor.value}
                                </text>
                                <text x={x + barWidth / 2} y="306" textAnchor="middle" className="pid-x-label">
                                    {sensor.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {tooltip && (
                    <div className="pid-tooltip" style={{ left: `${((hoveredSensor + 0.5) / sensors.length) * 100}%` }}>
                        <span>{tooltip.label}</span>
                        <strong>{tooltip.value}</strong>
                        <small>sensor reading</small>
                    </div>
                )}
            </div>

            <div className="pid-chart-footer">
                <div className="pid-chart-legend">
                    <span><i className="pid-legend-bar"></i> Sensor Value</span>
                    <span><i className="pid-legend-line"></i> Ref0 / Limit</span>
                </div>
                <span className="pid-hover-hint">Hover bar untuk melihat nilai</span>
            </div>
        </div>
    );
}

/* =========================================================
   MAIN MONITORING COMPONENT
========================================================= */
export default function Monitoring() {
    const realtime = useRealtime();

    // =========================================================
    // AGV-01 DATA
    // =========================================================
    const agv01 = realtime.agv01 || {};
    const normal01 = agv01.normal || {};
    const tracking01 = agv01.tracking || {};
    const pid01 = agv01.pid || {};

    // =========================================================
    // AGV-02 DATA
    // =========================================================
    const agv02 = realtime.agv02 || {};
    const normal02 = agv02.normal || {};
    const tracking02 = agv02.tracking || {};
    const pid02 = agv02.pid || {};

    // =========================================================
    // HELPERS
    // =========================================================
    const formatValue = (value, fallback = "--") => {
        if (value === undefined || value === null || value === "") return fallback;
        return value;
    };

    const getMode = (data) => {
        if (data.sby === true) return "STANDBY";
        if (data.sby === false) return "RUNNING";
        return "--";
    };

    const getConveyorMode = (data) => {
        if (data.confor === true) return "FORWARD";
        if (data.conrev === true) return "REVERSE";
        return "STOPPED";
    };

    const getSensorClass = (value) => (value ? "connected" : "disconnected");

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <Layout>
            <div className="monitoring-page">

                {/* PAGE HEADER */}
                <div className="page-header">
                    <h1>AGV Monitoring</h1>
                    <p>Real-time monitoring of AGV system status.</p>
                </div>

                {/* =====================================================
                    AGV-01 SECTION
                ===================================================== */}
                <div className="agv-divider">
                    <div className="agv-divider-line"></div>
                    <div className="agv-divider-content">
                        <span className="agv-divider-title">AGV-01</span>
                        <span className="agv-divider-topic">agv1/monitor</span>
                    </div>
                    <div className="agv-divider-line"></div>
                </div>

                <div className="monitoring-grid">
                    {/* AGV INFO */}
                    <div className="monitor-card">
                        <h2>AGV INFORMATION</h2>
                        <div className="info-row">
                            <span>Mode</span>
                            <span className={`badge ${normal01.sby === true ? "loading" : "running"}`}>
                                {getMode(normal01)}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Speed</span>
                            <span>{formatValue(normal01.BASEPWM)} PWM</span>
                        </div>
                        <div className="info-row">
                            <span>Conveyor Mode</span>
                            <span className={`badge ${normal01.confor || normal01.conrev ? "loading" : "disconnected"}`}>
                                {getConveyorMode(normal01)}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Item Count</span>
                            <span>{formatValue(normal01.cnt)}</span>
                        </div>
                        <div className="info-row">
                            <span>Item Limit</span>
                            <span>{formatValue(normal01.lmt)}</span>
                        </div>
                        <div className="info-row">
                            <span>AGV Position</span>
                            <span>X: {formatValue(tracking01.posX)} Y: {formatValue(tracking01.posY)}</span>
                        </div>
                        <div className="info-row">
                            <span>AGV State</span>
                            <span>{formatValue(normal01.agv)}</span>
                        </div>
                    </div>

                    {/* MCU WIFI */}
                    <div className="monitor-card">
                        <h2>MCU WIFI</h2>
                        <div className="info-row">
                            <span>IP Address</span>
                            <span>{formatValue(normal01.ip)}</span>
                        </div>
                        <div className="info-row">
                            <span>WiFi Status</span>
                            <span className={`badge ${normal01.ip ? "connected" : "disconnected"}`}>
                                {normal01.ip ? "CONNECTED" : "DISCONNECTED"}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>RSSI</span>
                            <span>{normal01.rssi !== undefined ? `${normal01.rssi} dBm` : "--"}</span>
                        </div>
                    </div>

                    {/* PHOTOELECTRIC SENSOR */}
                    <div className="monitor-card">
                        <h2>PHOTOELECTRIC SENSOR</h2>
                        <div className="info-row">
                            <span>PE-1</span>
                            <span className={`badge ${getSensorClass(normal01.pe1)}`}>{normal01.pe1 ? "ON" : "OFF"}</span>
                        </div>
                        <div className="info-row">
                            <span>PE-2</span>
                            <span className={`badge ${getSensorClass(normal01.pe2)}`}>{normal01.pe2 ? "ON" : "OFF"}</span>
                        </div>
                        <div className="info-row">
                            <span>PE-3</span>
                            <span className={`badge ${getSensorClass(normal01.pe3)}`}>{normal01.pe3 ? "ON" : "OFF"}</span>
                        </div>
                        <div className="info-row">
                            <span>PE-4</span>
                            <span className={`badge ${getSensorClass(normal01.pe4)}`}>{normal01.pe4 ? "ON" : "OFF"}</span>
                        </div>
                    </div>

                    {/* MCU MEMORY */}
                    <div className="monitor-card">
                        <h2>MCU MEMORY</h2>
                        <div className="info-row">
                            <span>Current Heap</span>
                            <span>{normal01.ram !== undefined ? `${normal01.ram} Bytes` : "--"}</span>
                        </div>
                    </div>

                    {/* AGV ALARM */}
                    <div className="monitor-card full-width">
                        <h2>AGV ALARM</h2>
                        <div className="info-row">
                            <span>Lane Status</span>
                            <span className="badge connected">NORMAL</span>
                        </div>
                        <div className="info-row">
                            <span>Obstacle</span>
                            <span className={`badge ${normal01.pe1 || normal01.pe2 ? "disconnected" : "connected"}`}>
                                {normal01.pe1 || normal01.pe2 ? "DETECTED" : "NORMAL"}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Conveyor</span>
                            <span className={`badge ${normal01.confor || normal01.conrev ? "loading" : "connected"}`}>
                                {normal01.confor ? "FORWARD" : normal01.conrev ? "REVERSE" : "NORMAL"}
                            </span>
                        </div>
                    </div>
                </div>

                <PIDSensorChart pid={pid01} agvName="AGV-01" />

                <div className="agv-section-gap"></div>

                {/* =====================================================
                    AGV-02 SECTION
                ===================================================== */}
                <div className="agv-divider">
                    <div className="agv-divider-line"></div>
                    <div className="agv-divider-content">
                        <span className="agv-divider-title">AGV-02</span>
                        <span className="agv-divider-topic">agv2/monitor</span>
                    </div>
                    <div className="agv-divider-line"></div>
                </div>

                <div className="monitoring-grid">
                    {/* AGV INFO */}
                    <div className="monitor-card">
                        <h2>AGV INFORMATION</h2>
                        <div className="info-row">
                            <span>Mode</span>
                            <span className={`badge ${normal02.sby === true ? "loading" : "running"}`}>
                                {getMode(normal02)}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Speed</span>
                            <span>{formatValue(normal02.BASEPWM)} PWM</span>
                        </div>
                        <div className="info-row">
                            <span>Conveyor Mode</span>
                            <span className={`badge ${normal02.confor || normal02.conrev ? "loading" : "disconnected"}`}>
                                {getConveyorMode(normal02)}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Item Count</span>
                            <span>{formatValue(normal02.cnt)}</span>
                        </div>
                        <div className="info-row">
                            <span>Item Limit</span>
                            <span>{formatValue(normal02.lmt)}</span>
                        </div>
                        <div className="info-row">
                            <span>AGV Position</span>
                            <span>X: {formatValue(tracking02.posX)} Y: {formatValue(tracking02.posY)}</span>
                        </div>
                        <div className="info-row">
                            <span>AGV State</span>
                            <span>{formatValue(normal02.agv)}</span>
                        </div>
                    </div>

                    {/* MCU WIFI */}
                    <div className="monitor-card">
                        <h2>MCU WIFI</h2>
                        <div className="info-row">
                            <span>IP Address</span>
                            <span>{formatValue(normal02.ip)}</span>
                        </div>
                        <div className="info-row">
                            <span>WiFi Status</span>
                            <span className={`badge ${normal02.ip ? "connected" : "disconnected"}`}>
                                {normal02.ip ? "CONNECTED" : "DISCONNECTED"}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>RSSI</span>
                            <span>{normal02.rssi !== undefined ? `${normal02.rssi} dBm` : "--"}</span>
                        </div>
                    </div>

                    {/* PHOTOELECTRIC SENSOR */}
                    <div className="monitor-card">
                        <h2>PHOTOELECTRIC SENSOR</h2>
                        <div className="info-row">
                            <span>PE-1</span>
                            <span className={`badge ${getSensorClass(normal02.pe1)}`}>{normal02.pe1 ? "ON" : "OFF"}</span>
                        </div>
                        <div className="info-row">
                            <span>PE-2</span>
                            <span className={`badge ${getSensorClass(normal02.pe2)}`}>{normal02.pe2 ? "ON" : "OFF"}</span>
                        </div>
                        <div className="info-row">
                            <span>PE-3</span>
                            <span className={`badge ${getSensorClass(normal02.pe3)}`}>{normal02.pe3 ? "ON" : "OFF"}</span>
                        </div>
                        <div className="info-row">
                            <span>PE-4</span>
                            <span className={`badge ${getSensorClass(normal02.pe4)}`}>{normal02.pe4 ? "ON" : "OFF"}</span>
                        </div>
                    </div>

                    {/* MCU MEMORY */}
                    <div className="monitor-card">
                        <h2>MCU MEMORY</h2>
                        <div className="info-row">
                            <span>Current Heap</span>
                            <span>{normal02.ram !== undefined ? `${normal02.ram} Bytes` : "--"}</span>
                        </div>
                    </div>

                    {/* AGV ALARM */}
                    <div className="monitor-card full-width">
                        <h2>AGV ALARM</h2>
                        <div className="info-row">
                            <span>Lane Status</span>
                            <span className="badge connected">NORMAL</span>
                        </div>
                        <div className="info-row">
                            <span>Obstacle</span>
                            <span className={`badge ${normal02.pe1 || normal02.pe2 ? "disconnected" : "connected"}`}>
                                {normal02.pe1 || normal02.pe2 ? "DETECTED" : "NORMAL"}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Conveyor</span>
                            <span className={`badge ${normal02.confor || normal02.conrev ? "loading" : "connected"}`}>
                                {normal02.confor ? "FORWARD" : normal02.conrev ? "REVERSE" : "NORMAL"}
                            </span>
                        </div>
                    </div>
                </div>

                <PIDSensorChart pid={pid02} agvName="AGV-02" />

            </div>
        </Layout>
    );
}