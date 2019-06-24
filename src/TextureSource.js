
export class TextureSource {
    constructor(id, tileJson, map, gl) {
        this.id = id;
        this.tileJson = tileJson;
        this.map = map;
        this.gl = gl;

        this.map.on('move', this.move.bind(this));
        this.map.on('zoom', this.zoom.bind(this));

        this.map.addSource(this.id, tileJson);
        this.source = this.map.getSource(this.id);
        this.source.on('data', this.onData.bind(this));
        this.sourceCache = this.map.style.sourceCaches[this.id];
    }
    onData(e) {
        if (e.sourceDataType == 'content')
            this.updateTiles();
    }
    onRemove() {

    }
    move(e) {
        this.updateTiles();
    }
    zoom(e) {
        //this.updateTiles();
    }
    updateTiles() {
        this.sourceCache.update(this.map.painter.transform);
    }
    tileLoaded() {
        this.map.triggerRepaint();
    }
}