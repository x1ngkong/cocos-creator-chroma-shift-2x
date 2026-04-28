/*************************************************************************************
 * @File        : ChromaShiftUtil.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 11:35:26
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : ChromaShift 通用工具函数（颜色解析、数值裁剪、参数存取）
 **************************************************************************************/

export interface IChromaShiftSaveData {
    hex: string;
    brightness: number;
    saturation: number;
    alpha: number;
}

export class ChromaShiftUtil {

    /** 归一化颜色字符串，支持 #RGB / #RRGGBB / #RRGGBBAA，非法值回退到白色。 */
    public static NormalizeHex(hex: string): string {
        let value = (hex || "#ffffff").trim();
        if (value[0] !== "#") value = `#${value}`;

        if (/^#[0-9a-fA-F]{3}$/.test(value)) {
            const r = value[1];
            const g = value[2];
            const b = value[3];
            value = `#${r}${r}${g}${g}${b}${b}`;
        }

        if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value)) {
            cc.warn(`[ChromaShift] Invalid hex color "${hex}", fallback to #ffffff.`);
            return "#ffffff";
        }

        return value.toLowerCase();
    }

    /** 将 Hex 颜色转换为 shader 可直接使用的 cc.Vec4，通道范围为 0 ~ 1。 */
    public static HexToVec4(hex: string): cc.Vec4 {
        const normalized = this.NormalizeHex(hex);
        const r = parseInt(normalized.substring(1, 3), 16) / 255;
        const g = parseInt(normalized.substring(3, 5), 16) / 255;
        const b = parseInt(normalized.substring(5, 7), 16) / 255;
        const a = normalized.length === 9 ? parseInt(normalized.substring(7, 9), 16) / 255 : 1;
        return new cc.Vec4(r, g, b, a);
    }

    /** 将 cc.Color 转为 #RRGGBBAA，便于持久化和调试显示。 */
    public static ColorToHex(color: cc.Color): string {
        const r = this.ByteToHex(color.r);
        const g = this.ByteToHex(color.g);
        const b = this.ByteToHex(color.b);
        const a = this.ByteToHex(color.a);
        return `#${r}${g}${b}${a}`.toLowerCase();
    }

    /** 将 cc.Color 转为 shader 可直接使用的 cc.Vec4，通道范围为 0 ~ 1。 */
    public static ColorToVec4(color: cc.Color): cc.Vec4 {
        return new cc.Vec4(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
    }

    /** 将数值裁剪到指定范围内，NaN 时返回最小值。 */
    public static Clamp(value: number, min: number, max: number): number {
        if (isNaN(value)) return min;
        return Math.min(max, Math.max(min, value));
    }

    /** 计算参数预览色：以白色灰度为基准，模拟 shader 中目标色、亮度、饱和度的综合效果。 */
    public static GetPreviewRgba(hex: string, brightness: number, saturation: number, alpha: number): string {
        const color = this.HexToVec4(hex);
        const b = this.Clamp(brightness, 0, 2);
        const s = this.Clamp(saturation, 0, 1);
        const alpha01 = this.Clamp(alpha, 0, 255) / 255;

        const r = this.Clamp01((1 + (color.x - 1) * s) * b);
        const g = this.Clamp01((1 + (color.y - 1) * s) * b);
        const blue = this.Clamp01((1 + (color.z - 1) * s) * b);
        const a = this.Clamp01(alpha01);

        return `#${this.UnitToHex(r)}${this.UnitToHex(g)}${this.UnitToHex(blue)}${this.UnitToHex(a)}`.toUpperCase();
    }

    /** 将 0 ~ 255 整数转换为两位十六进制字符串。 */
    private static ByteToHex(value: number): string {
        const n = Math.max(0, Math.min(255, Math.round(value)));
        return n.toString(16).padStart(2, "0");
    }

    /** 将 0 ~ 1 通道值限制到有效范围。 */
    private static Clamp01(value: number): number {
        return this.Clamp(value, 0, 1);
    }

    /** 将 0 ~ 1 通道值转换为两位十六进制字符串。 */
    private static UnitToHex(value: number): string {
        return this.ByteToHex(this.Clamp01(value) * 255);
    }

    /** 将换色参数保存到 localStorage；key 为空时跳过。 */
    public static Save(key: string, data: IChromaShiftSaveData): void {
        if (!key) return;
        try {
            cc.sys.localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            cc.error(`[ChromaShift] Save failed for key "${key}":`, e);
        }
    }

    /** 从 localStorage 读取换色参数；不存在或解析失败时返回 null。 */
    public static Load(key: string): IChromaShiftSaveData | null {
        if (!key) return null;
        const raw = cc.sys.localStorage.getItem(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw) as IChromaShiftSaveData;
        } catch (e) {
            cc.warn(`[ChromaShift] Load failed for key "${key}".`);
            return null;
        }
    }
}
