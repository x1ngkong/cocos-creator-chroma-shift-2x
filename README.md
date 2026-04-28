# cocos-creator-chroma-shift-2x

基于 **Cocos Creator 2.x** 的运行时换色工具。

Chroma Shift 支持在引擎默认材质和改色材质之间切换。角色可以先使用原始材质显示本色；当调用换色接口时，组件会自动切到 `ChromaShift.mtl`，并在片元着色器中把原始贴图转为灰度，再叠加目标色、亮度、饱和度和透明度参数。

## 功能特性

- 基于灰度的运行时换色，不需要为每种颜色导出新贴图。
- 同一份 `ChromaShift.effect` 同时支持 Sprite 和 Spine。
- 支持目标色、亮度、饱和度、透明度调节。
- 支持一键还原引擎默认材质，再次调色时自动切回改色材质。
- 支持通过 `storageKey` 将参数保存到 `localStorage`。
- 不依赖业务框架，可直接拷贝到任意 Cocos Creator 2.x 项目。
- 附带 Demo 测试脚本，方便快速验证 Spine 换色效果。

## 目录结构

```text
assets/
├── resources/
│   ├── Effects/
│   │   └── ChromaShift.effect      # 换色 shader
│   └── Materals/
│       └── ChromaShift.mtl         # 绑定 ChromaShift.effect 的材质
└── Script/
    ├── ChromaShift/
    │   ├── ChromaShiftBase.ts      # 换色参数、材质 uniform、存取档基类
    │   ├── ChromaShiftUtil.ts      # 颜色转换、预览色、localStorage 工具
    │   ├── SpriteChromaShift.ts    # Sprite 适配器
    │   └── SpineChromaShift.ts     # Spine 适配器
    └── Demo/
        ├── ChromaShiftDemo.ts      # Spine Demo 按钮脚本
        ├── Main.ts                 # Demo 入口
        └── ToastMgr.ts             # Demo 辅助 Toast
```

## 架构说明

```text
ChromaShift.effect
    ↑ 由 ChromaShift.mtl 绑定
    ↑ 挂到 Sprite / Spine 的 Materials[0]

ChromaShiftBase
    ├── 管理 color / brightness / saturation / alpha
    ├── 在默认材质和 ChromaShift.mtl 之间切换
    ├── 写入材质 uniform
    └── 保存 / 读取 localStorage

SpriteChromaShift
    └── 从 cc.Sprite.getMaterial(0) 获取当前材质

SpineChromaShift
    └── 从 sp.Skeleton.getMaterial(0) 获取当前材质
```

设计重点：脚本**不创建材质**。`chromaShiftMaterial` 在 Inspector 中引用 `db://assets/resources/Materals/ChromaShift.mtl`；目标渲染组件可以先使用引擎默认材质，真正调色或改属性前，脚本会自动把目标材质槽切到 `ChromaShift.mtl` 后再写入 uniform 参数。

## Shader 流程

```glsl
原始贴图颜色
    ↓ 灰度化
gray = dot(rgb, vec3(0.299, 0.587, 0.114))
    ↓ 目标色
shifted = gray * u_targetColor.rgb
    ↓ 饱和度
shifted = mix(grayColor, shifted, u_saturation)
    ↓ 亮度
shifted *= u_brightness
    ↓ 透明度
alpha = 原始 alpha * u_alpha
```

## 参数说明

| 参数 | 范围 | 说明 |
|---|---:|---|
| `color` | `#RGB` / `#RRGGBB` / `#RRGGBBAA` | 目标染色颜色 |
| `brightness` | `0 ~ 2` | 亮度倍率 |
| `saturation` | `0 ~ 1` | 饱和度，0 为灰度，1 为完整目标色 |
| `alpha` | `0 ~ 255` | 透明度，内部会转换为 shader 的 `0 ~ 1` |

## Sprite 使用方式

1. 创建 `ChromaShift.mtl`，并绑定 `ChromaShift.effect`。
2. 在目标 `cc.Sprite` 节点上挂 `SpriteChromaShift`。
3. 将 `ChromaShift.mtl` 拖到组件的 `chromaShiftMaterial`。
4. 目标 `cc.Sprite` 的 `Materials[0]` 可以先保持引擎默认材质；调用换色接口时会自动切到改色材质。
5. 在 Inspector 中设置默认颜色、亮度、饱和度和透明度。
6. 如果需要持久化，填写唯一的 `storageKey`。

```ts
const shift = this.node.getComponent(SpriteChromaShift);
shift.SetColor("#ff4b4b");
shift.SetBrightness(1.2);
shift.SetSaturation(0.9);
shift.SetAlpha(220);
```

## Spine 使用方式

1. 创建 `ChromaShift.mtl`，并绑定 `ChromaShift.effect`。
2. 在目标 `sp.Skeleton` 节点上挂 `SpineChromaShift`。
3. 将 `ChromaShift.mtl` 拖到组件的 `chromaShiftMaterial`。
4. 目标 `sp.Skeleton` 的 `Materials[0]` 可以先保持 `builtin-2d-spine`；调用换色接口时会自动切到改色材质。
5. 如果需要持久化，填写唯一的 `storageKey`。

```ts
const shift = this.node.getComponent(SpineChromaShift);
shift.SetColor("#4b8dff");
shift.SetBrightness(1.0);
shift.SetSaturation(1.0);
shift.SetAlpha(255);
```

> 如果可换色部件和其他部件在同一张 atlas 页上，整页都会被同一个材质影响。需要只换衣服时，建议让衣服使用独立材质页或独立 Spine 插槽材质。

## API 速查

```ts
shift.SetColor("#F8D7E8");
shift.SetBrightness(1.1);
shift.SetSaturation(0.8);
shift.SetAlpha(200);

shift.SetParams("#F8D7E8", 1.1, 0.8, 200);
shift.ResetToOriginal();     // 切回引擎默认材质，例如 builtin-2d-spine
shift.ResetToChromaShift();  // 切回 ChromaShift.mtl，并应用 Inspector 默认参数
shift.LoadSaved();
shift.Save();

const color = shift.GetColor();
const brightness = shift.GetBrightness();
const saturation = shift.GetSaturation();
const alpha = shift.GetAlpha();
const isChromaShift = shift.IsUsingChromaShiftMaterial();
```

`storageKey` 为空时不会保存；多个对象需要独立保存参数时，请给每个组件设置不同的 `storageKey`。

## Demo 按钮

当前 Demo 只测试 Spine。`ChromaShiftDemo` 提供以下按钮方法，可直接绑定到 Button 的 ClickEvents：

- `OnClickSwitchColor`：读取当前按钮 `Background` 子节点颜色并设置到 Spine。
- `OnClickBrightnessUp` / `OnClickBrightnessDown`：调整亮度。
- `OnClickSaturationUp` / `OnClickSaturationDown`：调整饱和度。
- `OnClickAlphaUp` / `OnClickAlphaDown`：调整透明度。
- `OnClickResetToOriginal`：恢复引擎默认材质，Spine 默认是 `builtin-2d-spine`。
- `OnClickResetToChromaShift`：切回 `ChromaShift.mtl`，并恢复 Inspector 默认改色参数。
- `OnClickLoadSaved`：从 `localStorage` 恢复保存参数。

Demo 使用步骤：

1. 场景里准备一个 Spine 节点，`Materials[0]` 可以保持默认 Spine 材质。
2. 在该 Spine 节点上挂 `SpineChromaShift`。
3. 将 `ChromaShift.mtl` 拖到 `SpineChromaShift.chromaShiftMaterial`。
4. 新建一个空节点挂 `ChromaShiftDemo`。
5. 将 `SpineChromaShift` 拖入 `spineTarget`。
6. 将一个 Label 拖入 `statusLabel`，用于实时显示当前材质和参数。
7. 创建若干按钮，绑定上面的点击方法。

`statusLabel` 会每帧显示：

```text
材质：改色材质
颜色：#F8D7E8FF
亮度：1.0
饱和度：1.0
透明度：255
预览RGBA：#F8D7E8FF
```

## 注意事项

- `#ffffff` 表示“灰度后的白色染色”，不是恢复原图原始色彩。
- 需要恢复原图原始渲染时，调用 `ResetToOriginal()` 切回引擎默认材质；之后任意换色接口都会自动切回 `ChromaShift.mtl`。
- `chromaShiftMaterial` 必须配置为 `db://assets/resources/Materals/ChromaShift.mtl`，否则换色接口只会给出 warning，不会写入材质参数。
- Spine 如果衣服、皮肤、头发在同一张 atlas 页上，整页都会被换色。需要精确换色时，请让可染色部件使用独立 atlas 页。
- `预览RGBA` 是以白色灰度为基准计算的参数预览色，不代表贴图每个像素的真实最终色。
- 当前 effect 使用普通 alpha 混合。如果项目依赖预乘 alpha、加法混合或特殊 slot 混合模式，建议额外派生对应 effect 版本。
- `USE_TINT` 是 Spine 渲染组件可能注入的材质宏，`ChromaShift.effect` 已通过 `#pragma define USE_TINT 0` 做兼容。

## 性能建议

`ChromaShift.effect` 本身很轻量，核心成本只有一次贴图采样、一次灰度计算和少量颜色混合运算。通常情况下，角色换装、衣服染色、饰品染色不会成为性能瓶颈。

真正需要注意的是 **材质状态和 draw call**：

- 如果多个对象使用相同材质和相同参数，合批机会更高。
- 如果同屏大量对象都使用不同颜色、亮度、饱和度或透明度，本质上会产生不同材质状态，可能增加 draw call。
- Spine 本身因为 atlas 页、slot 混合模式、mesh 等因素就比较容易拆 draw call，换色只是其中一个影响因素。
- 透明度会增加 overdraw 压力，尤其是大面积半透明服装、多层裙摆或多个半透明角色叠加时。
- 不建议在 `update()` 中对大量对象频繁调用 `SetColor` / `SetBrightness` / `SetSaturation` / `SetAlpha`。这些接口更适合在按钮点击、换装确认、滑块变化等事件中调用。

推荐策略：

- 少量角色或少量部件染色：可以直接使用，性能压力很小。
- 同屏大量同色对象：尽量复用同一套材质和参数。
- 同屏大量不同色对象：按颜色或参数分组，必要时做 draw call 和 overdraw 评估。
- 列表中大量头像、衣服缩略图、装扮预览都独立换色：谨慎使用，建议先压测。