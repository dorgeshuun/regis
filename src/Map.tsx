import React from "react";

import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Circle from "ol/style/Circle";
import { fromLonLat } from "ol/proj";
import { Layer, Feature as _Feature, Point as _Point } from "./Layers";

type Layers = {
    id: number;
    layers: Layer[];
};

type Props = {
    layers: Layers;
    onHighlight: (layerId: string, featureId: number) => void;
    onStopHighlight: () => void;
};

const makeStyle = (color: string) =>
    new Style({
        image: new Circle({
            fill: new Fill({ color }),
            stroke: new Stroke({ color: "black", width: 1 }),
            radius: 7,
        }),
    });

const makeFeature = (
    lng: number,
    lat: number,
    layerId: string,
    featureId: number
) => {
    const coords = fromLonLat([lng, lat]);
    const geometry = new Point(coords);
    return new Feature({ geometry, layerId, featureId });
};

const makeLayer = (file: Layer) =>
    file.points.map((p, index) => {
        const f = makeFeature(p.lng, p.lat, file.id, index);
        const style = makeStyle(file.color);
        f.setStyle(style);
        return f;
    });

const _Map = (props: Props) => {
    const layerRef = React.useRef<VectorSource<Point>>(new VectorSource());
    React.useEffect(() => {
        layerRef.current.clear();
        layerRef.current.addFeatures(
            props.layers.layers
                .filter((l) => l.visible)
                .reverse()
                .flatMap(makeLayer)
        );
    }, [props.layers.id]);

    React.useEffect(() => {
        const pointLayer = new VectorLayer({
            source: layerRef.current,
        });

        const osm = new TileLayer({
            source: new OSM(),
        });

        const map = new Map({
            layers: [osm, pointLayer],
            target: "map",
            view: new View({ center: [0, 0], zoom: 2 }),
        });

        map.on("pointermove", (e) => {
            props.onStopHighlight();
            map.forEachFeatureAtPixel(e.pixel, (f) => {
                const { layerId, featureId } = f.getProperties();
                props.onHighlight(layerId, featureId);
            });
        });
    }, []);

    return (
        <div
            id="map"
            style={{
                height: "100%",
                width: "calc(100vw - 300px)",
            }}
        ></div>
    );
};

export default _Map;
