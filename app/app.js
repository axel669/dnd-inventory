(function () {
    'use strict';

    const createReducer = (desc) => {
        var ref0;

        const reducers = [];
        for (const key of Object.keys((ref0 = desc))) {
            const map = ref0[key];
            const reducer = (() => {
                if (typeof map === "function") {
                    return map;
                } else {
                    return createReducer(map);
                }
            })();
            reducers.push([key, reducer]);
        }
        return async (state, action) => {
            const newState = {};
            for (const [key, reducer] of reducers) {
                newState[key] = await reducer(state[key], action);
            }
            return newState;
        };
    };
    const generateStateInfo = (source, desc) => {
        var ref0, ref1;

        const reducers = {};
        const initialState = {};
        let definedActions = new Set();
        for (const key of Object.keys((ref0 = desc))) {
            const info = ref0[key];
            const path = source !== null ? `${source}.${key}` : key;
            const initial = info.initial;
            if (initial === undefined) {
                const child = generateStateInfo(path, info);
                [reducers[key], initialState[key]] = child;
                definedActions = new Set([...definedActions, ...child[2]]);
            } else {
                const actionHandlers = {};
                for (const action of Object.keys((ref1 = info))) {
                    const func = ref1[action];
                    actionHandlers[action] = func;
                    if (action.startsWith("$") === true) {
                        definedActions.add(`${path}.${action}`);
                    }
                    if (action.indexOf("$") > 0) {
                        definedActions.add(action);
                    }
                }
                initialState[key] =
                    typeof initial === "function" ? initial() : initial;
                reducers[key] = async (state, action) => {
                    let actions = [action];
                    if (action.type === "batch") {
                        actions = action.actions;
                    }
                    let newState = state;
                    for (const action of actions) {
                        let type = action.type;
                        if (type.startsWith(`${path}.`) === true) {
                            type = type.slice(path.length + 1, undefined);
                        }
                        const reducer = actionHandlers[type];
                        if (reducer !== undefined) {
                            newState = await reducer(newState, action);
                        }
                    }
                    return newState;
                };
            }
        }
        return [reducers, initialState, definedActions];
    };
    const createState = (desc, actionProcessors = {}) => {
        const [reducers, initialState, definedActions] = generateStateInfo(
            null,
            desc
        );
        const reducer = createReducer(reducers);
        const dispatch = async (action) => {
            currentState = await reducer(currentState, action);
            for (const listener of subscriptions.values()) {
                listener(currentState);
            }
            return currentState;
        };
        const actions = [...definedActions].reduce(
            (actions, type) => {
                var nullref0;

                const preProcessor =
                    (nullref0 = actionProcessors[type]) != null
                        ? nullref0
                        : (i) => i;
                return {
                    ...actions,
                    [type]: (...args) =>
                        dispatch({
                            type: type,
                            ...preProcessor(...args)
                        })
                };
            },
            {
                $batch: (...pairs) =>
                    dispatch({
                        type: "batch",
                        actions: pairs.map(([type, data]) => ({
                            type: type,
                            ...data
                        }))
                    })
            }
        );
        let currentState = initialState;
        const subscriptions = new Map();
        const subscribe = (listener) => {
            const key = `${Math.random()}:${Date.now()}`;
            subscriptions.set(key, listener);
            return () => subscriptions.delete(key);
        };
        const validActions = [...definedActions].sort();
        return {
            get state() {
                return currentState;
            },
            get current() {
                return currentState;
            },
            actions: actions,
            subscribe: subscribe,
            get validActions() {
                return [...validActions];
            }
        };
    };

    const MapList = (() => {
        const construct = function construct(list = [], items = {}) {
            const self = {};
            Object.defineProperties(this, {
                list: {
                    get: () =>
                        self.list.map((id) => ({
                            id: id,
                            info: self.items[id]
                        }))
                }
            });
            this.add = (item) => {
                const id = `${Date.now()}.${Math.random()}`;
                return MapList([...self.list, id], {
                    ...self.items,
                    [id]: item
                });
            };
            this.updateItem = (id, newItem) =>
                MapList(self.list, {
                    ...self.items,
                    [id]: newItem
                });
            this.item = (id) => self.items[id];
            this.index = (index) => self.items[self.list[index]];
            [self.list, self.items] = [list, items];
            return this;
        };
        return (...args) => construct.apply({}, args);
    })();
    window.wat = createState(
        {
            chars: {
                initial: () => [],
                $add: (chars, { type, ...ch }) => [...chars, ch]
            },
            bags: {
                initial: () => ({}),
                "chars.$add": (bags, { id }) => ({
                    ...bags,
                    [id]: MapList()
                }),
                $add: (bags, { id, item }) => ({
                    ...bags,
                    [id]: bags[id].add(item)
                }),
                $update: (bags, { id, item }) => ({
                    ...bags,
                    [id]: bags[id].updateItem(item.id, item.info)
                })
            }
        },
        {
            "chars.$add": (name) => ({
                name: name,
                id: Date.now()
            }),
            "bags.$add": (id, item) => ({
                id: id,
                item: item
            }),
            "bags.$update": (id, item) => ({
                id: id,
                item: item
            })
        }
    );
    const { actions: actions$1, ...state } = wat;

    console.log(state, actions$1);
    const { Component, PureComponent } = React;
    const createMatcher = (route, exact) => {
        const names = [];
        const regexParts = route
            .replace(/^\//, ``)
            .split("/")
            .map((check) => {
                if (check.startsWith(":") === true) {
                    const name = check.slice(1, undefined);
                    names.push(name);
                    return "(\\w+)";
                }
                if (check.startsWith("*") === true) {
                    const name = check.slice(1, undefined);
                    names.push(name);
                    return "(.*)";
                }
                return check;
            });
        const endMatch = exact === true ? "$" : ``;
        const regex = RegExp(`^/?${regexParts.join("/")}/?${endMatch}`);
        return (route) => {
            const match = route.match(regex);
            if (match === null) {
                return null;
            }
            return names.reduce(
                (params, name, index) => ({
                    ...params,
                    [name]: match[index + 1]
                }),
                {}
            );
        };
    };
    const Router = (() => {
        const construct = function construct(routeListener) {
            const self = {};
            Object.defineProperties(this, {});
            this.connect = (route, exactMatch = false) => {
                const matcher = createMatcher(route, exactMatch);
                return (Component) => {
                    var _class0, nullref0;

                    return (
                        (_class0 = class extends React.Component {
                            constructor(props) {
                                super(props);
                                this.state = self.routeListener.state;
                            }
                            componentDidMount() {
                                self.unsub = self.routeListener.subscribe(
                                    (newState) => this.setState(newState)
                                );
                            }
                            componentWillUnmount() {
                                return self.ubsub();
                            }
                            render() {
                                const params = matcher(this.state.path);
                                if (params === null) {
                                    return null;
                                }
                                return React.createElement(Component, {
                                    ...this.props,
                                    _router: {
                                        ...this.state,
                                        params: params
                                    }
                                });
                            }
                        }),
                        (_class0.displayName = `Router[${
                        (nullref0 = Component.displayName) != null
                            ? nullref0
                            : Component.name
                    }]`),
                        _class0
                    );
                };
            };
            self.routeListener = routeListener;
            return this;
        };
        return (...args) => construct.apply({}, args);
    })();
    const Publisher = (() => {
        const construct = function construct() {
            const self = {};
            Object.defineProperties(this, {});
            this.publish = (message) => {
                for (const handler of self.listeners.values()) {
                    handler(message);
                }
            };
            this.subscribe = (handler) => {
                const id = `${Date.now()}.${Math.random()}`;
                self.listeners.set(id, handler);
                return () => self.listeners.delete(id);
            };
            self.listeners = new Map();
            return this;
        };
        return (...args) => construct.apply({}, args);
    })();
    const HashListener = (() => {
        const construct = function construct() {
            const self = {};
            Object.defineProperties(this, {
                hash: {
                    get: () => location.hash.toString().replace(/^#/, ``)
                },
                state: {
                    get: () => ({
                        path: this.hash,
                        parts: this.hash.split("/")
                    })
                },
                subscribe: {
                    get: () => self.publisher.subscribe
                },
                publish: {
                    get: () => self.publisher.publish
                }
            });
            self.publisher = Publisher();
            self.currentHash = this.hash;
            self.interval = setInterval(() => {
                const hash = this.hash;
                if (hash !== self.currentHash) {
                    self.currentHash = hash;
                    this.publish({
                        path: hash,
                        parts: hash.split("/")
                    });
                }
            }, 50);
            return this;
        };
        return (...args) => construct.apply({}, args);
    })();
    const MainRouter = Router(HashListener());
    class Main extends Component {
        constructor(props) {
            super(props);
            this.state = state.current;
            state.subscribe((newState) => this.setState(newState));
        }
        render() {
            return React.createElement(
                "div",
                {},
                React.createElement(CharList, {
                    chars: this.state.chars
                }),
                React.createElement(BagDisplay, {
                    bags: this.state.bags
                })
            );
        }
    }
    window.appActions = actions$1;
    const CharList = MainRouter.connect(
        "/",
        true
    )(
        class CharList extends PureComponent {
            addChar() {
                const name = prompt(``);
                if (name === null || name.trim() === ``) {
                    return;
                }
                actions$1["chars.$add"](name);
            }
            render() {
                return React.createElement(
                    "div",
                    {},
                    React.createElement(
                        "button",
                        {
                            onClick: this.addChar
                        },
                        "Add Char"
                    ),
                    this.props.chars.map((ch) =>
                        React.createElement(
                            "div",
                            {},
                            React.createElement(
                                "a",
                                {
                                    href: `#/${ch.id}`
                                },
                                ch.name
                            )
                        )
                    )
                );
            }
        }
    );
    const BagDisplay = MainRouter.connect("/:bagID")(
        class BagDisplay extends PureComponent {
            render() {
                return React.createElement("div", {}, "Items?!");
            }
        }
    );
    const screens = [CharList].reduce(
        (screens, screen) => ({
            ...screens,
            [screen.name]: screen
        }),
        {}
    );
    ReactDOM.render(
        React.createElement(Main, {}),
        document.querySelector("app-root")
    );

}());
