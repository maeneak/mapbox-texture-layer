
attribute vec2 aPos;
uniform mat4 uMatrix;
varying vec2 vTexCoord;

float Extent = 8192.0;

vec4 toScreen(vec2 pos) { return vec4(pos.x * Extent, pos.y * Extent, 0, 1); }

void main() {
    vec4 a = uMatrix * toScreen(aPos);
    gl_Position = vec4(a.rgba);
    vTexCoord = aPos;
}
