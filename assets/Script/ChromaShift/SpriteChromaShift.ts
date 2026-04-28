/*************************************************************************************
 * @File        : SpriteChromaShift.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 11:35:51
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : Sprite 换色组件（将 ChromaShift 材质绑定到 cc.Sprite）
 *************************************************************************************/

import { ChromaShiftBase } from "./ChromaShiftBase";

const { ccclass, property } = cc._decorator;

@ccclass
export class SpriteChromaShift extends ChromaShiftBase {

    /** 需要换色的 Sprite；不填时默认取当前节点上的 cc.Sprite。 */
    @property({ type: cc.Sprite, tooltip: "需要换色的 Sprite 组件；不填时默认取当前节点上的 cc.Sprite。" })
    private sprite: cc.Sprite | null = null;

    /** 初始化时补齐默认 Sprite 引用，再执行基类初始化。 */
    protected onLoad(): void {
        if (!this.sprite) this.sprite = this.getComponent(cc.Sprite);
        super.onLoad();
    }

    /** 读取 Sprite 上已经绑定好的 ChromaShift 材质。 */
    protected GetTargetMaterial(): cc.Material | null {
        if (!this.sprite) {
            cc.warn("[SpriteChromaShift] Missing cc.Sprite target.");
            return null;
        }
        return this.sprite.getMaterial(0) as cc.Material;
    }
}
