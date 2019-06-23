
attribute vec2 aPos;
//attribute vec2 aTexCoord;
uniform mat4 uMatrix;
uniform mat4 uProjMatrix;
uniform mat4 uPixelMatrix;
uniform mat4 uPosMatrix;
varying vec2 vTexCoord;

void main() {
    vec4 a = uMatrix * vec4(aPos, 0, 1);
    gl_Position = vec4(a.rgba);
    vTexCoord = aPos;
}
