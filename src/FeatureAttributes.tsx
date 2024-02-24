import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";

type Props = { layerId: string; featureId: number };
type Field = { name: string; value: string };

function FeatureAttributes(props: Props) {
    const query = useQuery({
        queryKey: [`feature-${props.layerId}::${props.featureId}`],
        queryFn: async () => {
            const resp = await invoke("get_feature_attributes", { ...props });
            return resp as Field[];
        },
    });

    if (query.isPending) {
        return null;
    }

    if (query.isError) {
        return <div>error</div>;
    }

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableBody>
                    {query.data.map((f, index) => (
                        <TableRow key={index}>
                            <TableCell align="right">{f.name}</TableCell>
                            <TableCell align="left">{f.value}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default FeatureAttributes;
