// import fragment from './colorReplace.frag';
// import vertex from './default.vert';
import { Filter, utils } from '@pixi/core';

type Color = number | number[] | Float32Array;

/**
 * 绿幕抠图
 *
 * @example
 *  // replaces true red with true blue
 *  someSprite.filters = [new ColorReplaceFilter(
 *   [1, 0, 0],
 *   [0, 0, 1],
 *   0.001
 *   )];
 *  // replaces the RGB color 220, 220, 220 with the RGB color 225, 200, 215
 *  someOtherSprite.filters = [new ColorReplaceFilter(
 *   [220/255.0, 220/255.0, 220/255.0],
 *   [225/255.0, 200/255.0, 215/255.0],
 *   0.001
 *   )];
 *  // replaces the RGB color 220, 220, 220 with the RGB color 225, 200, 215
 *  someOtherSprite.filters = [new ColorReplaceFilter(0xdcdcdc, 0xe1c8d7, 0.001)];
 *
 */
class ColorReplaceFilter extends Filter {
  private _originalColor = 0x00ff00;
  private _newColor = 0x0;

  /**
   *
   * @param {number|Array<number>|Float32Array} [originalColor=0xFF0000] - 目标颜色 绿
   *        as a 3 component RGB e.g. `[1.0, 1.0, 1.0]`
   * @param {number|Array<number>|Float32Array} [newColor=0x000000] - 替换后的颜色
   *        RGB e.g. `[1.0, 0.5, 1.0]`
   * @param {number} [epsilon=0.4] - Tolerance/sensitivity of the floating-point comparison between colors
   *        (lower = more exact, higher = more inclusive)
   */
  constructor(originalColor: Color = 0x00ff00, newColor: Color = 0x000000, epsilon = 0.4) {
    // super(vertex, fragment);
    super(
      `attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;

    varying vec2 vTextureCoord;

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }
    `,
      // `varying vec2 vTextureCoord;
      // uniform sampler2D uSampler;
      // uniform vec3 originalColor;
      // uniform vec3 newColor;
      // uniform float epsilon;
      // void main(void) {
      //     vec4 currentColor = texture2D(uSampler, vTextureCoord);
      //     vec3 colorDiff = originalColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));
      //     float colorDistance = length(colorDiff);
      //     float doReplace = step(colorDistance, epsilon);
      //     gl_FragColor = vec4(mix(currentColor.rgb, (newColor + colorDiff) * currentColor.a, doReplace), currentColor.a);
      // }
      // `

      /***** */

      `varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform vec3 originalColor;
      uniform vec3 newColor;
      uniform float epsilon;

      vec2 RGBToCC(vec3 rgb) {
        float Y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        return vec2((rgb.b - Y) * 0.565, (rgb.r - Y) * 0.713);
      }

      void main(void) {
          // 从贴图获取源像素
          vec4 srcColor = texture2D(uSampler, vTextureCoord);
          // 源像素 RGB 转换为 YUV
          vec2 srcCC = RGBToCC(srcColor.rgb);
          // 目标颜色转换为 YUV
          vec2 keyCC = RGBToCC(originalColor);

          // 计算距离
          float mask = sqrt(pow(keyCC.x - srcCC.x, 2.0) + pow(keyCC.y - srcCC.y, 2.0));
          // 对距离值在range中进行平滑映射取值
          mask = smoothstep(0.3, 0.6, mask);

          // 低于range下限
          if (mask == 0.0) { discard; }
          // 超过range上限
          else if (mask == 1.0) { gl_FragColor = srcColor; }
          // 处于range之中
          else {
            // 某些源像素（如头发边缘）混合了绿幕颜色，需要减去绿幕颜色，否则边缘会有绿斑
            // gl_FragColor = max(srcColor - (1.0 - mask) * vec4(originalColor, 1), 0.0);
            gl_FragColor = srcColor;
          }
      }
      `

      /******** */
      // `varying vec2 vTextureCoord;
      // uniform sampler2D uSampler;
      // uniform vec3 originalColor;
      // uniform vec3 newColor;
      // uniform float epsilon;

      // vec2 RGBtoUV(vec3 rgb) {
      //   return vec2(rgb.r * -0.169 + rgb.g * -0.331 + rgb.b * 0.5 + 0.5,rgb.r * 0.5 + rgb.g * -0.419 + rgb.b * -0.081 + 0.5);
      // }

      // vec4 ProcessChromaKey(vec2 texCoord) {
      //   vec4 rgba = texture2D(uSampler, texCoord);
      //   float chromaDist = distance(RGBtoUV(texture2D(uSampler, texCoord).rgb), RGBtoUV(originalColor));
      //   float baseMask = chromaDist - 0.1;
      //   float fullMask = pow(clamp(baseMask / 0.1, 0., 1.), 1.5);
      //   rgba.a = fullMask;
      //   float spillVal = pow(clamp(baseMask / 0.1, 0., 1.), 1.5);
      //   float desat = clamp(rgba.r * 0.2126 + rgba.g * 0.7152 + rgba.b * 0.0722, 0., 1.);
      //   rgba.rgb = mix(vec3(desat, desat, desat), rgba.rgb, spillVal);
      //   return rgba;
      // }

      // void main(void) {
      //   vec4 currentColor = texture2D(uSampler, vTextureCoord);
      //   gl_FragColor = ProcessChromaKey(RGBtoUV(currentColor.rgb));
      // }`
    );
    this.uniforms.originalColor = new Float32Array(3);
    this.uniforms.newColor = new Float32Array(3);
    this.originalColor = originalColor;
    this.newColor = newColor;
    this.epsilon = epsilon;
  }

  /**
   * The color that will be changed, as a 3 component RGB e.g. [1.0, 1.0, 1.0]
   * @member {number|Array<number>|Float32Array}
   * @default 0xFF0000
   */
  set originalColor(value: Color) {
    const arr = this.uniforms.originalColor;

    if (typeof value === 'number') {
      utils.hex2rgb(value, arr);
      this._originalColor = value;
    } else {
      arr[0] = value[0];
      arr[1] = value[1];
      arr[2] = value[2];
      this._originalColor = utils.rgb2hex(arr);
    }
  }
  get originalColor(): Color {
    return this._originalColor;
  }

  /**
   * The resulting color, as a 3 component RGB e.g. [1.0, 0.5, 1.0]
   * @member {number|Array<number>|Float32Array}
   * @default 0x000000
   */
  set newColor(value: Color) {
    const arr = this.uniforms.newColor;

    if (typeof value === 'number') {
      utils.hex2rgb(value, arr);
      this._newColor = value;
    } else {
      arr[0] = value[0];
      arr[1] = value[1];
      arr[2] = value[2];
      this._newColor = utils.rgb2hex(arr);
    }
  }
  get newColor(): Color {
    return this._newColor;
  }

  /**
   * Tolerance/sensitivity of the floating-point comparison between colors (lower = more exact, higher = more inclusive)
   * @default 0.4
   */
  set epsilon(value: number) {
    this.uniforms.epsilon = value;
  }
  get epsilon(): number {
    return this.uniforms.epsilon;
  }
}

export default ColorReplaceFilter;
