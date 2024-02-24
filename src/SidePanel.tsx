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

type State = { open: boolean; x: number; y: number; selected: string };

const initialState = { open: false, x: -1, y: -1, selected: "none" };

const SidePanel = (props: Props) => {
    const handleZoom = (id: string) => () => {
        props.onZoom(id);
    };

    const handleOpenAttributeTable = (id: string) => () => {
        invoke("create_table_window", { layerId: id });
    };

    const handleDelete = (id: string) => () => {
        props.onDelete(id);
    };

    const [state, setState] = React.useState<State>(initialState);

    const handleOpenMenu = (layerId: string, x: number, y: number) => {
        setState({ open: true, x, y, selected: layerId });
    };

    const handleCloseMenu = () => {
        setState(initialState);
    };

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
                x={state.x}
                y={state.y}
                onCloseMenu={handleCloseMenu}
                onZoomToLayer={handleZoom(state.selected)}
                onOpenAttributeTable={handleOpenAttributeTable(state.selected)}
                onDeleteLayer={handleDelete(state.selected)}
            />
        </>
    );
};

export default SidePanel;
