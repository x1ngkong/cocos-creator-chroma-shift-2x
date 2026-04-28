/*************************************************************************************
 * @File        : ChromaShiftBase.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 11:35:13
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : ChromaShift 基类（灰度换色参数、材质创建、持久化）
 **************************************************************************************/

import { ChromaShiftUtil } from "./ChromaShiftUtil";
const { ccclass, property } = cc._decorator;

@ccclass
export abstract class ChromaShiftBase extends cc.Component {

    /** 默认目标色。注意：白色表示灰度白染色，不是恢复原始彩色贴图。 */
    @property({ tooltip: "默认目标色。白色表示灰度白染色，不是恢复原始彩色贴图。" })
    protected defaultColor: cc.Color = cc.Color.WHITE;

    /** 默认亮度倍率，推荐范围 0 ~ 2。 */
    @property({ type: cc.Float, slide: true, tooltip: "默认亮度倍率，推荐范围 0 ~ 2", range: [0, 2], step: 0.1 })
    protected defaultBrightness: number = 1.0;

    /** 默认饱和度，推荐范围 0 ~ 1。 */
    @property({ type: cc.Float, slide: true, tooltip: "默认饱和度，推荐范围 0 ~ 1", range: [0, 1], step: 0.1 })
    protected defaultSaturation: number = 1.0;

    /** 默认透明度，范围 0 ~ 255。 */
    @property({ type: cc.Integer, slide: true, tooltip: "默认透明度，范围 0 ~ 255", range: [0, 255], step: 1 })
    protected defaultAlpha: number = 255;

    /** 是否在 onLoad 时自动从 localStorage 恢复参数。 */
    @property({ tooltip: "是否在 onLoad 时自动从 localStorage 恢复参数, 默认开启" })
    protected autoLoadSaved: boolean = true;

    /** 持久化 Key。留空时不保存、不读取。 */
    @property({ tooltip: "持久化 Key, 留空时不保存、不读取。" })
    protected storageKey: string = '';

    /** 当前材质。 */
    protected material: cc.Material | null = null;
    protected colorHex: string = "#FFFFFF";
    protected color: cc.Vec4 = new cc.Vec4(1, 1, 1, 1);
    protected brightness: number = 1.0;
    protected saturation: number = 1.0;
    protected alpha: number = 255;

    /** 组件初始化：应用默认值，读取当前渲染组件已绑定的材质，并按配置恢复持久化参数。 */
    protected onLoad(): void {
        this.ResetToDefaults(false);
        this.material = this.GetTargetMaterial();
        if (!this.material) {
            cc.warn("[ChromaShift] Missing ChromaShift material on target renderer.");
            return;
        }
        if (this.autoLoadSaved) this.LoadSaved();
        else this.ApplyToMaterial();
    }

    /** 设置目标色，支持 #RGB / #RRGGBB / #RRGGBBAA。 */
    public SetColor(hex: string, save: boolean = true): void {
        this.colorHex = ChromaShiftUtil.NormalizeHex(hex);
        this.color = ChromaShiftUtil.HexToVec4(this.colorHex);
        this.ApplyToMaterial();
        if (save) this.Save();
    }

    /** 设置亮度倍率，内部裁剪到 0 ~ 2。 */
    public SetBrightness(value: number, save: boolean = true): void {
        this.brightness = ChromaShiftUtil.Clamp(value, 0, 2);
        this.ApplyToMaterial();
        if (save) this.Save();
    }

    /** 设置饱和度，内部裁剪到 0 ~ 1。 */
    public SetSaturation(value: number, save: boolean = true): void {
        this.saturation = ChromaShiftUtil.Clamp(value, 0, 1);
        this.ApplyToMaterial();
        if (save) this.Save();
    }

    /** 设置透明度，内部裁剪到 0 ~ 255。 */
    public SetAlpha(value: number, save: boolean = true): void {
        this.alpha = ChromaShiftUtil.Clamp(value, 0, 255);
        this.ApplyToMaterial();
        if (save) this.Save();
    }

    /** 一次性设置目标色、亮度、饱和度。适合预设切换或读档恢复。 */
    public SetParams(hex: string, brightness: number, saturation: number, alpha: number = 255, save: boolean = true): void {
        this.colorHex = ChromaShiftUtil.NormalizeHex(hex);
        this.color = ChromaShiftUtil.HexToVec4(this.colorHex);
        this.brightness = ChromaShiftUtil.Clamp(brightness, 0, 2);
        this.saturation = ChromaShiftUtil.Clamp(saturation, 0, 1);
        this.alpha = ChromaShiftUtil.Clamp(alpha, 0, 255);
        this.ApplyToMaterial();
        if (save) this.Save();
    }

    /** 恢复到 Inspector 中配置的默认参数。 */
    public ResetToDefaults(save: boolean = true): void {
        this.colorHex = ChromaShiftUtil.ColorToHex(this.defaultColor);
        this.color = ChromaShiftUtil.ColorToVec4(this.defaultColor);
        this.brightness = ChromaShiftUtil.Clamp(this.defaultBrightness, 0, 2);
        this.saturation = ChromaShiftUtil.Clamp(this.defaultSaturation, 0, 1);
        this.alpha = ChromaShiftUtil.Clamp(this.defaultAlpha, 0, 255);
        this.ApplyToMaterial();
        if (save) this.Save();
    }

    /** 从 localStorage 读取参数并应用；storageKey 为空或无存档时仅应用当前参数。 */
    public LoadSaved(): void {
        const saved = ChromaShiftUtil.Load(this.storageKey);
        if (!saved) {
            this.ApplyToMaterial();
            return;
        }
        this.SetParams(saved.hex, saved.brightness, saved.saturation, saved.alpha ?? 255, false);
    }

    /** 将当前换色参数保存到 localStorage；storageKey 为空时跳过。 */
    public Save(): void {
        ChromaShiftUtil.Save(this.storageKey, {
            hex: this.colorHex,
            brightness: this.brightness,
            saturation: this.saturation,
            alpha: this.alpha,
        });
    }

    /** 获取当前目标色 Hex。 */
    public GetColor(): string {
        return this.colorHex;
    }

    /** 获取当前亮度倍率。 */
    public GetBrightness(): number {
        return this.brightness;
    }

    /** 获取当前饱和度。 */
    public GetSaturation(): number {
        return this.saturation;
    }

    /** 获取当前透明度，范围 0 ~ 255。 */
    public GetAlpha(): number {
        return this.alpha;
    }

    /** 将当前参数写入材质 uniform。 */
    protected ApplyToMaterial(): void {
        if (!this.material) return;
        this.material.setProperty("u_targetColor", this.color);
        this.material.setProperty("u_brightness", this.brightness);
        this.material.setProperty("u_saturation", this.saturation);
        this.material.setProperty("u_alpha", this.alpha / 255);
    }

    /** 子类实现：从 Sprite、Spine 或其他 RenderComponent 上读取已绑定的 ChromaShift 材质。 */
    protected abstract GetTargetMaterial(): cc.Material | null;
}
