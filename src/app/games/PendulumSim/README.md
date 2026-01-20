# 混沌摆模拟（PendulumSim）

## 功能

- 双摆/三摆模式切换
- 半隐式欧拉（Euler）+ 小规模线性系统求解（角度坐标）进行真实物理模拟
- 可视化参数面板：摆长、质量、重力、阻尼、初始角度、轨迹长度
- Canvas 60fps 动画渲染
- 鼠标/触控拖拽摆锤实时调整位置
- 轨迹显示与能量变化曲线（含能量漂移提示）

## 项目集成位置

- 路由入口：`/games/PendulumSim`
  - 页面：`src/app/games/PendulumSim/page.tsx`
  - 元信息：`src/app/games/PendulumSim/layout.tsx`
- 游戏列表数据源：`src/app/data/projects.ts`
- 卡片图标：`public/images/pendulum-sim.svg`

## 架构

- 物理引擎（TypeScript）
  - 摆系统封装与动力学求解：`src/app/games/PendulumSim/engine/pendulumSimulation.ts`
- UI/交互
  - 控制面板：`src/app/games/PendulumSim/ui/ControlsPanel.tsx`
  - Canvas 渲染与拖拽：`src/app/games/PendulumSim/ui/SimulationCanvas.tsx`

## 物理与误差控制

- 使用固定步长 `dt = 1/240`，渲染帧率与物理步进解耦。
- 动力学采用角度坐标建立质量矩阵 `M(q)`，每步求解 `M(q)·q̈ = rhs` 得到角加速度并积分。
- 能量曲线绘制 `E(t)/E(0)`，用于观察数值误差（目标：漂移 < 5%，见单元测试）。

## 本地开发

- 启动：`pnpm dev`
- 单元测试：`pnpm test`
