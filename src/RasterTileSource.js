import tileCover from 'mapbox-gl/src/util/tile_cover';
import MercatorCoordinate from 'mapbox-gl/src/geo/mercator_coordinate';
import Tile from 'mapbox-gl/src/source/tile';

function zoomToScale(zoom) {
    return Math.pow(2, zoom);
}

export class RasterTileSource {
    constructor(options) {
        this.id = options.id;
        this.tileUrls = options.tiles;
        this.tileSize = options.tileSize;
        this.layer = options.layer;
        this.onLayerRemove = this.onLayerRemove.bind(this);
        this.NotifyTileUpdate = options.updates;
        this.map = options.map;
        this.gl = options.gl;
        this.tiles = [];
        this.loadedTiles = [];
        this.visibleTileCount = 0;
        this.init();
    }
    init() {
        this.map.on('move', this.move.bind(this));
        this.map.on('zoomend', this.zoom.bind(this));

        this.map.addSource(this.id, { 'type': 'raster', 'tiles': this.tileUrls, tileSize: this.tileSize});
        this.source = this.map.getSource(this.id);
        this.source.on('data', (e) => {
            if (e.sourceDataType == 'content')
                this.loadTiles();
        });
    }
    onLayerRemove() {

    }
    move(e) {
        this.loadTiles();
    }
    zoom(e) {
        this.loadTiles();
    }
    loadTiles() {
        const currentZoomLevel = this.map.getZoom();
        const currentScale = zoomToScale(currentZoomLevel);
        const flooredZoom = Math.floor(currentZoomLevel);
        
        let bounds = map.getBounds();

        let visibleTiles = tileCover(flooredZoom, [
            MercatorCoordinate.fromLngLat(bounds.getSouthWest()),
            MercatorCoordinate.fromLngLat(bounds.getNorthEast()),
            MercatorCoordinate.fromLngLat(bounds.getNorthWest()),
            MercatorCoordinate.fromLngLat(bounds.getSouthEast())
        ], flooredZoom, false );
        this.visibleTileCount = visibleTiles.length;

        visibleTiles.forEach(tile => {
            let inTile = new Tile(tile, this.tileSize);
            if (!this.tiles.find(x => x.tileID.equals(tile))) {
                inTile.posMatrix = this.map.painter.transform.calculatePosMatrix(tile.toUnwrapped());
                this.tiles.push(inTile);
                this.source.loadTile(inTile, () => this.tileLoaded(inTile));
            }
        });
    }
    tileLoaded(tile) {
        tile.loaded = true;
    }
}