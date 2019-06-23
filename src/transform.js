import * as mat4 from 'gl-matrix/mat4';

export function calculatePosMatrix(unwrappedTileID, currentScale, map, tileSize) {
  const canonical = unwrappedTileID.canonical;
  const scale = tileSize * (currentScale / map.painter.transform.zoomScale(canonical.z));
  const unwrappedX = canonical.x + Math.pow(2, canonical.z) * unwrappedTileID.wrap;

  const posMatrix = mat4.identity(new Float64Array(16));
  mat4.translate(posMatrix, posMatrix, [unwrappedX * scale, canonical.y * scale, 0]);
  mat4.scale(posMatrix, posMatrix, [scale / 8192, scale / 8192, 1]);
  // @ts-ignore
  mat4.multiply(posMatrix, map.painter.transform.projMatrix, posMatrix);

  return new Float32Array(posMatrix);
}

  function zoomScale(zoom) { return Math.pow(2, zoom); }
