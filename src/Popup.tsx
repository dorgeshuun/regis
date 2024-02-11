import React from "react";

type Props = { open: boolean; children: JSX.Element | JSX.Element[] };

function Popup(props: Props) {
    if (!props.open) {
        return null;
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 25,
                right: 25,
                background: "white",
                borderRadius: 10,
            }}
        >
            {props.children}
        </div>
    );
}

export default Popup;
