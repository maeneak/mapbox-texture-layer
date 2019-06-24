'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vertexSource = "#define GLSLIFY 1\nattribute vec2 aPos;\nuniform mat4 uMatrix;\nvarying vec2 vTexCoord;\n\nfloat Extent = 8192.0;\n\nvec4 toScreen(vec2 pos) { return vec4(pos.x * Extent, pos.y * Extent, 0, 1); }\n\nvoid main() {\n    vec4 a = uMatrix * toScreen(aPos);\n    gl_Position = vec4(a.rgba);\n    vTexCoord = aPos;\n}\n"; // eslint-disable-line

var fragmentSource = "precision mediump float;\n#define GLSLIFY 1\nvarying vec2 vTexCoord;\nuniform sampler2D uTexture;\nvoid main() {\n    vec4 color = texture2D(uTexture, vTexCoord);\n\n    gl_FragColor = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, 1);\n}           \n"; // eslint-disable-line

class TextureLayer {
    constructor(id, tileJson, renderCallback, preRenderCallback) {
        this.map = null;
        this.gl = null;
        this.id = id;
        this.tileSource = null;
        this.source = this.id + 'Source';
        this.type = 'custom';
        this.tileJson = tileJson;
        this.program = null;
        this.renderCallback = renderCallback;
        this.preRenderCallback = preRenderCallback;
    }
    onAdd(map, gl) {
        this.map = map;
        this.gl = gl;
        map.on('move', this.move.bind(this));
        map.on('zoom', this.zoom.bind(this));

        map.addSource(this.source, this.tileJson);
        this.tileSource = this.map.getSource(this.source);
        this.tileSource.on('data', this.onData.bind(this));
        this.sourceCache = this.map.style.sourceCaches[this.source];

        // !IMPORTANT! hack to make mapbox mark the sourceCache as 'used' so it will initialise tiles.
        this.map.style._layers[this.id].source = this.source;

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
        this.program.uTexture = gl.getUniformLocation(this.program, "uTexture");

        const vertexArray = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    }
    move(e) {
        this.updateTiles();
    }
    zoom(e) {

    }
    onData(e) {
        if (e.sourceDataType == 'content')
            this.updateTiles();
    }
    updateTiles() {
        this.sourceCache.update(this.map.painter.transform);
    }
    render(gl, matrix) {
        gl.useProgram(this.program);
        let cache = this.sourceCache;
        let visibleTiles = cache.getVisibleCoordinates();

        visibleTiles.forEach(tileid => {
            let tile = cache.getTile(tileid);
            if (!tile.texture) return;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tile.texture.texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.program.a_pos);
            gl.vertexAttribPointer(this.program.aPos, 2, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(this.program.uMatrix, false, tile.tileID.posMatrix);
            gl.uniform1i(this.program.uTexture, 0);
            gl.depthFunc(gl.LESS);
            //gl.enable(gl.BLEND);
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        });
    }
}

exports.TextureLayer = TextureLayer;
