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
    const { uuid } = useParams();

    const [data, setData] = React.useState<State>({ fetched: false });

    const height = useWindowHeight();

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
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {height}
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
