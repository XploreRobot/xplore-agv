import { useEffect, useState } from "react";

export default function WebSocketTest(){

    const [msg,setMsg]=useState("");

    useEffect(()=>{

        const ws=new WebSocket("ws://localhost:1234");

        ws.onopen=()=>{

            console.log("Connected");

        };

        ws.onmessage=(event)=>{

            console.log(event.data);

            setMsg(event.data);

        };

        return ()=>ws.close();

    },[]);

    return(

        <div style={{padding:30}}>

            <h1>WebSocket Test</h1>

            <pre>

                {msg}

            </pre>

        </div>

    );

}