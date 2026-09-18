import { useEffect, useRef, useState } from "react";

export default function useWebSocket() {

    const [data, setData] = useState({});

    const wsRef = useRef(null);

    const reconnectRef = useRef(null);

    useEffect(() => {

        function connect() {

            console.log("Opening WebSocket...");
            wsRef.current = new WebSocket("ws://192.168.0.12:1234");
            wsRef.current.onopen = () => {
                console.log("✅ WebSocket Connected");
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const json = JSON.parse(event.data);
                    setData(json);
                    console.log("RAW :", event.data);
                    console.log("PARSED :", json);
                }

                catch (err) {
                    console.log("JSON Parse Error");
                }

            };

            wsRef.current.onclose = () => {
                console.log("❌ WebSocket Closed");
                reconnectRef.current = setTimeout(() => {
                    connect();
                }, 2000);

            };

            wsRef.current.onerror = (err) => {
                console.log(err);
            };

        }

        connect();

        return () => {
            clearTimeout(reconnectRef.current);
            wsRef.current?.close();
        };

    }, []);

    return data;

}