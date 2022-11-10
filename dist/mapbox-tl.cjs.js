'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class TextureLayer {
  constructor(id, tileJson, onAddCallback, renderCallback, preRenderCallback) {
    this.map = null;
    this.gl = null;
    this.id = id;
    this.tileSource = null;
    this.source = this.id + 'Source';
    this.type = 'custom';
    this.tileJson = tileJson;
    this.program = null;
    this.onAddCallback = onAddCallback;
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
    this.sourceCache = this.map.style._sourceCaches[`other:${this.source}`];

    // !IMPORTANT! hack to make mapbox mark the sourceCache as 'used' so it will initialise tiles.
    this.map.style._layers[this.id].source = this.source;
    if (this.onAddCallback)
      this.onAddCallback(map, gl);
  }

  move(e) {
    this.updateTiles();
  }

  zoom(e) {

  }

  onData(e) {
    if (e.sourceDataType === 'content')
      this.updateTiles();
  }

  updateTiles() {
    this.sourceCache.update(this.map.painter.transform);
  }

  prerender(gl, matrix) {
    if (this.preRenderCallback)
      this.preRenderCallback(
        gl,
        matrix,
        this.sourceCache.getVisibleCoordinates().map(tileid => this.sourceCache.getTile(tileid))
      );
  }

  render(gl, matrix) {
    if (this.renderCallback)
      this.renderCallback(
        gl,
        matrix,
        this.sourceCache.getVisibleCoordinates().map(tileid => this.sourceCache.getTile(tileid))
      );
  }
}

exports.TextureLayer = TextureLayer;
