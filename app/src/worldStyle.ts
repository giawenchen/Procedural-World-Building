import * as THREE from 'three'

export type Palette = 'forest' | 'graphite'
export type Surface = 'relief' | 'contours' | 'stipple' | 'illustrated' | 'studio'
export type Appearance = { surface: Surface }
export const PAPER = '#f5f3e9'
export const STUDIO = { water: '#82b3c2', sand: '#ddd0a5', meadow: '#a2b77f', forest: '#648569', rock: '#a99b88', snow: '#f4f0df' } as const
// These colors describe materials, independently of the interface accent.
export const WORLD = {
  water: '#327b9d', sand: '#c8ac72', soil: '#96734e',
  meadow: '#75934f', forest: '#365d3d', rock: '#8a837a', snow: '#edece1',
} as const
export function elevationColor(t: number, target = new THREE.Color()) {
  const stops = [0, .2, .44, .68, .86, 1]
  const colors = [WORLD.soil, WORLD.sand, WORLD.meadow, WORLD.forest, WORLD.rock, WORLD.snow]
  const value = THREE.MathUtils.clamp(t, 0, 1)
  let i = 0
  while (i < stops.length - 2 && value > stops[i + 1]) i++
  return target.set(colors[i]).lerp(new THREE.Color(colors[i + 1]), THREE.MathUtils.smoothstep(value, stops[i], stops[i + 1]))
}

export const ILLUSTRATED = { water: '#79afd0', sand: '#e5cb7e', meadow: '#a1af69', forest: '#42684d', rock: '#565b99', snow: '#fff8e6' } as const

// Appearance uniforms do not modify geometry, density samples or simulation state.
export function createAtlasMaterial(vertexColors = true) {
  return new THREE.ShaderMaterial({
    vertexColors, side: THREE.DoubleSide, lights: true, fog: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      sunDirection: { value: new THREE.Vector3(-.6, 1, .7).normalize() },
      groundMap: { value: null }, groundExtent: { value: 22 }, gridSpan: { value: 192 },
      hasGroundMap: { value: false },
      water: { value: new THREE.Color(WORLD.water) },
      sand: { value: new THREE.Color(WORLD.sand) }, meadow: { value: new THREE.Color(WORLD.meadow) },
      forest: { value: new THREE.Color(WORLD.forest) }, rock: { value: new THREE.Color(WORLD.rock) },
      snow: { value: new THREE.Color(WORLD.snow) },
      ink: { value: new THREE.Color('#373b68') },
      fieldOrigin: { value: new THREE.Vector2() },
      floorHeight: { value: 0 }, markScale: { value: 1 },
      surface: { value: 0 }, interval: { value: 2 }, radius: { value: 0 },
      amplitude: { value: 1 }, ocean: { value: false }, flatShading: { value: false },
      hard: { value: false }, useSamples: { value: vertexColors },
    },
    vertexShader: `
      #include <common>
      #include <shadowmap_pars_vertex>
      #include <fog_pars_vertex>
      varying vec3 vWorldPosition;
      varying vec3 worldNormal;
      varying vec3 sampleColor;
      varying float altitude;
      varying vec3 localPosition, radialUp;
      uniform float radius;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        localPosition = position;
        radialUp = normalize(mat3(modelMatrix) * normalize(position));
        worldNormal = normalize(mat3(modelMatrix) * normal);
        altitude = radius > 0.0 ? length(position) - radius : position.y;
        sampleColor = vec3(1.0);
        #ifdef USE_COLOR
          sampleColor = color;
        #endif
        vec4 mvPosition = viewMatrix * world;
        vec4 worldPosition = world;
        vec3 transformedNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * mvPosition;
        #include <shadowmap_vertex>
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      #include <common>
      #include <packing>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      #include <fog_pars_fragment>
      uniform vec3 sunDirection;
      uniform sampler2D groundMap;
      uniform float groundExtent, gridSpan;
      uniform bool hasGroundMap;
      uniform vec3 water, sand, meadow, forest, rock, snow, ink;
      uniform float surface, interval, amplitude, floorHeight, markScale, radius;
      uniform vec2 fieldOrigin;
      varying vec3 localPosition, radialUp;
      float pen(float phase, float width) {
        float d = abs(fract(phase + 0.5) - 0.5);
        float aa = max(fwidth(phase), 0.002);
        return 1.0 - smoothstep(width, width + aa, d);
      }
      uniform bool ocean, flatShading, hard, useSamples;
      varying vec3 vWorldPosition, worldNormal, sampleColor;
      varying float altitude;
      void main() {
        vec3 normal = normalize(worldNormal);
        if(flatShading) normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
        float light = clamp(dot(normal, sunDirection) * 0.5 + 0.5, 0.0, 1.0);
        if(hard) light = floor(light * 3.0) / 3.0;
        float t = max(altitude, 0.0) / max(amplitude, 0.001);
        vec3 land = mix(sand, meadow, smoothstep(0.07, 0.20, t));
        land = mix(land, forest, smoothstep(0.27, 0.43, t));
        land = mix(land, rock, smoothstep(0.48, 0.66, t));
        land = mix(land, snow, smoothstep(0.74, 0.9, t));
        vec3 base = useSamples ? sampleColor : land;
        if(ocean) base = water;
        vec3 paint = base * (0.55 + light * 0.45);
        if(surface > 3.5) {
          vec3 up = radius > 0.0 ? normalize(radialUp) : vec3(0.0, 1.0, 0.0);
          float slope = 1.0 - clamp(dot(normalize(worldNormal), up), 0.0, 1.0);
          float h = (altitude - floorHeight) / max(amplitude, 0.001);
          vec3 p = (localPosition + vec3(fieldOrigin.x, 0.0, fieldOrigin.y)) * markScale;
          float patches = sin(p.x * .8 + sin(p.z * .6)) * .5 + .5;
          paint = mix(sand, meadow, smoothstep(.08, .16, h));
          paint = mix(paint, forest, smoothstep(.24, .36, h) * (.28 + patches * .28));
          float exposed = max(smoothstep(.12, .36, slope) * smoothstep(.25, .46, h), smoothstep(.55, .68, h));
          paint = mix(paint, rock, exposed);
          paint = mix(paint, snow, smoothstep(.75, .89, h) * (1.0 - smoothstep(.2, .4, slope)));
          float facing = dot(normal, sunDirection);
          float sunlight = smoothstep(-.1, .65, facing);
          float shade = (1.0 - sunlight) * .85 + (1.0 - getShadowMask()) * .52;
          vec3 coolShadow = paint * vec3(.48, .59, .65);
          paint = mix(paint, coolShadow, clamp(shade, 0.0, .85));
          paint = mix(paint, paint * vec3(1.05, 1.02, .94), sunlight * .4);
          if(ocean) {
            float depth = 6.0;
            if(hasGroundMap && radius < .01) {
              float ground = (texture2D(groundMap, localPosition.xz / gridSpan + .5).r * 2.0 - 1.0) * groundExtent;
              depth = max(floorHeight - ground, 0.0);
            }
            paint = mix(mix(water, snow, .25), water * .84, smoothstep(0.0, 12.0, depth));
            float fresnel = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPosition)), 0.0), 3.0);
            paint = mix(paint, snow, fresnel * .3);
            float shore = 1.0 - smoothstep(.1, 1.1, depth);
            paint = mix(paint, snow, shore * .5);
            float ripple = pen(p.z * 2.4 + sin(p.x * .9) * .12, .015);
            paint = mix(paint, snow, ripple * .08);
          }
        } else if(surface > 2.5) {
          // Fixed height thresholds and slope masks: no geometry or field changes.
          vec3 up = radius > 0.0 ? normalize(radialUp) : vec3(0.0, 1.0, 0.0);
          float slope = 1.0 - clamp(dot(normalize(worldNormal), up), 0.0, 1.0);
          float h = (altitude - floorHeight) / max(amplitude, 0.001);
          vec3 p = (localPosition + vec3(fieldOrigin.x, 0.0, fieldOrigin.y)) * markScale;
          float wobble = sin(p.x * 1.7 + sin(p.z * 2.1)) * sin(p.z * 1.1 + p.y) * 0.018;
          h += wobble;
          paint = mix(sand, meadow, smoothstep(0.14, 0.17, h));
          paint = mix(paint, forest, smoothstep(0.28, 0.31, h));
          float mountain = smoothstep(0.48, 0.51, h);
          float face = smoothstep(0.08, 0.3, slope);
          paint = mix(paint, rock, max(mountain, face * smoothstep(0.24, 0.45, h)));
          float snowMask = smoothstep(0.66, 0.69, h) * (1.0 - smoothstep(0.22, 0.4, slope));
          paint = mix(paint, snow, snowMask);
          float shade = 1.0 - smoothstep(0.57, 0.62, light);
          paint = mix(paint, mix(paint * 0.67, ink, 0.35), shade * 0.62);
          float hatch = pen((p.x + p.z * 0.6 + p.y * 0.35) * 3.0, 0.045);
          float hatchMask = max(mountain, face) * shade * (1.0 - snowMask * 0.6);
          paint = mix(paint, ink, hatch * hatchMask * 0.5);
          float rim = 1.0 - smoothstep(0.035, 0.10, abs(dot(normalize(worldNormal), normalize(cameraPosition - vWorldPosition))));
          paint = mix(paint, ink, rim * 0.7);
          if(ocean) {
            // Static drawn wave marks are a material cue, not a flow simulation.
            float wave = pen(p.z * 2.4 + sin(p.x * 1.8) * 0.06, 0.045);
            float dash = smoothstep(0.3, 0.4, sin(p.x * 3.0 + floor(p.z * 2.4) * 2.0));
            paint = mix(water, snow, wave * dash * 0.5);
          }
        } else if(surface > 1.5 && !ocean) {
          float tone = clamp(dot(paint, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
          vec2 cell = fract(gl_FragCoord.xy / 5.0) - 0.5;
          float dotRadius = mix(0.40, 0.08, tone);
          float mark = 1.0 - smoothstep(dotRadius - 0.075, dotRadius + 0.075, length(cell));
          paint = mix(paint, paint * 0.48, mark * 0.65);
        } else if(surface > 0.5 && !ocean) {
          float level = altitude / interval;
          float distanceToLine = abs(fract(level + 0.5) - 0.5);
          float line = 1.0 - smoothstep(0.0, max(fwidth(level), 0.002) * 1.05, distanceToLine);
          paint = mix(paint, paint * 0.35, line * 0.48);
        }
        gl_FragColor = vec4(paint, 1.0);
        #include <colorspace_fragment>
        if(surface > 3.5) {
          #include <fog_fragment>
        }
      }
    `,
  })
}
export function applyAppearance(material: THREE.ShaderMaterial, appearance: Appearance) {
  const colors = appearance.surface === 'studio' ? STUDIO : appearance.surface === 'illustrated' ? ILLUSTRATED : WORLD
  for (const key of ['water', 'sand', 'meadow', 'forest', 'rock', 'snow'] as const) material.uniforms[key].value.set(colors[key])
  material.uniforms.surface.value = ['relief', 'contours', 'stipple', 'illustrated', 'studio'].indexOf(appearance.surface)
}
