import React from "react";

function useWindowHeight() {
    const [height, setHeight] = React.useState(-1);

    const registerHeight = () => {
        const height = window.innerHeight;
        setHeight(height);
    };

    React.useEffect(() => {
        registerHeight();
        window.addEventListener("resize", registerHeight);
        return () => {
            window.removeEventListener("resize", registerHeight);
        };
    }, []);

    return height;
}

export default useWindowHeight;
