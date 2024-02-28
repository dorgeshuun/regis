import React from "react";

function useWindowDimensions() {
    const [dimensions, setDimensions] = React.useState({
        width: -1,
        height: -1,
    });

    const registerDimensions = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setDimensions({ width, height });
    };

    React.useEffect(() => {
        registerDimensions();
        window.addEventListener("resize", registerDimensions);
        return () => {
            window.removeEventListener("resize", registerDimensions);
        };
    }, []);

    return dimensions;
}

export default useWindowDimensions;
