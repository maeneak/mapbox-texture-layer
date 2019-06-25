import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import flowRemoveTypes from '@mapbox/flow-remove-types';

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
        flow(),
        resolve({
          browser: true,
          preferBuiltins: false
        }),
        commonjs({
            ignoreGlobal: true
        })
    ]
  }]

  export function flow() {
    return {
        name: 'flow-remove-types',
        transform: (code) => ({
            code: flowRemoveTypes(code).toString(),
            map: null
        })
    };
}