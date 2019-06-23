import {TextureSource} from './TextureSource';
import vertexSource from './shaders/raster.vert';
import fragmentSource from './shaders/raster.frag';

export class TextureLayer {
    constructor(options) {
        this.map = null;
        this.gl = null;
        this.source = null;
        this.id = options.id;
        this.type = 'custom';
        this.tileUrls = options.tiles;
        this.program = null;
        this.options = options;
    }
    onAdd(map, gl) {
        this.map = map;
        this.gl = gl;

        this.source = new TextureSource({
            id: this.id + 'Source', 
            tiles: this.tileUrls, 
            updates: this.update, 
            tileSize: this.options.tileSize ? this.options.tileSize : 256,
            map: this.map,
            gl: this.gl
        });

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        gl.validateProgram(this.program);

        this.program.aPos = gl.getAttribLocation(this.program, "aPos");
        //this.program.aTexCoord = gl.getAttribLocation(this.program, "aTexCoord");
        this.program.uMatrix = gl.getUniformLocation(this.program, "uMatrix");
        this.program.uTexture = gl.getUniformLocation(this.program, "uTexture");

        const vertexArray = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    }
    update() {

    }
    render(gl, matrix) {
        //this.map.showTileBoundaries = true;
        gl.useProgram(this.program);

        this.source.visibleTiles
        //.filter(x => this.source.tileCache[x.key].textureLoaded)
        .map(id => this.source.tileCache[id.key])
        .forEach(tile => {
            //let tile = this.source.tileCache[tileid.key]
            if (!tile.textureLoaded) return;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tile.texture.texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.program.a_pos);
            gl.vertexAttribPointer(this.program.aPos, 2, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(this.program.uMatrix, false, tile.posMatrix);
            gl.uniform1i(this.program.uTexture, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        });
    }
}
