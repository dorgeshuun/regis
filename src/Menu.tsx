import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

type Props = {
    open: boolean;
    x: number;
    y: number;
    onCloseMenu: () => void;
    onZoomToLayer: () => void;
    onOpenAttributeTable: () => void;
    onDeleteLayer: () => void;
};

function _Menu(props: Props) {
    const handleMenuClick = (func: () => void) => () => {
        props.onCloseMenu();
        func();
    };

    return (
        <Menu
            open={props.open}
            onClose={props.onCloseMenu}
            anchorReference="anchorPosition"
            anchorPosition={{ top: props.y, left: props.x }}
        >
            <MenuItem onClick={handleMenuClick(props.onZoomToLayer)}>
                zoom to layer
            </MenuItem>
            <MenuItem onClick={handleMenuClick(props.onOpenAttributeTable)}>
                attribute table
            </MenuItem>
            <MenuItem onClick={handleMenuClick(props.onDeleteLayer)}>
                delete layer
            </MenuItem>
        </Menu>
    );
}

export default _Menu;
