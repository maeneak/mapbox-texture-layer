import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/TextureLayer.js',
    output: [
      {
        file: 'dist/mapbox-tl.esm.js',
        format: 'esm'
      },
      {
        file: 'dist/mapbox-tl.cjs.js',
        format: 'cjs'
      },
      {
        entry: './src/TextureLayer.js',
        file: 'dist/mapbox-tl.umd.js',
        format: 'umd',
        name: 'mapboxgl',
        extend: true
      },
      {
        entry: './src/TextureLayer.js',
        file: 'demo/mapbox-tl.umd.js',
        format: 'umd',
        name: 'mapboxgl',
        extend: true
      }],
      plugins: [ 
        resolve({
          browser: true,
          preferBuiltins: false
        }),
        commonjs({
            ignoreGlobal: true
        })
    ]
  }]
