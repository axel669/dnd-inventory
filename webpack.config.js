const path = require("path");

module.exports = {
    entry: './src/main.tea',
    // entry: './src/main.js',
    // entry: './src/main.coffee',
    output: {
        filename: 'app.js',
        path: __dirname
    },
    devtool: 'inline-source-map',
    mode: 'development',
    node: {
        global: false
    },
    resolve: {
        alias: {
            "@store": path.resolve(__dirname, "src", "store"),
            "@screen": path.resolve(__dirname, "src", "screen"),
            "@component": path.resolve(__dirname, "src", "components"),
            "@core": path.resolve(__dirname, "src")
        }
    },
    module: {
        rules: [
            {
                test: /\.tea$/,
                // test: /\.js$/,
                exclude: /node_modules/,
                // include: path.resolve(__dirname, "src"),
                loader: 'babel-loader!@axel669/teascript-loader'
                // loader: 'babel-loader'
            }
            // {
            //     // test: /\.tea$/,
            //     test: /\.js$/,
            //     exclude: /(node_modules|redux)/,
            //     // loader: 'babel-loader!@axel669/teascript-loader'
            //     loader: 'babel-loader'
            // }
            // {
            //     test: /\.json$/,
            //     loader: 'json-loader'
            // },
            // {
            //     test: /\.coffee$/,
            //     loader: "babel-loader!coffee-loader"
            // },
            // {
            //     // test: /\.coffee$/,
            //     test: /\.js$/,
            //     use: [
            //         // {loader: "coffee-loader"},
            //         {
            //             loader: "babel-loader"
            //         }
            //     ]
            //     // loader: "coffee-loader",
            //     // options: {
            //     //     transpile: {}
            //     // }
            //     // loaders: ['babel-loader', 'coffee-loader']
            //     // loader: 'babel-loader!coffee-loader'
            // }
        ]
    }
};
