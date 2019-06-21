import {RasterTileSource} from './RasterTileSource';
  
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

        this.source = new RasterTileSource({
            id: this.id + 'Source', 
            tiles: this.tileUrls, 
            updates: this.update, 
            tileSize: this.options.tileSize ? this.options.tileSize : 256,
            map: this.map,
            gl: this.gl
        });
        const vertexSource = `
        attribute vec3 aPos;
        uniform mat4 uMatrix;
        uniform mat4 uPosMatrix;

        void main() {
            gl_Position = uMatrix * uPosMatrix * vec4(aPos, 1.0);
        }
        `;

        const fragmentSource = `
        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
        `;

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
        this.program.uMatrix = gl.getUniformLocation(this.program, "uMatrix");
        this.program.uPosMatrix = gl.getUniformLocation(this.program, "uPosMatrix");

        const x = 0.5;
        const y = 0.5;
        const z = 0.125;
        const d = 0.125;

        const vertexArray = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1
        ]);
        const indexArray = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

    }
    update() {

    }
    render(gl, matrix) {
        if (this.source.tiles.length) {
            let tile = this.source.tiles[0];
            gl.useProgram(this.program);

            gl.bindTexture(gl.TEXTURE_2D, tile.texture.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
            gl.enableVertexAttribArray(this.program.a_pos);
            gl.vertexAttribPointer(this.program.aPos, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(this.program.uMatrix, false, matrix);
            gl.uniformMatrix4fv(this.program.uPosMatrix, false, tile.posMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        }
    }
}
