const webpack = require('webpack');
const path = require('path');

function getPlugin() {
    if(process.env.NODE_ENV === 'production') {
       return [
            new webpack.optimize.UglifyJsPlugin()
        ];
    } else {
        return [

        ];
    }
}

config = {
    entry: {
        sketch: ['./src/sketch.ts']
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './www/')
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions:['.ts', '.tsx', '.js'],
        alias: {

        }
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: { 
                            minimize: true
                        }
                    },
                    'sass-loader?sourceMap'
                ]
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: {loader: 'html-loader'}
            },
            {   
                test: /\.tsx?$/,
                use: 'ts-loader'
            }
        ]
    },
    plugins: getPlugin()
};

module.exports = config;