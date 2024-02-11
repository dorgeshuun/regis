import React from "react";
import { useQuery } from "@tanstack/react-query";

import { invoke } from "@tauri-apps/api";

type Props = {
    layerId: string;
    featureId: number;
};

type Field = {
    name: string;
    value: string;
};

function FeatureAttributes(props: Props) {
    const query = useQuery({
        queryKey: [`feature-${props.layerId}::${props.featureId}`],
        queryFn: async () => {
            const resp = await invoke("get_feature_attributes", { ...props });
            return resp as Field[];
        },
    });

    if (query.isPending) {
        return <div>pending...</div>;
    }

    if (query.isError) {
        return <div>error</div>;
    }

    return (
        <ul style={{ margin: 25 }}>
            {query.data.map((f, index) => (
                <li key={index}>
                    {f.name} {f.value}
                </li>
            ))}
        </ul>
    );
}

export default FeatureAttributes;
