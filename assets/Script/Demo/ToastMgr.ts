/*************************************************************************************
 * @File        : ToastMgr.ts
 * @Author      : xingkong6
 * @Date        : 2026-04-28 11:34:36
 * @License     : Copyright (c) 2026 by xingkong6, All Rights Reserved.
 * @Description : Demo 用轻量 Toast 管理器（无需 UI 框架或预制体）
 **************************************************************************************/

/** Toast 请求数据。 */
interface IToastRequest {
    text: string;
    duration: number;
}

/** Demo 用 Toast 管理器，动态创建 Label 节点并串行播放。 */
export class ToastMgr {
    private static mDefaultDuration = 1.2;
    private static mInterval = 0.08;
    private static mMaxQueue = 100;
    private static readonly mQueue: IToastRequest[] = [];
    private static mIsPlaying = false;
    private static mToken = 0;
    private static mRoot: cc.Node | null = null;
    private static mCurrent: cc.Node | null = null;

    /** 配置 Toast 显示时长、间隔和最大队列长度。 */
    public static Configure(duration: number, interval: number = 0.08, maxQueue: number = 100): void {
        this.mDefaultDuration = Math.max(0.1, duration);
        this.mInterval = Math.max(0, interval);
        this.mMaxQueue = Math.max(1, maxQueue);
    }

    /** 显示一条 Toast；如果当前已有 Toast，会进入串行队列。 */
    public static Show(text: string, duration?: number): void {
        if (!text) return;
        if (this.mQueue.length >= this.mMaxQueue) {
            cc.warn(`[ToastMgr] Queue overflow, drop: "${text}"`);
            return;
        }
        this.mQueue.push({
            text,
            duration: duration && duration > 0 ? duration : this.mDefaultDuration,
        });
        this.TryPlayNext();
    }

    /** 清空尚未显示的 Toast 队列。 */
    public static ClearQueue(): void {
        this.mQueue.length = 0;
    }

    /** 停止当前 Toast，并清空整个队列。 */
    public static StopAndClear(): void {
        this.mQueue.length = 0;
        this.mToken++;
        this.mIsPlaying = false;
        this.DestroyCurrent();
    }

    /** 尝试播放队列中的下一条 Toast。 */
    private static TryPlayNext(): void {
        if (this.mIsPlaying) return;
        const next = this.mQueue.shift();
        if (!next) return;

        this.mIsPlaying = true;
        const token = ++this.mToken;
        const node = this.CreateToastNode(next.text);
        this.mCurrent = node;
        this.PlayTween(node, next.duration, () => this.Finish(token));
    }

    /** 当前 Toast 播放完成后，等待间隔时间再播放下一条。 */
    private static Finish(token: number): void {
        if (token !== this.mToken) return;
        this.DestroyCurrent();
        this.mIsPlaying = false;
        const delay = cc.delayTime(this.mInterval);
        const call = cc.callFunc(() => {
            if (token !== this.mToken) return;
            this.TryPlayNext();
        });
        this.GetRoot().runAction(cc.sequence(delay, call));
    }

    /** 创建 Toast 节点，包含半透明背景和文本。 */
    private static CreateToastNode(text: string): cc.Node {
        const root = this.GetRoot();

        const bg = new cc.Node("Toast");
        bg.parent = root;
        bg.opacity = 0;
        bg.setPosition(0, 40);
        bg.setContentSize(520, 72);

        const graphics = bg.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(0, 0, 0, 190);
        graphics.roundRect(-260, -36, 520, 72, 16);
        graphics.fill();

        const labelNode = new cc.Node("Label");
        labelNode.parent = bg;
        labelNode.setPosition(0, 0);
        const label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 26;
        label.lineHeight = 32;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = cc.Color.WHITE;
        labelNode.setContentSize(480, 60);

        return bg;
    }

    /** 播放 Toast 的入场、停留、退场动画。 */
    private static PlayTween(node: cc.Node, duration: number, onDone: () => void): void {
        const total = Math.max(0.1, duration);
        const enter = Math.min(0.18, total * 0.35);
        const exit = Math.min(0.28, total * 0.45);
        const stay = Math.max(0, total - enter - exit);

        node.runAction(cc.sequence(
            cc.spawn(cc.fadeIn(enter), cc.moveTo(enter, 0, 100).easing(cc.easeSineOut())),
            cc.delayTime(stay),
            cc.spawn(cc.fadeOut(exit), cc.moveTo(exit, 0, 140).easing(cc.easeSineIn())),
            cc.callFunc(onDone),
        ));
    }

    /** 获取或创建 Toast 根节点。 */
    private static GetRoot(): cc.Node {
        if (this.mRoot && cc.isValid(this.mRoot)) return this.mRoot;

        const canvas = cc.find("Canvas");
        this.mRoot = new cc.Node("ChromaShiftToastRoot");
        if (canvas) {
            this.mRoot.parent = canvas;
            this.mRoot.setContentSize(canvas.getContentSize());
        } else {
            cc.game.addPersistRootNode(this.mRoot);
        }
        this.mRoot.zIndex = 9999;
        return this.mRoot;
    }

    /** 销毁当前正在显示的 Toast 节点。 */
    private static DestroyCurrent(): void {
        if (this.mCurrent && cc.isValid(this.mCurrent)) {
            this.mCurrent.stopAllActions();
            this.mCurrent.destroy();
        }
        this.mCurrent = null;
    }
}
