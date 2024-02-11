import React from "react";

import { ReactSortable } from "react-sortablejs";
import { Layers, Layer } from "./Layers";

import { Eye as VisibleIcon, EyeOff as HiddenIcon } from "mdi-material-ui";
import Color from "./Color";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { invoke } from "@tauri-apps/api";

type Props = {
    layers: Layers;
    onSort: (items: Layer[]) => void;
    onShow: (id: string) => void;
    onHide: (id: string) => void;
    onColorChange: (id: string, color: string) => void;
    onDelete: (id: string) => void;
};

type State =
    | { open: false }
    | {
          open: true;
          selected: string;
          x: number;
          y: number;
      };

const SidePanel = (props: Props) => {
    const [state, setState] = React.useState<State>({ open: false });

    const handleClickShow = (id: string) => () => {
        props.onShow(id);
    };

    const handleClickHide = (id: string) => () => {
        props.onHide(id);
    };

    const handleColorPick = (id: string) => (color: string) => {
        props.onColorChange(id, color);
    };

    const handleClose = () => {
        setState({ open: false });
    };

    const handleRightClick = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setState({
            open: true,
            selected: id,
            x: e.pageX,
            y: e.pageY,
        });
    };

    const handleClick = (id: string) => () => {
        setState({ open: false });
        invoke("create_table_window", { layerId: id });
    };

    const handleClickDelete = (id: string) => () => {
        setState({ open: false });
        props.onDelete(id);
    };

    return (
        <>
            <ReactSortable
                list={props.layers.layers}
                setList={props.onSort}
                style={{
                    height: "100%",
                    width: 300,
                }}
            >
                {props.layers.layers.map((l) => (
                    <div
                        key={l.id}
                        onContextMenu={handleRightClick(l.id)}
                        style={{
                            width: "100%",
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "default",
                        }}
                    >
                        {l.visible ? (
                            <VisibleIcon
                                style={{
                                    flexGrow: 0,
                                    margin: 5,
                                    cursor: "pointer",
                                }}
                                onClick={handleClickHide(l.id)}
                            />
                        ) : (
                            <HiddenIcon
                                style={{
                                    flexGrow: 0,
                                    margin: 5,
                                    cursor: "pointer",
                                }}
                                onClick={handleClickShow(l.id)}
                            />
                        )}
                        <div style={{ flexGrow: 1, fontSize: 15 }}>
                            {l.title}
                        </div>
                        <div style={{ flexGrow: 0, margin: 5 }}>
                            <Color
                                color={l.color}
                                onChange={handleColorPick(l.id)}
                            />
                        </div>
                    </div>
                ))}
            </ReactSortable>
            {state.open && (
                <Menu
                    open={true}
                    onClose={handleClose}
                    anchorReference="anchorPosition"
                    anchorPosition={{ top: state.y, left: state.x }}
                >
                    <MenuItem onClick={handleClick(state.selected)}>
                        attribute table
                    </MenuItem>
                    <MenuItem onClick={handleClickDelete(state.selected)}>
                        delete layer
                    </MenuItem>
                </Menu>
            )}
        </>
    );
};

export default SidePanel;
