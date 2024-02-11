import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const colors = [
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#a65628",
];

type Props = {
    color: string;
    onChange: (color: string) => void;
};

const Color = (props: Props) => {
    const [open, setOpen] = React.useState(false);

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleColorPick = (color: string) => () => {
        props.onChange(color);
        setOpen(false);
    };

    const patchRef = React.useRef(null);

    const patch = (
        <div
            ref={patchRef}
            style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                cursor: "pointer",
                background: props.color,
            }}
            onClick={handleClick}
        ></div>
    );

    return (
        <>
            {patch}
            <Menu
                id="color-picker"
                open={open}
                onClose={handleClose}
                anchorEl={patchRef.current}
            >
                {colors.map((c, index) => (
                    <MenuItem key={index} onClick={handleColorPick(c)}>
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: 5,
                                cursor: "pointer",
                                background: c,
                                marginRight: 10,
                            }}
                        ></div>
                        <span style={{ fontFamily: "monospace" }}>{c}</span>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default Color;
