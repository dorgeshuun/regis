import React from "react";
import { useParams } from "react-router-dom";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

import { invoke } from "@tauri-apps/api";
import useWindowHeight from "./useWindowHeight";
import "./styles.css";

type Row = {
    values: string[];
    selected: boolean;
};

type LayerState = {
    columns: string[];
    rows: Row[];
    sortIndex: number;
    sortDirection: "asc" | "desc";
};

type State = { fetched: false } | ({ fetched: true } & LayerState);

const _Table = () => {
    const ref = React.useRef<HTMLDivElement>(null);

    const { uuid } = useParams();

    const [data, setData] = React.useState<State>({ fetched: false });

    const height = useWindowHeight();
    const [scrollTop, setScrollTop] = React.useState(0);

    React.useEffect(() => {
        invoke("get_layer_attributes", { layerId: uuid }).then(result => {
            const [head, ...tail] = result as string[][];

            const rows = tail.map(r => ({ values: r, selected: false }));

            setData({
                fetched: true,
                columns: head,
                rows,
                sortIndex: 0,
                sortDirection: "asc",
            });
        });
    }, []);

    const handleScroll = () => {
        const element = ref.current;

        if (!element) {
            throw new Error();
        }

        setScrollTop(window.scrollY);
    };

    const first = Math.floor(scrollTop / 20);
    const length = Math.ceil(height / 20);

    React.useEffect(() => {
        document.addEventListener("scroll", handleScroll);
        return () => {
            document.removeEventListener("scroll", handleScroll);
        };
    }, [height]);

    if (!data.fetched) {
        return <div>no data yet</div>;
    }

    const handleClickSort = (index: number) => () => {
        setData(state => {
            if (!state.fetched) {
                return state;
            }

            if (index === state.sortIndex && state.sortDirection === "asc") {
                return { ...state, sortDirection: "desc" };
            }

            if (index === state.sortIndex && state.sortDirection === "desc") {
                return { ...state, sortDirection: "asc" };
            }

            return { ...state, sortIndex: index, sortDirection: "asc" };
        });
    };

    return (
        <div
            ref={ref}
            style={{
                height: "calc(20px * 100000)",
                background: "lightgreen",
            }}
        >
            <div
                style={{
                    top: scrollTop,
                    position: "relative",
                    maxHeight: "100vh",
                    overflowY: "clip",
                }}
            >
                {Array(length)
                    .fill(0)
                    .map((_, index) => first + index)
                    .map((n, index) => (
                        <div key={index} style={{ height: 20 }}>
                            hello world {n}
                        </div>
                    ))}
            </div>
        </div>
    );

    return (
        <table style={{ width: "100vw" }}>
            <thead>
                <tr style={{ height: 50 }}>
                    <th>company</th>
                    <th>contact</th>
                    <th>country</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ height: 30 }}>
                    <td>Alfreds Futterkiste</td>
                    <td>Maria Anders</td>
                    <td>Germany</td>
                </tr>
                <tr style={{ height: 30 }}>
                    <td>Centro comercial Moctezuma</td>
                    <td>Francisco Chang</td>
                    <td>Mexico</td>
                </tr>
            </tbody>
        </table>
    );

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {head}
        </div>
    );

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    {data.columns.map((title, index) => (
                        <TableCell key={index}>
                            <TableSortLabel
                                active={data.sortIndex === index}
                                direction={data.sortDirection}
                                onClick={handleClickSort(index)}
                            >
                                {title}
                            </TableSortLabel>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>

            <TableBody component={Paper}>
                {data.rows
                    .map((r, rindex) => ({ ...r, id: rindex }))
                    .sort((x, y) => {
                        const sort = x.values[data.sortIndex].localeCompare(
                            y.values[data.sortIndex]
                        );

                        switch (data.sortDirection) {
                            case "asc":
                                return sort;

                            case "desc":
                                return -sort;
                        }
                    })
                    .map(r => (
                        <TableRow
                            hover
                            role="checkbox"
                            key={r.id}
                            selected={r.selected}
                            style={{ cursor: "pointer" }}
                        >
                            {r.values.map((c, cindex) => (
                                <TableCell key={cindex}>{c}</TableCell>
                            ))}
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
    );
};

export default _Table;
