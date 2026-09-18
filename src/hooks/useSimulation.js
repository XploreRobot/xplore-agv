import { useEffect, useState } from "react";

export default function useSimulation() {

    const [agv, setAgv] = useState({
        posX: 150,
        posY: 150,
        thetha: 0
    });

    useEffect(() => {

        let x = 150;
        let y = 150;
        let theta = 0;

        let direction = "RIGHT";

        const speed = 2;

        const interval = setInterval(() => {

            switch (direction) {

                case "RIGHT":

                    x += speed;
                    theta = 0;

                    if (x >= 850) {
                        direction = "DOWN";
                    }

                    break;

                case "DOWN":

                    y += speed;
                    theta = 90;

                    if (y >= 550) {
                        direction = "LEFT";
                    }

                    break;

                case "LEFT":

                    x -= speed;
                    theta = 180;

                    if (x <= 150) {
                        direction = "UP";
                    }

                    break;

                case "UP":

                    y -= speed;
                    theta = 270;

                    if (y <= 150) {
                        direction = "RIGHT";
                    }

                    break;

            }

            setAgv({
                posX: x,
                posY: y,
                thetha: theta
            });

        }, 20);

        return () => clearInterval(interval);

    }, []);

    return agv;

}