import React from "react";

import "./App.css";
import { Layer, Layers } from "./Layers";
import SidePanel from "./SidePanel";
import Map, { Extent } from "./Map";

import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/api/dialog";

type Point = { lng: number; lat: number };
type Field = { name: string; value: string };

function App() {
    const [files, setFiles] = React.useState<Layers>({ id: 0, layers: [] });
    const [mapExtent, setMapExtent] = React.useState<Extent | null>(null);

    React.useEffect(() => {
        listen("create_layer", e => {
            const { uuid, filename, features, extent } = e.payload as {
                uuid: string;
                filename: string;
                features: Point[];
                extent: Extent;
            };

            setFiles(state => ({
                id: state.id + 1,
                layers: [
                    ...state.layers,
                    {
                        id: uuid,
                        title: filename,
                        color: "#e41a1c",
                        visible: true,
                        points: features,
                        extent,
                    },
                ],
            }));
        });
    }, []);

    const handleListSort = (items: Layer[]) => {
        setFiles(state => ({
            id:
                state.layers.map(l => l.id).join(" ") ===
                items.map(i => i.id).join(" ")
                    ? state.id
                    : state.id + 1,
            layers: items,
        }));
    };

    const handleClickShow = (id: string) => {
        setFiles(state => ({
            id: state.id + 1,
            layers: state.layers.map(l =>
                l.id === id ? { ...l, visible: true } : l
            ),
        }));
    };

    const handleClickHide = (id: string) => {
        setFiles(state => ({
            id: state.id + 1,
            layers: state.layers.map(l =>
                l.id === id ? { ...l, visible: false } : l
            ),
        }));
    };

    const handleColorPick = (id: string, color: string) => {
        setFiles(state => ({
            id: state.id + 1,
            layers: state.layers.map(l => (l.id === id ? { ...l, color } : l)),
        }));
    };

    const handleDelete = (layerId: string) => {
        setFiles(state => ({
            id: state.id + 1,
            layers: state.layers.filter(l => l.id !== layerId),
        }));
        invoke("delete_layer", { layerId });
    };

    const handleZoom = (layerId: string) => {
        const extent = files.layers.find(lyr => lyr.id === layerId)?.extent;
        setMapExtent(state => extent || state);
    };

    const handleChangeMapExtent = (extent: Extent) => {
        setMapExtent(extent);
    };

    const handleFeatureHighlight = async (
        layerId: string,
        featureId: number
    ) => {
        const resp: Field[] = await invoke("get_feature_attributes", {
            layerId,
            featureId,
        });
        const text = resp
            .map(x => `${x.name} ${x.value}`)
            .reduce((x, y) => x + y + "\n", "");
        await message(text, { title: "identify", type: "info" });
    };

    return (
        <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
            <SidePanel
                layers={files}
                onSort={handleListSort}
                onShow={handleClickShow}
                onHide={handleClickHide}
                onColorChange={handleColorPick}
                onDelete={handleDelete}
                onZoom={handleZoom}
            />
            <Map
                layers={files}
                extent={mapExtent}
                onChangeExtent={handleChangeMapExtent}
                onHighlight={handleFeatureHighlight}
            />
        </div>
    );
}

export default App;
