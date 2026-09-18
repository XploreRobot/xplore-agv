import { useEffect, useRef, useState } from "react";
import useRealtime from "../hooks/useRealtime";
import "../styles/livemap.css";

export default function LiveMap() {

    const realtime = useRealtime();

    // =========================================================
    // MAP PAN / DRAG
    // Hanya menggeser tampilan secara visual.
    // Koordinat track, AGV, dan MQTT TIDAK diubah.
    // =========================================================

    const [mapOffset, setMapOffset] = useState({
        x: 0,
        y: 0
    });

    const panRef = useRef({
        dragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
    });

    const handlePointerDown = (event) => {
        event.preventDefault();

        panRef.current = {
            dragging: true,
            startX: event.clientX,
            startY: event.clientY,
            offsetX: mapOffset.x,
            offsetY: mapOffset.y
        };

        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (!panRef.current.dragging) return;

        setMapOffset({
            x:
                panRef.current.offsetX +
                (event.clientX - panRef.current.startX),
            y:
                panRef.current.offsetY +
                (event.clientY - panRef.current.startY)
        });
    };

    const handlePointerUp = (event) => {
        panRef.current.dragging = false;

        try {
            event.currentTarget.releasePointerCapture?.(
                event.pointerId
            );
        } catch {
            // pointer capture sudah dilepas
        }
    };

    const handlePointerCancel = () => {
        panRef.current.dragging = false;
    };

    // =========================================================
    // DATA REALTIME AGV
    // =========================================================

    const agv01 =
        realtime.tracking?.["AGV-01"] || {};

    const agv02 =
        realtime.tracking?.["AGV-02"] || {};


    // =========================================================
    // AGV STATE
    // =========================================================

    const normal01 =
        realtime.agv01?.normal || {};

    const normal02 =
        realtime.agv02?.normal || {};

    const agvState01 =
        normal01.agv || "";

    const agvState02 =
        normal02.agv || "";

    // =========================================================
    // TRACK OFFSET
    // Geser seluruh track ke kiri agar pas dengan jalur referensi.
    // =========================================================

    const TRACK_OFFSET_X = 85;

    // =========================================================
    // ACTIVE ROUTE AGV-01
    // =========================================================

    const agv01ToStation1 =
        agvState01 === "HOME_TO_STATION_1";

    const agv01ToStation2 =
        agvState01 === "MOVING_TO_STATION_2";

    const agv01ToStation1Return =
        agvState01 === "MOVING_TO_STATION_1";

    const agv01AutoHome =
        agvState01 === "AUTO_HOME_ST1" ||
        agvState01 === "AUTO_HOME_ST1toST2" ||
        agvState01 === "AUTO_HOME_ST2" ||
        agvState01 === "AUTO_HOME_ST2toST1";

    // =========================================================
    // ACTIVE ROUTE AGV-02
    // =========================================================

    const agv02ToStation1 =
        agvState02 === "HOME_TO_STATION_1";

    const agv02ToStation2 =
        agvState02 === "MOVING_TO_STATION_2";

    const agv02ToStation1Return =
        agvState02 === "MOVING_TO_STATION_1";

    const agv02AutoHome =
        agvState02 === "AUTO_HOME_ST1" ||
        agvState02 === "AUTO_HOME_ST1toST2" ||
        agvState02 === "AUTO_HOME_ST2" ||
        agvState02 === "AUTO_HOME_ST2toST1";


    // =========================================================
    // HISTORY / TRAIL
    // =========================================================

    const [history01, setHistory01] = useState([]);
    const [history02, setHistory02] = useState([]);


    // =========================================================
    // TITIK AWAL
    //
    // AGV-01 = Belokan 1
    // AGV-02 = Belokan 2
    // Belokan 3 = kosong
    // =========================================================

    const AGV01_START = {
        x: 180,
        y: 405
    };

    const AGV02_START = {
        x: 400,
        y: 405
    };


    // =========================================================
    // KONVERSI SENSOR
    //
    // MQTT menggunakan mm
    // Map menggunakan cm
    //
    // 10 mm = 1 cm
    // =========================================================

    const SENSOR_TO_CM = 0.1;


    // =========================================================
    // SKALA MAP
    // =========================================================

    const SCALE_X = 800 / 172;
    const SCALE_Y = 420 / 152;


    // =========================================================
    // CEK DATA AGV
    // =========================================================

    const hasAgv01 =
        agv01.posX !== undefined ||
        agv01.posY !== undefined;

    const hasAgv02 =
        agv02.posX !== undefined ||
        agv02.posY !== undefined;


    // =========================================================
    // SENSOR AGV-01
    // =========================================================

    const sensorX01 =
        Number(agv01.posX ?? 0) *
        SENSOR_TO_CM;

    const sensorY01 =
        Number(agv01.posY ?? 0) *
        SENSOR_TO_CM;


    // =========================================================
    // SENSOR AGV-02
    // =========================================================

    const sensorX02 =
        Number(agv02.posX ?? 0) *
        SENSOR_TO_CM;

    const sensorY02 =
        Number(agv02.posY ?? 0) *
        SENSOR_TO_CM;


    // =========================================================
    // POSISI AGV-01
    //
    // +X sensor -> kiri
    // -X sensor -> kanan
    //
    // +Y sensor -> bawah
    // -Y sensor -> atas
    // =========================================================

    const x01 =
        AGV01_START.x +
        TRACK_OFFSET_X -
        sensorX01 * SCALE_X;

    const y01 =
        AGV01_START.y +
        sensorY01 * SCALE_Y;


    // =========================================================
    // POSISI AGV-02
    //
    // Jika belum ada data:
    // tetap di Belokan 2
    //
    // Jika data sudah ada:
    // mengikuti sensor realtime
    // =========================================================

    const x02 =
        hasAgv02
            ? AGV02_START.x +
              TRACK_OFFSET_X -
              sensorX02 * SCALE_X
            : AGV02_START.x + TRACK_OFFSET_X;

    const y02 =
        hasAgv02
            ? AGV02_START.y +
              sensorY02 * SCALE_Y
            : AGV02_START.y;


    // =========================================================
    // HEADING AGV-01
    //
    // Sensor awal = 90°
    // =========================================================

    const theta01 =
        ((180 - Number(
            agv01.thetha ?? 90
        )) + 360) % 360;


    // =========================================================
    // HEADING AGV-02
    //
    // Belum ada data:
    // 0°
    //
    // Sudah ada data:
    // realtime
    // =========================================================

    const theta02 =
        ((180 - Number(
            agv02.thetha ?? 90
        )) + 360) % 360;


    // =========================================================
    // TRAIL AGV-01
    // =========================================================

    useEffect(() => {

        if (!hasAgv01) {
            return;
        }


        const point = {
            x: x01,
            y: y01
        };


        setHistory01(prev => {

            if (prev.length > 0) {

                const last =
                    prev[prev.length - 1];


                const distance =
                    Math.hypot(
                        point.x - last.x,
                        point.y - last.y
                    );


                if (distance < 2) {
                    return prev;
                }

            }


            const next = [
                ...prev,
                point
            ];


            if (next.length > 2000) {
                next.shift();
            }


            return next;

        });

    }, [
        agv01.posX,
        agv01.posY
    ]);


    // =========================================================
    // TRAIL AGV-02
    // =========================================================

    useEffect(() => {

        if (!hasAgv02) {
            return;
        }


        const point = {
            x: x02,
            y: y02
        };


        setHistory02(prev => {

            if (prev.length > 0) {

                const last =
                    prev[prev.length - 1];


                const distance =
                    Math.hypot(
                        point.x - last.x,
                        point.y - last.y
                    );


                if (distance < 2) {
                    return prev;
                }

            }


            const next = [
                ...prev,
                point
            ];


            if (next.length > 2000) {
                next.shift();
            }


            return next;

        });

    }, [
        agv02.posX,
        agv02.posY
    ]);


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="live-map">


            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="live-map-header">

                <div>

                    <h2>
                        Live AGV Tracking
                    </h2>

                    <p>
                        Real-time Fleet Monitoring
                    </p>

                </div>


                <div className="map-status">

                    <span></span>

                    Realtime

                </div>

            </div>


            {/* =====================================================
                MAP
            ===================================================== */}

            <div
                className={`map-container ${
                    panRef.current.dragging
                        ? "map-dragging"
                        : ""
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
            >

                <svg
                    className="map-svg"
                    viewBox="-250 0 1100 650"
                    preserveAspectRatio="xMidYMid meet"
                >





                    {/* GRID DIHAPUS DARI SVG */}

                    {/* =================================================
                        DEFINITIONS
                    ================================================= */}

                    <defs>

                        <pattern
                            id="grid"
                            width="30"
                            height="30"
                            patternUnits="userSpaceOnUse"
                        >

                            <path
                                d="
                                    M30 0
                                    L0 0
                                    0 30
                                "
                                fill="none"
                                stroke="#1f2937"
                                strokeWidth="1"
                            />

                        </pattern>


                        <filter
                            id="trailGlow"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                        >

                            <feGaussianBlur
                                stdDeviation="5"
                                result="blur"
                            />

                            <feMerge>

                                <feMergeNode
                                    in="blur"
                                />

                                <feMergeNode
                                    in="SourceGraphic"
                                />

                            </feMerge>

                        </filter>

                    </defs>

                    {/* =================================================
                        PAN LAYER
                        Hanya menggeser tampilan visual.
                        Semua koordinat asli tetap sama.
                    ================================================= */}

                    <g
                        transform={`translate(${mapOffset.x} ${mapOffset.y})`}
                    >


                    {/* =================================================
                        AXIS X
                    ================================================= */}

                    <line
                        x1="-250"
                        y1="331"
                        x2="850"
                        y2="331"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="8 8"
                    />


                    {/* =================================================
                        AXIS Y
                    ================================================= */}

                    <line
                        x1="450"
                        y1="0"
                        x2="450"
                        y2="650"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="8 8"
                    />


                    {/* =================================================
                        TRACK LAYER
                        Seluruh geometry track digeser ke kiri.
                    ================================================= */}

                    <g transform={`translate(${TRACK_OFFSET_X}, 0)`}>

                    {/* =================================================
                        OUTER TRACK - TOP
                    ================================================= */}

                    <line
                        x1="-50"
                        y1="30"
                        x2="750"
                        y2="30"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        OUTER TRACK - LEFT
                    ================================================= */}

                    <line
                        x1="-50"
                        y1="30"
                        x2="-50"
                        y2="500"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        OUTER TRACK - RIGHT
                    ================================================= */}

                    <line
                        x1="750"
                        y1="30"
                        x2="750"
                        y2="470"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        LEFT SIDE EXTENSION
                    ================================================= */}

                    <line
                        x1="-85"
                        y1="360"
                        x2="-15"
                        y2="360"
                        stroke="#475569"
                        strokeWidth="22"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        MAIN HORIZONTAL TRACK
                    ================================================= */}

                    <line
                        x1="-50"
                        y1="290"
                        x2="750"
                        y2="290"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        BELOKAN 1
                        AGV-01
                    ================================================= */}

                  <path
                    d="
                        M 190 331

                        V 300

                        C 190 395
                        178 420
                        170 460

                        C 160 500
                        160 510
                        80 510

                        H 55
                    "
                    fill="none"
                    stroke="#475569"
                    strokeWidth="40"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                 {/* STATION 1 */}



                    <line

                        x1="145"

                        y1="405"

                        x2="220"

                        y2="405"

                        stroke="#475569"

                        strokeWidth="22"

                        strokeLinecap="round"

                    />


                    {/* =================================================
                        BELOKAN 2
                        AGV-02
                    ================================================= */}

                    <path
                        d="
                            M 410 331

                            V 300

                            C 410 395
                            398 420
                            390 460

                            C 380 500
                            380 510
                            300 510

                            H 300
                        "
                        fill="none"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />


                    {/* STATION 2 */}

                    <line
                        x1="365"
                        y1="405"
                        x2="435"
                        y2="405"
                        stroke="#475569"
                        strokeWidth="22"
                        strokeLinecap="round"
                    />


                   {/* =================================================
                        BELOKAN 3
                        KOSONG
                    ================================================= */}

                    <path
                            d="
                                M 630 331

                                V 300

                                C 630 395
                                618 420
                                610 460

                                C 600 500
                                600 510
                                520 510

                                H 495
                            "
                            fill="none"
                            stroke="#475569"
                            strokeWidth="40"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* STATION 3 */}
                        <line
                            x1="585"
                            y1="405"
                            x2="655"
                            y2="405"
                            stroke="#475569"
                            strokeWidth="22"
                            strokeLinecap="round"
                        />

                    {/* =================================================
                        BOTTOM TRACK
                    ================================================= */}

                    <line
                        x1="-50"
                        y1="510"
                        x2="750"
                        y2="510"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        RIGHT BOTTOM EXTENSION
                    ================================================= */}

                    <line
                        x1="750"
                        y1="470"
                        x2="750"
                        y2="550"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    <line
                        x1="730"
                        y1="550"
                        x2="770"
                        y2="550"
                        stroke="#475569"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />


                    {/* =================================================
                        ACTIVE ROUTE AGV-01
                    ================================================= */}

                    {agv01ToStation1 && (
                        <path
                            d="
                                M 190 405
                                C 190 385 190 350 190 331
                                H 410
                                C 410 350 410 385 410 405
                            "
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}

                    {agv01ToStation2 && (
                        <path
                            d="
                                M 190 405
                                C 190 385 190 350 190 331
                                H 410
                                C 410 350 410 385 410 405
                            "
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}

                    {agv01ToStation1Return && (
                        <path
                            d="
                                M 410 405
                                C 410 385 410 350 410 331
                                H 190
                                C 190 350 190 385 190 405
                            "
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}

                    {agv01AutoHome && (
                        <path
                            d="
                                M 190 405
                                C 190 385 190 350 190 331
                                H -50
                                V 60
                                H 750
                                V 470
                                H 410
                            "
                            fill="none"
                            stroke="#c49a6c"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}


                    {/* =================================================
                        ACTIVE ROUTE AGV-02
                    ================================================= */}

                    {agv02ToStation1 && (
                        <path
                            d="
                                M 410 405
                                V 470
                                H -50
                                V 60
                                H 750
                                V 470
                                H 410
                                C 410 450 410 425 410 405
                            "
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}

                    {agv02ToStation2 && (
                        <path
                            d="
                                M 410 405
                                V 470
                                H 750
                                V 60
                                H -50
                                V 280
                                H -15
                            "
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}

                    {agv02ToStation1Return && (
                        <path
                            d="
                                M 410 405
                                V 470
                                H -50
                                V 60
                                H 750
                                V 280
                            "
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}

                    {agv02AutoHome && (
                        <path
                            d="
                                M 410 405
                                V 470
                                H 750
                                V 60
                                H -50
                                V 280
                                H -15
                            "
                            fill="none"
                            stroke="#c49a6c"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                            filter="url(#trailGlow)"
                        />
                    )}


                    </g>


                    {/* =================================================
                        START POINT AGV-01
                    ================================================= */}

                    <circle
                        cx={AGV01_START.x + TRACK_OFFSET_X}
                        cy={AGV01_START.y}
                        r="6"
                        fill="#22c55e"
                        opacity="0.9"
                    />


                    {/* =================================================
                        START POINT AGV-02
                    ================================================= */}

                    <circle
                        cx={AGV02_START.x + TRACK_OFFSET_X}
                        cy={AGV02_START.y}
                        r="6"
                        fill="#22c55e"
                        opacity="0.9"
                    />


                    {/* =================================================
                        MAP ORIGIN
                    ================================================= */}

                    <circle
                        cx="450"
                        cy="331"
                        r="5"
                        fill="#22c55e"
                    />


                    <text
                        x="462"
                        y="325"
                        fill="#22c55e"
                        fontSize="14"
                    >
                        Map (0,0)
                    </text>


                    {/* =================================================
                        TRAIL AGV-01 GLOW
                    ================================================= */}

                    <polyline
                        points={
                            history01
                                .map(
                                    p =>
                                        `${p.x},${p.y}`
                                )
                                .join(" ")
                        }
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.18"
                        filter="url(#trailGlow)"
                    />


                    {/* =================================================
                        TRAIL AGV-01
                    ================================================= */}

                    <polyline
                        points={
                            history01
                                .map(
                                    p =>
                                        `${p.x},${p.y}`
                                )
                                .join(" ")
                        }
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                    />


                    {/* =================================================
                        TRAIL AGV-02 GLOW
                    ================================================= */}

                    <polyline
                        points={
                            history02
                                .map(
                                    p =>
                                        `${p.x},${p.y}`
                                )
                                .join(" ")
                        }
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.18"
                        filter="url(#trailGlow)"
                    />


                    {/* =================================================
                        TRAIL AGV-02
                    ================================================= */}

                    <polyline
                        points={
                            history02
                                .map(
                                    p =>
                                        `${p.x},${p.y}`
                                )
                                .join(" ")
                        }
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                    />


                    {/* =================================================
                        AGV-01
                    ================================================= */}

                    <g
                        transform={`
                            translate(${x01}, ${y01})
                            rotate(${theta01})
                        `}
                    >

                        <rect
                            x="-24"
                            y="-15"
                            width="48"
                            height="30"
                            rx="8"
                            fill="#2563eb"
                            stroke="#60a5fa"
                            strokeWidth="2"
                        />


                        <rect
                            x="-8"
                            y="-8"
                            width="16"
                            height="16"
                            rx="3"
                            fill="#bfdbfe"
                        />


                        <circle
                            cx="25"
                            cy="0"
                            r="5"
                            fill="#22c55e"
                        />

                    </g>


                    {/* AGV-01 LABEL */}

                    <text
                        x={x01}
                        y={y01 - 25}
                        fill="#60a5fa"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                    >
                        AGV-01
                    </text>


                    {/* =================================================
                        AGV-02
                    ================================================= */}

                    <g
                        transform={`
                            translate(${x02}, ${y02})
                            rotate(${theta02})
                        `}
                    >

                        <rect
                            x="-24"
                            y="-15"
                            width="48"
                            height="30"
                            rx="8"
                            fill="#9333ea"
                            stroke="#c084fc"
                            strokeWidth="2"
                        />


                        <rect
                            x="-8"
                            y="-8"
                            width="16"
                            height="16"
                            rx="3"
                            fill="#e9d5ff"
                        />


                        <circle
                            cx="25"
                            cy="0"
                            r="5"
                            fill="#22c55e"
                        />

                    </g>


                    {/* AGV-02 LABEL */}

                    <text
                        x={x02}
                        y={y02 - 25}
                        fill="#c084fc"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                    >
                        AGV-02
                    </text>


                    </g>

                </svg>

            </div>


            {/* =====================================================
                INFO PANEL
            ===================================================== */}

            <div className="map-info">


                {/* =================================================
                    AGV-01
                ================================================= */}

                <div className="map-card">

                    <h4>

                        <span
                            className="agv-dot agv-blue"
                        />

                        AGV-01

                    </h4>


                    <p>
                        X:{" "}
                        {Number(
                            agv01.posX ?? 0
                        ).toFixed(1)}
                        {" mm"}
                    </p>


                    <p>
                        Y:{" "}
                        {Number(
                            agv01.posY ?? 0
                        ).toFixed(1)}
                        {" mm"}
                    </p>


                    <p>
                        Heading:{" "}
                        {theta01.toFixed(1)}
                        °
                    </p>

                </div>


                {/* =================================================
                    AGV-02
                ================================================= */}

                <div className="map-card">

                    <h4>

                        <span
                            className="agv-dot agv-purple"
                        />

                        AGV-02

                    </h4>

                             <p>
                                X:{" "}
                                {Number(
                                    agv02.posX ?? 0
                                ).toFixed(1)}
                                {" mm"}
                            </p>


                            <p>
                                Y:{" "}
                                {Number(
                                    agv02.posY ?? 0
                                ).toFixed(1)}
                                {" mm"}
                            </p>


                            <p>
                                Heading:{" "}
                                {theta02.toFixed(1)}
                                °
                            </p>

                </div>


                {/* =================================================
                    TRAIL
                ================================================= */}

                <div className="map-card">

                    <h4>
                        Trail
                    </h4>


                    <p>
                        AGV-01:{" "}
                        {history01.length}
                        {" points"}
                    </p>

                    <p>
                        AGV-02:{" "}
                        {history02.length}
                        {" points"}
                    </p>

                </div>


                {/* =================================================
                    MAP INFO
                ================================================= */}

                <div className="map-card">

                    <h4>
                        Map Area
                    </h4>


                    <p>
                        ~ 190 × 152 cm
                    </p>


                    <p>
                        3 Belokan
                    </p>

                </div>


            </div>

        </div>

    );
}