import MapboxTile from 'mapbox-gl/src/source/tile';

export class Tile extends MapboxTile {
    constructor(OverscaledTileID, source, cbTextureLoaded) {
        super(OverscaledTileID, source.tileSize);
        this.source = source;
        this.map = source.map;
        //this.posMatrix = () => map.painter.transform.calculatePosMatrix(this.tileID.toUnwrapped(), true);
        this.key = () => {this.tileID.canonical.key};
        source.loadTile(this, () => {
            this.textureLoaded = true;
            cbTextureLoaded();
        });
    }
}
