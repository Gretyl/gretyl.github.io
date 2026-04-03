// shaders.js — Shader presets, wrapping logic, and custom uniform parsing.
// Shared between shadertoy.html (browser) and Node.js tests.

const PREAMBLE = `#version 300 es
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform vec4  iMouse;
uniform int   iFrame;
`;

const EPILOGUE = `
void main() {
  mainImage(fragColor_out, gl_FragCoord.xy);
}
`;

/**
 * Parse @slider annotations from user shader code.
 * Format: uniform float name; // @slider min max default
 * Returns [{name, min, max, value}]
 */
export function parseCustomUniforms(code) {
  const results = [];
  const re = /uniform\s+float\s+(\w+)\s*;\s*\/\/\s*@slider\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    results.push({
      name: m[1],
      min: parseFloat(m[2]),
      max: parseFloat(m[3]),
      value: parseFloat(m[4]),
    });
  }
  return results;
}

/**
 * Wrap user code into a complete fragment shader source.
 * Custom uniform declarations from @slider annotations are injected
 * into the preamble so they are available alongside the built-in uniforms.
 */
export function wrapFragmentShader(userCode) {
  const customs = parseCustomUniforms(userCode);
  const customDecls = customs
    .map((u) => `uniform float ${u.name};`)
    .join('\n');
  const preamble =
    PREAMBLE +
    (customDecls ? customDecls + '\n' : '') +
    'out vec4 fragColor_out;\n';
  return preamble + '\n' + userCode + EPILOGUE;
}

/**
 * Number of lines in the preamble (before user code starts).
 * Used to offset GLSL error line numbers so they match the editor.
 */
export function preambleLineCount(userCode) {
  const customs = parseCustomUniforms(userCode);
  const wrapped = wrapFragmentShader(userCode);
  const beforeUser = wrapped.split(userCode)[0];
  return beforeUser.split('\n').length - 1;
}

// ---------------------------------------------------------------------------
// Preset shaders
// ---------------------------------------------------------------------------

export const PRESETS = {
  'Simple Gradient': `// Maps UV coordinates to RGB color.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
}
`,

  'Plasma Waves': `// Animated sine-wave interference pattern.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float t = iTime * 0.8;

  float v = 0.0;
  v += sin(uv.x * 10.0 + t);
  v += sin((uv.y * 10.0 + t) * 0.5);
  v += sin((uv.x * 10.0 + uv.y * 10.0 + t) * 0.3);
  v += sin(length(uv - 0.5) * 14.0 - t * 2.0);

  vec3 col = vec3(
    sin(v * 3.14159) * 0.5 + 0.5,
    sin(v * 3.14159 + 2.094) * 0.5 + 0.5,
    sin(v * 3.14159 + 4.189) * 0.5 + 0.5
  );
  fragColor = vec4(col, 1.0);
}
`,

  'Circle SDF': `// Signed-distance circle. Click to move center.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

  // Use mouse position as circle center when clicked
  vec2 center = vec2(0.0);
  if (iMouse.z > 0.0) {
    center = (2.0 * iMouse.xy - iResolution.xy) / iResolution.y;
  }

  float d = length(uv - center) - 0.4;

  // Color: cyan inside, dark outside, bright edge
  vec3 col = (d < 0.0) ? vec3(0.13, 0.83, 0.93) * 0.3 : vec3(0.06, 0.06, 0.12);
  col += vec3(0.13, 0.83, 0.93) * exp(-80.0 * d * d);
  col += vec3(0.13, 0.83, 0.93) * 0.6 * exp(-8.0 * abs(d));

  fragColor = vec4(col, 1.0);
}
`,

  'Mandelbrot Fractal': `// Classic Mandelbrot set with slow zoom.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float zoom = 1.0 + iTime * 0.15;
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / (iResolution.y * zoom);
  uv += vec2(-0.745, 0.186); // interesting region

  vec2 z = vec2(0.0);
  vec2 c = uv;
  float iter = 0.0;
  const float maxIter = 128.0;

  for (float i = 0.0; i < maxIter; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) break;
    iter++;
  }

  float t = iter / maxIter;
  vec3 col = 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67)));
  if (iter >= maxIter) col = vec3(0.0);

  fragColor = vec4(col, 1.0);
}
`,

  'Raymarched Sphere': `// Raymarched sphere + ground with Phong shading.
// Drag the slider to adjust field of view.
uniform float lensLength; // @slider 0.5 5.0 2.0

float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdPlane(vec3 p)           { return p.y + 0.5; }

float scene(vec3 p) {
  float d = sdSphere(p - vec3(0.0, 0.0, 0.0), 0.5);
  d = min(d, sdPlane(p));
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(p + e.xyy) - scene(p - e.xyy),
    scene(p + e.yxy) - scene(p - e.yxy),
    scene(p + e.yyx) - scene(p - e.yyx)
  ));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

  // Camera
  vec3 ro = vec3(0.0, 0.3, -2.0);
  vec3 rd = normalize(vec3(uv, lensLength));

  // Raymarch
  float t = 0.0;
  for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;
    float d = scene(p);
    if (d < 0.001 || t > 20.0) break;
    t += d;
  }

  vec3 col = vec3(0.05, 0.05, 0.12); // background
  if (t < 20.0) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    // Rotating light
    vec3 lightPos = vec3(2.0 * sin(iTime), 1.5, -1.0 + 2.0 * cos(iTime));
    vec3 l = normalize(lightPos - p);

    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(reflect(-l, n), -rd), 0.0), 32.0);
    float amb = 0.15;

    // Material: cyan for sphere, grey for ground
    vec3 mat = (p.y > -0.49) ? vec3(0.13, 0.83, 0.93) : vec3(0.5);
    col = mat * (amb + diff) + vec3(1.0) * spec * 0.5;
  }

  fragColor = vec4(col, 1.0);
}
`,
};

export const DEFAULT_PRESET = 'Simple Gradient';
