mapboxgl.accessToken = 'pk.eyJ1IjoiY3JpdGljYWxtYXNzIiwiYSI6ImNqaGRocXd5ZDBtY2EzNmxubTdqOTBqZmIifQ.Q7V0ONfxEhAdVNmOVlftPQ';

const map = new mapboxgl.Map({
    container: document.getElementById('map'),
    style: 'mapbox://styles/mapbox/bright-v8',
    center: [145, -16],
    zoom: 0
});
map.on('load', function () {
    let customlayer = new mapboxgl.TextureLayer('test', {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png']
    })
    map.addLayer(customlayer);
});

