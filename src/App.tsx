import React from "react";

import "./App.css";
import { Layer, Layers } from "./Layers";
import SidePanel from "./SidePanel";
import Map from "./Map";

import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

function App() {
    const [files, setFiles] = React.useState<Layers>({ id: 0, layers: [] });

    React.useEffect(() => {
        listen("create_layer", (e) => {
            const { uuid, filename, features } = e.payload as {
                uuid: string;
                filename: string;
                features: { lng: number; lat: number }[];
            };
            console.log(e.payload);
            setFiles((state) => ({
                id: state.id + 1,
                layers: [
                    ...state.layers,
                    {
                        id: uuid,
                        title: filename,
                        color: "#e41a1c",
                        visible: true,
                        points: features,
                    },
                ],
            }));
        });
    }, []);

    const handleListSort = (items: Layer[]) => {
        setFiles((state) => ({
            id:
                state.layers.map((l) => l.id).join(" ") ===
                items.map((i) => i.id).join(" ")
                    ? state.id
                    : state.id + 1,
            layers: items,
        }));
    };

    const handleClickShow = (id: string) => {
        setFiles((state) => ({
            id: state.id + 1,
            layers: state.layers.map((l) =>
                l.id === id ? { ...l, visible: true } : l
            ),
        }));
    };

    const handleClickHide = (id: string) => {
        setFiles((state) => ({
            id: state.id + 1,
            layers: state.layers.map((l) =>
                l.id === id ? { ...l, visible: false } : l
            ),
        }));
    };

    const handleColorPick = (id: string, color: string) => {
        setFiles((state) => ({
            id: state.id + 1,
            layers: state.layers.map((l) =>
                l.id === id ? { ...l, color } : l
            ),
        }));
    };

    const handleDelete = (layerId: string) => {
        setFiles((state) => ({
            id: state.id + 1,
            layers: state.layers.filter((l) => l.id !== layerId),
        }));
        invoke("delete_layer", { layerId });
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
            />
            <Map layers={files} />
        </div>
    );
}

export default App;
