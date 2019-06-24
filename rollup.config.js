import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import flowRemoveTypes from '@mapbox/flow-remove-types';
import glslify from 'rollup-plugin-glslify';
import minify from "rollup-plugin-babel-minify";

export default [{
    input: 'src/TextureLayer.js',
    output: [{
      file: 'dist/mapbox-texture-layer.js',
      format: 'cjs'
    },{
      entry: './src/TextureLayer.js',
      file: 'demo/mapbox-texture-layer.js',
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
      }),
      glslify({ basedir: 'src/shaders' })
      //,minify()
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