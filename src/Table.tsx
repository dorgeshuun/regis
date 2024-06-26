import React from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api";
import { useQuery } from "@tanstack/react-query";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableSortLabel from "@mui/material/TableSortLabel";
import { TableVirtuoso, TableComponents } from "react-virtuoso";

import useWindowDimensions from "./useWindowDimensions";
import "./styles.css";

type Sort = { col: number; dir: "asc" | "desc" };

const _Table = () => {
    const { uuid } = useParams();
    const { height } = useWindowDimensions();

    const [sort, setSort] = React.useState<Sort>({ col: 0, dir: "asc" });

    const query = useQuery({
        queryKey: [`features-${uuid}-${sort.col}-${sort.dir}`],
        queryFn: async () => {
            const result = await invoke("get_layer_attributes", {
                layerId: uuid,
                sortCol: sort.col,
                sortDir: sort.dir,
            });

            const { headers: columns, body: rows } = result as {
                headers: string[];
                body: { index: number; values: string[] }[];
            };

            return { columns, rows };
        },
    });

    if (query.isPending) {
        return "loading...";
    }

    if (query.isError) {
        return "failed on fetch";
    }

    const handleClickSort = (index: number) => () => {
        setSort(state => ({
            col: index,
            dir: index === state.col && state.dir === "asc" ? "desc" : "asc",
        }));
    };

    const fixedHeaderContent = () => {
        return (
            <TableRow>
                {query.data.columns.map((title, index) => (
                    <TableCell
                        key={title}
                        variant="head"
                        style={{ width: 200 }}
                        sx={{ backgroundColor: "background.paper" }}
                    >
                        <TableSortLabel
                            active={index === sort.col}
                            direction={sort.dir}
                            onClick={handleClickSort(index)}
                        >
                            {title}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        );
    };

    const rowContent = (
        _index: number,
        row: { index: number; values: string[] }
    ) => {
        return (
            <React.Fragment>
                {row.values.map((display, index) => (
                    <TableCell key={index}>{display}</TableCell>
                ))}
            </React.Fragment>
        );
    };

    const handleClickFeature = (index: number) => () => {
        invoke("zoom_to_feature", { layerId: uuid, featureId: index });
    };

    const getTable = (): TableComponents<{
        index: number;
        values: string[];
    }> => ({
        Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
            <TableContainer component={Paper} {...props} ref={ref} />
        )),
        Table: props => <Table {...props} size="small" />,
        TableHead,
        TableRow: ({ item: _item, ...props }) => (
            <TableRow
                {...props}
                hover
                style={{ cursor: "pointer" }}
                onClick={handleClickFeature(_item.index)}
            />
        ),
        TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
            <TableBody {...props} ref={ref} />
        )),
    });

    return (
        <TableVirtuoso
            style={{ height }}
            data={query.data.rows}
            components={getTable()}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={rowContent}
        />
    );
};

export default _Table;
