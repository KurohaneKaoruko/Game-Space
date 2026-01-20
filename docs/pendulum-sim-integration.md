# PendulumSim 集成说明

## 路由与入口

- 路由：`/games/PendulumSim`
- 页面入口：`src/app/games/PendulumSim/page.tsx`
- Metadata：`src/app/games/PendulumSim/layout.tsx`

## 游戏列表

游戏列表由 `src/app/data/projects.ts` 驱动，PendulumSim 已以 `id: "PendulumSim"` 的形式加入。

## 资源文件

- 列表卡片图标：`public/images/pendulum-sim.svg`

## 代码结构约定

- `engine/`：纯 TypeScript 物理与数值逻辑（无 DOM 依赖，便于单测）
- `ui/`：React 组件（控制面板、Canvas 渲染与交互）
- `function/`：状态与控制器 hook（连接 UI 与引擎）

## 常见扩展点

- 增加新的摆系统：在 `engine/` 内新增系统封装（建议保持 “状态 + step(dt) + snapshot” 结构）
- 增加新的可视化：在 `SimulationCanvas.tsx` 中追加绘制层（优先复用同一 canvas，避免额外布局抖动）
- 增加更多参数：在控制器 `usePendulumSimController.ts` 增加状态与更新函数，并在 `ControlsPanel.tsx` 暴露 UI
