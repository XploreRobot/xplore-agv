import {
    useEffect,
    useRef,
    useState
} from "react";


export default function useRealtime() {


    // =====================================================
    // REALTIME STATE
    // =====================================================

    const [realtime, setRealtime] = useState({

        // ================================================
        // AGV-01
        // ================================================

        agv01: {

            normal: {},

            alarm: {},

            tracking: {},

            pid: {}

        },


        // ================================================
        // AGV-02
        // ================================================

        agv02: {

            normal: {},

            alarm: {},

            tracking: {},

            pid: {}

        },


        // ================================================
        // TRACKING KHUSUS
        //
        // Ini yang digunakan LiveMap.jsx
        // ================================================

        tracking: {

            "AGV-01": {},

            "AGV-02": {}

        }

    });


    const ws =
        useRef(null);


    // =====================================================
    // WEBSOCKET
    // =====================================================

    useEffect(() => {


        ws.current =
            new WebSocket(
                "ws://localhost:1234"
            );


        // =================================================
        // CONNECTED
        // =================================================

        ws.current.onopen =
            () => {

                console.log(
                    "✅ WebSocket Connected"
                );

            };


        // =================================================
        // MESSAGE
        // =================================================

        ws.current.onmessage =
            (event) => {


                try {

                    const message =
                        JSON.parse(
                            event.data
                        );


                    console.log(
                        "📡 WS:",
                        message
                    );


                    const topic =
                        message.topic;


                    const data =
                        message.data;


                    // =================================================
                    // AGV-01
                    // =================================================

                    if (
                        topic.startsWith(
                            "agv1/"
                        )
                    ) {


                        setRealtime(
                            prev => {


                                // =====================================
                                // LIVE TRACK
                                // =====================================

                                if (
                                    topic ===
                                    "agv1/monitor/livetrack"
                                ) {

                                    return {

                                        ...prev,

                                        agv01: {

                                            ...prev.agv01,

                                            tracking:
                                                data

                                        },


                                        tracking: {

                                            ...prev.tracking,

                                            "AGV-01":
                                                data

                                        }

                                    };

                                }


                                // =====================================
                                // NORMAL
                                // =====================================

                                if (
                                    topic ===
                                    "agv1/monitor/normal"
                                ) {

                                    return {

                                        ...prev,

                                        agv01: {

                                            ...prev.agv01,

                                            normal:
                                                data

                                        }

                                    };

                                }


                                // =====================================
                                // ALARM
                                // =====================================

                                if (
                                    topic ===
                                    "agv1/monitor/alarm"
                                ) {

                                    return {

                                        ...prev,

                                        agv01: {

                                            ...prev.agv01,

                                            alarm:
                                                data

                                        }

                                    };

                                }


                                // =====================================
                                // PID
                                // =====================================

                                if (
                                    topic ===
                                    "agv1/monitor/pid"
                                ) {

                                    return {

                                        ...prev,

                                        agv01: {

                                            ...prev.agv01,

                                            pid:
                                                data

                                        }

                                    };

                                }


                                return prev;

                            }
                        );

                    }


                    // =================================================
                    // AGV-02
                    // =================================================

                    if (
                        topic.startsWith(
                            "agv2/"
                        )
                    ) {


                        setRealtime(
                            prev => {


                                // =====================================
                                // LIVE TRACK
                                // =====================================

                                if (
                                    topic ===
                                    "agv2/monitor/livetrack"
                                ) {

                                    return {

                                        ...prev,

                                        agv02: {

                                            ...prev.agv02,

                                            tracking:
                                                data

                                        },


                                        tracking: {

                                            ...prev.tracking,

                                            "AGV-02":
                                                data

                                        }

                                    };

                                }


                                // =====================================
                                // NORMAL
                                // =====================================

                                if (
                                    topic ===
                                    "agv2/monitor/normal"
                                ) {

                                    return {

                                        ...prev,

                                        agv02: {

                                            ...prev.agv02,

                                            normal:
                                                data

                                        }

                                    };

                                }


                                // =====================================
                                // ALARM
                                // =====================================

                                if (
                                    topic ===
                                    "agv2/monitor/alarm"
                                ) {

                                    return {

                                        ...prev,

                                        agv02: {

                                            ...prev.agv02,

                                            alarm:
                                                data

                                        }

                                    };

                                }


                                // =====================================
                                // PID
                                // =====================================

                                if (
                                    topic ===
                                    "agv2/monitor/pid"
                                ) {

                                    return {

                                        ...prev,

                                        agv02: {

                                            ...prev.agv02,

                                            pid:
                                                data

                                        }

                                    };

                                }


                                return prev;

                            }
                        );

                    }

                }

                catch (err) {

                    console.log(
                        "❌ WebSocket JSON Error:",
                        err
                    );

                }

            };


        // =================================================
        // CLOSE
        // =================================================

        ws.current.onclose =
            () => {

                console.log(
                    "🔴 WebSocket Closed"
                );

            };


        // =================================================
        // ERROR
        // =================================================

        ws.current.onerror =
            (error) => {

                console.log(
                    "❌ WebSocket Error:",
                    error
                );

            };


        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            if (
                ws.current
            ) {

                ws.current.close();

            }

        };

    }, []);


    return realtime;

}