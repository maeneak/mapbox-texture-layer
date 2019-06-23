import tileCover from 'mapbox-gl/src/util/tile_cover';
import MercatorCoordinate from 'mapbox-gl/src/geo/mercator_coordinate';
import {Tile} from './Tile';

function zoomToScale(zoom) {
    return Math.pow(2, zoom);
}

export class TextureSource {
    constructor(options) {
        this.id = options.id;
        this.tileUrls = options.tiles;
        this.tileSize = options.tileSize;
        this.layer = options.layer;
        this.NotifyTileUpdate = options.updates;
        this.map = options.map;
        this.gl = options.gl;
        this.tileCache = [];
        this.matrixCache = [];
        this.visibleTileCount = 0;

        this.map.on('move', this.move.bind(this));
        this.map.on('zoom', this.zoom.bind(this));
        this.map.addSource(this.id, { 'type': 'raster', 'tiles': this.tileUrls, tileSize: this.tileSize});
        this.source = this.map.getSource(this.id);
        this.source.on('data', this.onData.bind(this));
    }
    onData(e) {
        if (e.sourceDataType == 'content')
            this.updateTiles();
        else if (e.sourceDataType == 'metadata')
            console.log(e);
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
        const currentZoomLevel = this.map.getZoom();
        const currentScale = zoomToScale(currentZoomLevel);
        const flooredZoom = Math.floor(currentZoomLevel);
    
        const bounds = this.map.getBounds();
        this.visibleTiles = tileCover(flooredZoom, [
          MercatorCoordinate.fromLngLat(bounds.getSouthWest()),
          MercatorCoordinate.fromLngLat(bounds.getNorthEast()),
          MercatorCoordinate.fromLngLat(bounds.getNorthWest()),
          MercatorCoordinate.fromLngLat(bounds.getSouthEast())
        ], currentZoomLevel, true);

        this.visibleTileCount = this.visibleTiles.length;

        this.visibleTiles
        .forEach(tileid => {
            if (!this.tileCache[tileid.canonical.key])
                this.tileCache[tileid.canonical.key] = new Tile(tileid, this.source, this.tileLoaded.bind(this));
            this.matrixCache[tileid.key] = map.painter.transform.calculatePosMatrix(tileid.toUnwrapped(), !this.map.painter.options.moving)
        });
    }
    tileLoaded() {
        this.map.triggerRepaint();
    }
}