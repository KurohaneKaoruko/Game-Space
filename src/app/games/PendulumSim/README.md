# 混沌摆模拟（PendulumSim）

## 功能

- **多模式支持**：一键切换双摆/三摆系统，体验不同维度的混沌现象。
- **高精度物理**：基于拉格朗日力学（Lagrangian Mechanics）建模，真实还原摆锤动力学特性。
- **可视化参数**：实时调节摆长、质量、重力、阻尼等参数，即时反馈物理表现。
- **交互系统**：
  - 桌面端：鼠标拖拽任意摆锤，实时 IK（反向运动学）解算姿态。
  - 移动端：完美适配触控操作，支持长按拖拽，防误触优化。
- **数据监测**：
  - 轨迹追踪（Trail）：可视化混沌路径。
  - 能量分析：动能/势能实时曲线，监控数值积分误差（能量漂移）。

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

## 物理与交互技术细节
28→
29→### 物理引擎
30→
31→- **核心方程**：采用拉格朗日方程 $\frac{d}{dt}(\frac{\partial L}{\partial \dot{q}}) - \frac{\partial L}{\partial q} = 0$，其中 $L = T - V$。
32→- **数值求解**：
33→  1. 构建质量矩阵 $M(q)$ 与广义力向量。
34→  2. 求解线性系统 $M(q)\ddot{q} = \text{RHS}$ 得到角加速度。
35→  3. 使用半隐式欧拉积分推进状态，步长固定 $dt = 1/240s$ 以保证稳定性。
36→- **误差控制**：通过能量监控（$E_{total} = E_k + E_p$）检测数值漂移，通常控制在 5% 以内。
37→
38→### 交互系统
39→
40→- **拖拽实现**：
41→  - 采用几何约束 IK（Inverse Kinematics）算法。
42→  - 拖拽时暂停物理积分，强制约束摆长，实时解算关节角度。
43→  - 拖拽结束时清空角速度，避免非物理的剧烈甩动。
44→- **移动端优化**：
45→  - 强制接管 Touch 事件（`passive: false`），屏蔽浏览器默认滚动与长按菜单。
46→  - 增加全局事件兜底，确保在指针丢失或系统打断时正确重置交互状态。

## 本地开发

- 启动：`pnpm dev`
- 单元测试：`pnpm test`
