/**
 * Webpack Configuration for Bundle Size Optimization and Tree Shaking
 * 
 * Comprehensive bundle size optimization and tree shaking configuration.
 * 
 * @module WebpackConfig
 * @version 1.0.0
 * @author Adriano To The Star
 */

const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        main: './stellar-ai.js',
        database: './database.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true
    },
    optimization: {
        usedExports: true,
        sideEffects: false,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                },
                common: {
                    minChunks: 2,
                    chunks: 'all',
                    enforce: true
                }
            }
        },
        minimize: true,
        minimizer: [
            '...',
            new (require('terser-webpack-plugin'))({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true
                    }
                }
            })
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json']
    }
};

