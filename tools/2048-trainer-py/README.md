# 2048 N-Tuple 网络训练器 (Python 版本)

一个使用 N-Tuple 网络和 TD 学习的高性能 2048 AI 训练工具。这是 TypeScript 版本的 Python 重构版本。

## 功能特性

- **N-Tuple 网络**: 实现了最先进的 2048 N-Tuple 网络架构
- **TD 学习**: 基于后继状态评估的时序差分学习
- **位棋盘引擎**: 使用位棋盘表示实现高性能游戏引擎
- **检查点系统**: 保存和恢复训练进度
- **学习率衰减**: 可配置的学习率调度
- **性能监控**: 实时训练统计

## 安装

```bash
# 安装依赖
pip install -r requirements.txt
```

## 快速开始

### 基础训练

```bash
# 基础训练，100,000 轮
python train.py --output weights.json

# 带学习率衰减的训练
python train.py --episodes 100000 --decay --output weights.json
```

### 验证模块

```bash
# 验证游戏引擎
python verify_game.py

# 验证网络模块
python verify_network.py
```

## 命令行选项

| 选项 | 简写 | 描述 | 默认值 |
|--------|-------|-------------|---------|
| `--episodes <n>` | `-e` | 训练轮数 | 100000 |
| `--learning-rate <n>` | `-l` | 学习率 alpha | 0.0025 |
| `--output <path>` | `-o` | 权重输出文件路径 | weights.json |
| `--decay` | `-d` | 启用学习率衰减 | 禁用 |
| `--optimistic <n>` | | 乐观初始权重值 | 0 |
| `--report <n>` | `-r` | 进度报告间隔 | 100 |
| `--checkpoint <n>` | `-c` | 检查点保存间隔 | 1000 |
| `--checkpoint-path <p>` | | 检查点文件路径 | checkpoint.json |
| `--weights-save <n>` | | 权重保存间隔（秒） | 300 |
| `--resume` | | 从检查点恢复训练 | 禁用 |
| `--help` | `-h` | 显示帮助信息 | |

## 训练示例

### 基础训练会话

```bash
# 使用默认设置训练 100,000 轮
python train.py --output my-weights.json
```

### 带检查点的长时间训练

```bash
# 每 5000 轮保存检查点
python train.py \
  --episodes 500000 \
  --checkpoint 5000 \
  --decay \
  --output trained-weights.json
```

### 恢复中断的训练

```bash
# 从检查点恢复
python train.py --resume --output weights.json
```

## 输出文件

### 权重文件 (*.json)

包含 JSON 格式的训练后 N-Tuple 网络权重。可被游戏 AI 加载使用。

### 检查点文件 (checkpoint.json)

包含用于恢复的训练状态：
- 当前轮数
- 学习率
- 训练统计
- 网络权重

## 架构

```
tools/2048-trainer-py/
├── train.py              # CLI 入口点
├── trainer.py            # 训练器实现
├── network.py            # N-Tuple 网络
├── game.py               # 2048 游戏逻辑
├── patterns.py           # N-Tuple 模式
├── verify_game.py       # 游戏引擎验证
├── verify_network.py    # 网络模块验证
├── requirements.txt      # Python 依赖
└── README.md            # 本文件
```

## 与 TypeScript 版本的兼容性

Python 版本与 TypeScript 版本完全兼容：

- **权重文件格式**: 完全相同的 JSON 格式
- **模式定义**: 使用相同的 N-Tuple 模式
- **训练算法**: 相同的 TD(0) 学习算法
- **输出格式**: 相同的元数据和统计信息

您可以在 Python 和 TypeScript 版本之间交换权重文件。

## 性能

Python 版本使用以下优化：

- **位棋盘表示**: 使用 Python int 表示 64 位棋盘
- **预计算表**: 65536 个移动结果预计算
- **NumPy 数组**: 使用 float64 精度的 NumPy 数组存储权重
- **对称变换**: 预计算 8 种对称变换

典型训练速度：约 30-50 轮/秒（取决于硬件）

## 故障排除

### 训练不收敛

**症状**: 经过多轮训练后分数没有提升。

**解决方案**:
1. 增加训练轮数（建议 500,000+）
2. 启用学习率衰减: `--decay`
3. 尝试不同的学习率: `--learning-rate 0.001`

### 内存不足

**症状**: 训练时出现内存错误。

**解决方案**:
1. 使用 4-tuple 模式（默认已使用）
2. 减少检查点保存间隔
3. 关闭其他占用内存的程序

### 验证失败

**症状**: 运行验证脚本时出现错误。

**解决方案**:
1. 确保安装了 NumPy: `pip install numpy`
2. 检查 Python 版本（建议 3.8+）

## 许可证

MIT
