import { ReactSortable } from "react-sortablejs";
import { Layers, Layer } from "./Layers";

import Color from "./Color";
import React from "react";
import Visibility from "./Visibility";

type Props = {
    layers: Layers;
    onSort: (items: Layer[]) => void;
    onContextMenu: (id: string, x: number, y: number) => void;
    onShow: (id: string) => void;
    onHide: (id: string) => void;
    onColorChange: (layerId: string, colorId: string) => void;
};

function LayerList(props: Props) {
    const handleRightClick = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        props.onContextMenu(id, e.pageX, e.pageY);
    };

    const handleClickHide = (id: string) => () => {
        props.onHide(id);
    };

    const handleClickShow = (id: string) => () => {
        props.onShow(id);
    };

    const handleColorPick = (layerId: string) => (colorId: string) => {
        props.onColorChange(layerId, colorId);
    };

    return (
        <ReactSortable
            list={props.layers.layers}
            setList={props.onSort}
            style={{ height: "100%", width: 300 }}
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
                    <Visibility
                        visible={l.visible}
                        onShow={handleClickShow(l.id)}
                        onHide={handleClickHide(l.id)}
                    />
                    <div style={{ flexGrow: 1, fontSize: 15 }}>{l.title}</div>
                    <Color color={l.color} onChange={handleColorPick(l.id)} />
                </div>
            ))}
        </ReactSortable>
    );
}

export default LayerList;
