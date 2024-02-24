import VisibleIcon from "mdi-material-ui/Eye";
import HiddenIcon from "mdi-material-ui/EyeOff";

type Props = {
    visible: boolean;
    onShow: () => void;
    onHide: () => void;
};

function Visibility(props: Props) {
    return props.visible ? (
        <VisibleIcon
            style={{ cursor: "pointer", margin: 5 }}
            onClick={props.onHide}
        />
    ) : (
        <HiddenIcon
            style={{ cursor: "pointer", margin: 5 }}
            onClick={props.onShow}
        />
    );
}

export default Visibility;
