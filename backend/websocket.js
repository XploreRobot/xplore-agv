import { WebSocketServer } from "ws";

import { publishControl } from "./mqtt.js";


let wss;


// =========================================================
// INIT WEBSOCKET
// =========================================================

export function initWebSocket() {

    wss =
        new WebSocketServer({
            port: 1234
        });


    console.log(
        "✅ WebSocket Server running on ws://localhost:1234"
    );


    // =====================================================
    // CONNECTION
    // =====================================================

    wss.on(
        "connection",
        (socket) => {

            console.log(
                "✅ React Connected"
            );


            // =============================================
            // MESSAGE DARI REACT
            // =============================================

            socket.on(
                "message",
                (raw) => {

                    try {

                        const data =
                            JSON.parse(
                                raw.toString()
                            );


                        console.log(
                            "📨 WebSocket:",
                            data
                        );


                        // =================================
                        // CONTROL
                        // =================================

                        if (
                            data.type !== "control"
                        ) {

                            return;

                        }


                        const topic =
                            data.topic;


                        const message =
                            data.message;


                        // =================================
                        // VALIDASI TOPIC
                        // =================================

                       const validTopic =
                          /^agv[12]\/control\/(emergency|reset|continue|itemlimit|pel|iel|del|rpm|forward|reverse|sens|home|work|port)$/;


                        if (
                            !validTopic.test(topic)
                        ) {

                            console.log(
                                "❌ Invalid MQTT Topic:",
                                topic
                            );


                            socket.send(
                                JSON.stringify({

                                    type:
                                        "control_error",

                                    success:
                                        false,

                                    message:
                                        "MQTT topic tidak valid."

                                })
                            );


                            return;

                        }


                        // =================================
                        // LOG CONTROL
                        // =================================

                        console.log(
                            "🎮 CONTROL:",
                            data.agv,
                            topic,
                            "=>",
                            message
                        );


                        // =================================
                        // PUBLISH MQTT
                        // =================================

                        const success =
                            publishControl(
                                topic,
                                message
                            );


                        // =================================
                        // BERHASIL
                        // =================================

                        if (success) {

                            console.log(
                                "✅ Control Published:",
                                topic,
                                "=>",
                                message
                            );


                            socket.send(
                                JSON.stringify({

                                    type:
                                        "control_result",

                                    success:
                                        true,

                                    agv:
                                        data.agv,

                                    topic:
                                        topic,

                                    message:
                                        message

                                })
                            );

                        }


                        // =================================
                        // MQTT BELUM CONNECT
                        // =================================

                        else {

                            socket.send(
                                JSON.stringify({

                                    type:
                                        "control_error",

                                    success:
                                        false,

                                    message:
                                        "MQTT belum terhubung."

                                })
                            );

                        }

                    }

                    catch (error) {

                        console.log(
                            "❌ WebSocket Message Error:",
                            error
                        );


                        socket.send(
                            JSON.stringify({

                                type:
                                    "control_error",

                                success:
                                    false,

                                message:
                                    "Format data WebSocket tidak valid."

                            })
                        );

                    }

                }
            );


            // =============================================
            // CLOSE
            // =============================================

            socket.on(
                "close",
                () => {

                    console.log(
                        "❌ React Disconnected"
                    );

                }
            );

        }
    );

}


// =========================================================
// BROADCAST
// =========================================================

export function broadcast(
    data
) {

    if (!wss) {

        return;

    }


    wss.clients.forEach(
        client => {

            if (
                client.readyState === 1
            ) {

                client.send(
                    JSON.stringify(data)
                );

            }

        }
    );

}