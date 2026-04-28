/*************************************************************************************
 * @File        : Main.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 12:02:26
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : 主入口脚本
 **************************************************************************************/

import { ToastMgr } from "./ToastMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export class Main extends cc.Component {

    @property(cc.Prefab)
    private spinePrefab: cc.Prefab = null;

    protected onLoad(): void {
        const spine = cc.instantiate(this.spinePrefab);
        spine.parent = this.node;
        ToastMgr.Show("Welcome to Chroma Shift Demo");
    }
}
