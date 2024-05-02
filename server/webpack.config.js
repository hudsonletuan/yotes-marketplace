const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './src/app.ts',
    mode: 'production',
    target: 'node',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist')
    },

    optimization: {
        minimizer: [ new TerserPlugin({ extractComments: false }) ]
    },

    resolve: {
        extensions: ['.ts', '.js']
    },

    module: {
        rules: [
            { test: /\.ts$/, use: [ 'ts-loader' ] }
        ]
    },
}