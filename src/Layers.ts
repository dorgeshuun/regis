import { Extent } from "./Map";

export type Point = {
    lng: number;
    lat: number;
};

export type Attribute = {
    title: string;
    value: string;
};

export type Feature = {
    geom: Point;
    attributes: Attribute[];
    selected: boolean;
};

export type Layer = {
    id: string;
    title: string;
    color: string;
    visible: boolean;
    points: Point[];
    extent: Extent;
};

export type Layers = {
    id: number;
    layers: Layer[];
};
