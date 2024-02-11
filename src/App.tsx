import React from "react";

import "./App.css";
import { Layer, Layers } from "./Layers";
import SidePanel from "./SidePanel";
import Map from "./Map";
import Popup from "./Popup";
import FeatureAttributes from "./FeatureAttributes";

import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

function App() {
    const [files, setFiles] = React.useState<Layers>({ id: 0, layers: [] });
    const [highlighted, setHighlighted] = React.useState<
        { active: false } | { active: true; layerId: string; featureId: number }
    >({ active: false });

    React.useEffect(() => {
        listen("create_layer", (e) => {
            const { uuid, filename, features } = e.payload as {
                uuid: string;
                filename: string;
                features: { lng: number; lat: number }[];
            };

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

    const handleFeatureHighlight = (layerId: string, featureId: number) => {
        setHighlighted({ active: true, layerId, featureId });
    };

    const handleStopHighlight = () => {
        setHighlighted({ active: false });
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
            <Map
                layers={files}
                onHighlight={handleFeatureHighlight}
                onStopHighlight={handleStopHighlight}
            />
            <Popup open={highlighted.active}>
                {highlighted.active ? (
                    <FeatureAttributes
                        layerId={highlighted.layerId}
                        featureId={highlighted.featureId}
                    />
                ) : (
                    <span>nothing here</span>
                )}
            </Popup>
        </div>
    );
}

export default App;
