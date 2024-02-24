import React from "react";
import { invoke } from "@tauri-apps/api";

import Menu from "./Menu";
import LayerList from "./LayerList";
import { Layers, Layer } from "./Layers";

type Props = {
    layers: Layers;
    onSort: (items: Layer[]) => void;
    onShow: (id: string) => void;
    onHide: (id: string) => void;
    onColorChange: (id: string, color: string) => void;
    onDelete: (id: string) => void;
    onZoom: (id: string) => void;
};

type State =
    | { open: false }
    | { open: true; selected: string; x: number; y: number };

const SidePanel = (props: Props) => {
    const [state, setState] = React.useState<State>({ open: false });

    const handleZoom = (id: string) => () => {
        props.onZoom(id);
    };

    const handleOpenAttributeTable = (id: string) => () => {
        invoke("create_table_window", { layerId: id });
    };

    const handleDelete = (id: string) => () => {
        props.onDelete(id);
    };

    const handleOpenMenu = (layerId: string, x: number, y: number) => {
        setState({ open: true, x, y, selected: layerId });
    };

    const handleCloseMenu = () => {
        setState({ open: false });
    };

    const selected = state.open ? state.selected : "none";

    return (
        <>
            <LayerList
                layers={props.layers}
                onSort={props.onSort}
                onShow={props.onShow}
                onHide={props.onHide}
                onColorChange={props.onColorChange}
                onContextMenu={handleOpenMenu}
            />
            <Menu
                open={state.open}
                x={state.open ? state.x : -1}
                y={state.open ? state.y : -1}
                onCloseMenu={handleCloseMenu}
                onZoomToLayer={handleZoom(selected)}
                onOpenAttributeTable={handleOpenAttributeTable(selected)}
                onDeleteLayer={handleDelete(selected)}
            />
        </>
    );
};

export default SidePanel;
