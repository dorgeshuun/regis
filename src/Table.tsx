import React from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";
import { TableVirtuoso, TableComponents } from "react-virtuoso";

import useWindowHeight from "./useWindowHeight";
import "./styles.css";
import TableContainer from "@mui/material/TableContainer";

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

const VirtuosoTableComponents: TableComponents<Row> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: props => <Table {...props} size="small" />,
    TableHead,
    TableRow: ({ item: _item, ...props }) => <TableRow {...props} hover />,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
        <TableBody {...props} ref={ref} />
    )),
};

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

    const fixedHeaderContent = () => {
        return (
            <TableRow>
                {data.columns.map(title => (
                    <TableCell
                        key={title}
                        variant="head"
                        //align={c.numeric || false ? "right" : "left"}
                        style={{ width: 200 }}
                        sx={{
                            backgroundColor: "background.paper",
                        }}
                    >
                        {title}
                    </TableCell>
                ))}
            </TableRow>
        );
    };

    const rowContent = (_index: number, row: Row) => {
        return (
            <React.Fragment>
                {row.values.map((display, index) => (
                    <TableCell
                        key={index}
                        //align={column.numeric || false ? 'right' : 'left'}
                    >
                        {display}
                    </TableCell>
                ))}
            </React.Fragment>
        );
    };

    return (
        <TableVirtuoso
            style={{ height }}
            data={data.rows}
            components={VirtuosoTableComponents}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={rowContent}
        />
    );
};

export default _Table;
