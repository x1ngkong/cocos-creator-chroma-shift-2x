/*************************************************************************************
 * @File        : SpineChromaShift.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 11:35:39
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : Spine 换色组件（将 ChromaShift 材质绑定到指定 atlas 页）
 **************************************************************************************/

import { ChromaShiftBase } from "./ChromaShiftBase";

const { ccclass, property } = cc._decorator;

@ccclass
export class SpineChromaShift extends ChromaShiftBase {

    /** 需要换色的 Spine 组件；不填时默认取当前节点上的 sp.Skeleton。 */
    @property({ type: sp.Skeleton, tooltip: "需要换色的 Spine 组件；不填时默认取当前节点上的 sp.Skeleton。" })
    private skeleton: sp.Skeleton | null = null;

    /** 初始化时补齐默认 Spine 引用，再执行基类初始化。 */
    protected onLoad(): void {
        if (!this.skeleton) this.skeleton = this.getComponent(sp.Skeleton);
        super.onLoad();
    }

    /** 读取 Spine 上已经绑定好的 ChromaShift 材质。 */
    protected GetTargetMaterial(): cc.Material | null {
        if (!this.skeleton) {
            cc.warn("[SpineChromaShift] Missing sp.Skeleton target.");
            return null;
        }
        return this.skeleton.getMaterial(0) as cc.Material;
    }
}
