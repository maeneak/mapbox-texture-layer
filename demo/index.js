mapboxgl.accessToken = 'pk.eyJ1IjoiY3JpdGljYWxtYXNzIiwiYSI6ImNqaGRocXd5ZDBtY2EzNmxubTdqOTBqZmIifQ.Q7V0ONfxEhAdVNmOVlftPQ';

const map = new mapboxgl.Map({
    container: document.getElementById('map'),
    //style: 'mapbox://styles/criticalmass/cjvth8ljy0dl01co02owu49ka',
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
    center: [145, -16],
    zoom: 0
});
map.on('load', function () {
    let customlayer = new Custom.TextureLayer({id: 'test', tiles: ['https://nova.criticalmass.com.au:453/mapserver?map=../maps/gfs/uvencode.v001.map&mode=tile&layers=windgl&tilemode=gmap&tile={x} {y} {z}.png']})
    map.addLayer(customlayer, 'ferry');
});

