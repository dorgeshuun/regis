import React from "react";
import { useParams } from "react-router-dom";

import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

type Row = {
    values: string[];
    selected: boolean;
};

type SortDirection = "asc" | "desc";

type State =
    | { fetched: false }
    | {
          fetched: true;
          columns: string[];
          rows: Row[];
          sortIndex: number;
          sortDirection: SortDirection;
      };

const _Table = () => {
    const { uuid } = useParams();

    const [data, setData] = React.useState<State>({ fetched: false });

    React.useEffect(() => {
        invoke("get_layer_attributes", { layerId: uuid }).then((result) => {
            const [head, ...tail] = result as string[][];

            const rows = tail.map((r) => ({ values: r, selected: false }));

            setData({
                fetched: true,
                columns: head,
                rows,
                sortIndex: 0,
                sortDirection: "asc",
            });
        });
    }, []);

    React.useEffect(() => {
        listen<{ layer_id: string; feature_id: number }>(
            "select_feature",
            (payload) => {
                console.log(payload);
                setData((state) =>
                    state.fetched
                        ? {
                              ...state,
                              rows: state.rows.map((r, rindex) => ({
                                  ...r,
                                  selected:
                                      uuid === payload.payload.layer_id &&
                                      rindex === payload.payload.feature_id
                                          ? true
                                          : r.selected,
                              })),
                          }
                        : state
                );
            }
        );
    }, []);

    React.useEffect(() => {
        listen<{ layer_id: string; feature_id: number }>(
            "unselect_feature",
            (payload) => {
                setData((state) =>
                    state.fetched
                        ? {
                              ...state,
                              rows: state.rows.map((r, rindex) => ({
                                  ...r,
                                  selected:
                                      uuid === payload.payload.layer_id &&
                                      rindex === payload.payload.feature_id
                                          ? false
                                          : r.selected,
                              })),
                          }
                        : state
                );
            }
        );
    }, []);

    React.useEffect(() => {
        listen<{ layer_id: string }>("select_all_features", (event) => {
            setData((state) =>
                state.fetched && uuid === event.payload.layer_id
                    ? {
                          ...state,
                          rows: state.rows.map((r) => ({
                              ...r,
                              selected: true,
                          })),
                      }
                    : state
            );
        });
    }, []);

    React.useEffect(() => {
        listen<{ layer_id: string }>("unselect_all_features", (event) => {
            setData((state) =>
                state.fetched && uuid === event.payload.layer_id
                    ? {
                          ...state,
                          rows: state.rows.map((r) => ({
                              ...r,
                              selected: false,
                          })),
                      }
                    : state
            );
        });
    }, []);

    if (!data.fetched) {
        return <div>no data yet</div>;
    }

    const handleClick = (index: number) => () => {
        invoke(
            data.rows[index].selected ? "unselect_feature" : "select_feature",
            { layerId: uuid, featureId: index - 1 }
        );
    };

    const noneSelected = data.rows.every((s) => !s.selected);
    const allSelected = data.rows.every((s) => s.selected);
    const someSelected = !noneSelected && !allSelected;

    const handleClickSelectAll = () => {
        invoke("select_all_features", { layerId: uuid });
    };

    const handleClickUnselectAll = () => {
        invoke("unselect_all_features", { layerId: uuid });
    };

    const handleClickSort = (index: number) => () => {
        setData((state) => {
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
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox">
                        {noneSelected && (
                            <Checkbox onClick={handleClickSelectAll} />
                        )}
                        {someSelected && (
                            <Checkbox
                                indeterminate
                                onClick={handleClickSelectAll}
                            />
                        )}
                        {allSelected && (
                            <Checkbox
                                checked
                                onClick={handleClickUnselectAll}
                            />
                        )}
                    </TableCell>
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
                    .map((r) => (
                        <TableRow
                            hover
                            role="checkbox"
                            key={r.id}
                            selected={r.selected}
                            onClick={handleClick(r.id)}
                            style={{ cursor: "pointer" }}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox checked={r.selected} />
                            </TableCell>
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
