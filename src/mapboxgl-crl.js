import tileCover from 'mapbox-gl/src/util/tile_cover';
import Tile from 'mapbox-gl/src/source/tile';
import MercatorCoordinate from 'mapbox-gl/src/geo/mercator_coordinate';

function zoomToScale(zoom) {
    return Math.pow(2, zoom);
}
  
export class CustomRasterLayer {
    constructor(options) {
        this.map = null;
        this.source = null;
        this.id = options.id;
        this.type = 'custom';
        this.tileUrls = options.tiles;
        this.sourceName = null;
        this.options = options;
        this.loadedTiles = [];
        this.tileCount = 0;
    }
    _init() {
        this.map.addSource(this.sourceName, { 'type': 'raster', 'tiles': this.tileUrls });
        this.source = this.map.getSource(this.sourceName);

        this.source.on('data', (e) => {
            if (e.sourceDataType == 'content')
                this.loadTiles();
        });
    }
    loadTiles() {
        const currentZoomLevel = this.map.getZoom();
        const currentScale = zoomToScale(currentZoomLevel);
        const flooredZoom = Math.floor(currentZoomLevel);
    
        let bounds = map.getBounds();

        let tiles = tileCover(flooredZoom, [
            MercatorCoordinate.fromLngLat(bounds.getSouthWest()),
            MercatorCoordinate.fromLngLat(bounds.getNorthEast()),
            MercatorCoordinate.fromLngLat(bounds.getNorthWest()),
            MercatorCoordinate.fromLngLat(bounds.getSouthEast())
        ], flooredZoom, false );
        this.tileCount = tiles.length;

        tiles.forEach(tile => {
            let inTile = new Tile(tile, this.source.tileSize);
            this.source.loadTile(inTile, () => {
                this.tileLoaded(inTile);
            });
        });
    }
    tileLoaded(tile) {
        this.loadedTiles.push(tile);
    }
    onAdd(map, gl) {
        this.map = map;
        this.gl = gl;
        this.sourceName = this.id + 'Source';

        this._init();
    }
    render(gl, matrix) {
        
    }
}
