import React, {PureComponent} from "react";
import doric from "doric-components";

import sheet from "../style.js";
import yggdrasil from "../yggdrasil.js";

sheet.addStyles({
    "div.test doric-col, div.test doric-button": {
        height: 30
    },
    "div.test > doric-grid > div:nth-child(even) > *": {
        backgroundColor: 'lightgray'
    }
});

@doric.dialogify
class ItemList extends PureComponent {
    static propList = ['itemList']

    render() {
        return <div className="test">
            <doric.grid>
                {this.props.itemList.map(
                    (item) => {
                        const onTap = () => yggdrasil.items.add(item);
                        return <div key={item.id}>
                            <doric.grid.col size={8}>
                                {item.name}
                            </doric.grid.col>
                            <doric.grid.col size={2}>
                                {item.price}
                            </doric.grid.col>
                            <doric.grid.col size={2}>
                                <doric.iconButton block flush icon="ion-plus" onTap={onTap} />
                            </doric.grid.col>
                        </div>
                    }
                )}
            </doric.grid>
        </div>
    }
}

export default ItemList