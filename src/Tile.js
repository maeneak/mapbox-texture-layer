import MapboxTile from 'mapbox-gl/src/source/tile';

export class Tile extends MapboxTile {
    constructor(OverscaledTileID, source) {
        super(OverscaledTileID, source.tileSize);
        this.map = source.map;
        this.posMatrix = map.painter.transform.calculatePosMatrix(this.tileID.toUnwrapped(), true);
        this.source.loadTile(this, () => this.textureLoaded = true);
        
    }
    key = () => {this.tileID.canonical.key}
}
