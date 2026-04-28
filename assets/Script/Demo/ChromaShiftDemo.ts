/*************************************************************************************
 * @File        : ChromaShiftDemo.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 11:34:51
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : Demo 测试按钮脚本（绑定按钮 ClickEvents 后即可测试换色）
 **************************************************************************************/

import { ChromaShiftUtil } from "../ChromaShift/ChromaShiftUtil";
import { SpineChromaShift } from "../ChromaShift/SpineChromaShift";

const { ccclass, property } = cc._decorator;

@ccclass
export class ChromaShiftDemo extends cc.Component {

    /** Spine 换色目标；将挂有 SpineChromaShift 的节点拖入此槽 */
    @property(SpineChromaShift)
    private spineTarget: SpineChromaShift | null = null;

    /** 实时显示当前颜色、亮度、饱和度的 Label */
    @property(cc.Label)
    private statusLabel: cc.Label | null = null;

    /** 预设颜色列表，用于按钮快速轮换测试 */
    private readonly mColors = [
        "#fff7f2",
        "#f8d7e8",
        "#e9d7ff",
        "#d8e7ff",
        "#d6f5ff",
        "#d8f3ea",
        "#fff2c8",
        "#f2e6d8",
        "#dfe0ff",
        "#f6dce1",
        "#ff2a2a",
        "#ff8c00",
        "#b7ff00",
        "#00ff66",
        "#8b4513",
    ];

    /** 每帧刷新参数显示，保证按钮点击后状态立即可见 */
    protected update(): void {
        this.RefreshStatusLabel();
    }

    /** 点击事件：切换目标颜色 */
    public OnClickSwitchColor(event: cc.Event.EventTouch): void {
        const target = this.GetTarget();
        if (!target) return;

        // 拿到点击的按钮的背景颜色
        const color = event.target.getChildByName('Background').color;
        target.SetColor(ChromaShiftUtil.ColorToHex(color));
    }

    /** 点击事件：亮度增加 0.1 */
    public OnClickBrightnessUp(): void {
        const target = this.GetTarget();
        if (!target) return;

        const value = Math.min(2, parseFloat((target.GetBrightness() + 0.1).toFixed(1)));
        target.SetBrightness(value);
    }

    /** 点击事件：亮度降低 0.1 */
    public OnClickBrightnessDown(): void {
        const target = this.GetTarget();
        if (!target) return;

        const value = Math.max(0, parseFloat((target.GetBrightness() - 0.1).toFixed(1)));
        target.SetBrightness(value);
    }

    /** 点击事件：饱和度增加 0.1 */
    public OnClickSaturationUp(): void {
        const target = this.GetTarget();
        if (!target) return;

        const value = Math.min(1, parseFloat((target.GetSaturation() + 0.1).toFixed(1)));
        target.SetSaturation(value);
    }

    /** 点击事件：饱和度降低 0.1 */
    public OnClickSaturationDown(): void {
        const target = this.GetTarget();
        if (!target) return;

        const value = Math.max(0, parseFloat((target.GetSaturation() - 0.1).toFixed(1)));
        target.SetSaturation(value);
    }

    /** 点击事件：透明度增加 15 */
    public OnClickAlphaUp(): void {
        const target = this.GetTarget();
        if (!target) return;

        const value = Math.min(255, target.GetAlpha() + 15);
        target.SetAlpha(value);
    }

    /** 点击事件：透明度降低 15 */
    public OnClickAlphaDown(): void {
        const target = this.GetTarget();
        if (!target) return;

        const value = Math.max(0, target.GetAlpha() - 15);
        target.SetAlpha(value);
    }

    /** 点击事件：恢复 Inspector 默认参数 */
    public OnClickReset(): void {
        const target = this.GetTarget();
        if (!target) return;

        target.ResetToDefaults();
    }

    /** 点击事件：从本地存储恢复参数 */
    public OnClickLoadSaved(): void {
        const target = this.GetTarget();
        if (!target) return;

        target.LoadSaved();
    }

    /** 获取当前测试目标；未配置时仅返回 null，状态显示由 update 负责 */
    private GetTarget(): SpineChromaShift | null {
        return this.spineTarget;
    }

    /** 刷新状态 Label，实时展示当前换色参数 */
    private RefreshStatusLabel(): void {
        if (!this.statusLabel) return;
        const target = this.GetTarget();
        if (!target) {
            this.statusLabel.string = "请先绑定 SpineChromaShift";
            return;
        }

        this.statusLabel.string =
            `颜色：${target.GetColor().toUpperCase()}\n` +
            `亮度：${target.GetBrightness().toFixed(1)}\n` +
            `饱和度：${target.GetSaturation().toFixed(1)}\n` +
            `透明度：${target.GetAlpha().toFixed(0)}\n` +
            `预览RGBA：${ChromaShiftUtil.GetPreviewRgba(target.GetColor(), target.GetBrightness(), target.GetSaturation(), target.GetAlpha())}`;
    }
}
