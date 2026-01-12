"""
2048 N-Tuple Network Training - Command Line Entry Point

命令行训练程序入口，支持配置训练参数。
支持CPU训练模式。

用法：
  python train.py [options]

选项：
  --episodes <n>       训练轮数（默认：100000）
  --learning-rate <n>  学习率（默认：0.0025）
  --output <path>      输出文件路径（默认：weights.json）
  --decay              启用学习率衰减
  --optimistic <n>     乐观初始值（默认：0，不使用）
  --report <n>         进度报告间隔（默认：100）
  --checkpoint <n>     检查点保存间隔（默认：1000）
  --checkpoint-path <p> 检查点文件路径（默认：checkpoint.json）
  --weights-save <n>   权重保存间隔（秒）（默认：300）
  --resume             从检查点恢复训练
  --help               显示帮助信息
"""

import argparse
import sys
from network import NTupleNetwork
from trainer import Trainer, TrainingConfig
from patterns import DEFAULT_TRAINING_PATTERNS


def print_help() -> None:
    print("""
2048 N-Tuple Network 训练程序

用法：
  python train.py [选项]

基本选项：
  --episodes <n>       训练轮数（默认：100000）
  --learning-rate <n>  学习率 α（默认：0.0025）
  --output <path>      权重输出文件路径（默认：weights.json）
  --decay              启用学习率衰减
  --optimistic <n>     乐观初始权重值（默认：0，禁用）
  --report <n>         进度报告间隔（默认：100）
  --checkpoint <n>     检查点保存间隔（默认：1000）
  --checkpoint-path <p> 检查点文件路径（默认：checkpoint.json）
  --weights-save <n>   权重保存间隔（秒）（默认：300，0表示禁用）
  --resume             从检查点恢复训练
  --help               显示此帮助信息

示例：
  # 基本训练，100,000 轮
  python train.py --output weights.json

  # 启用学习率衰减的训练
  python train.py --episodes 100000 --decay --output weights.json

  # 恢复中断的训练
  python train.py --resume --output weights.json

  # 自定义检查点间隔（每 5000 轮保存一次）
  python train.py --checkpoint 5000 --output weights.json

  # 自定义权重保存间隔（每 10 分钟保存一次）
  python train.py --weights-save 600 --output weights.json

  # 禁用定时权重保存
  python train.py --weights-save 0 --output weights.json

注意：
  - 按 Ctrl+C 中断训练，进度将自动保存到检查点。
  - 使用 --resume 从上次中断的位置继续训练。
""")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='2048 N-Tuple Network 训练程序',
        add_help=False
    )

    parser.add_argument(
        '--episodes', '-e',
        type=int,
        default=100000,
        help='训练轮数（默认：100000）'
    )

    parser.add_argument(
        '--learning-rate', '-l',
        type=float,
        default=0.0025,
        help='学习率 α（默认：0.0025）'
    )

    parser.add_argument(
        '--output', '-o',
        type=str,
        default='weights.json',
        help='权重输出文件路径（默认：weights.json）'
    )

    parser.add_argument(
        '--decay', '-d',
        action='store_true',
        help='启用学习率衰减'
    )

    parser.add_argument(
        '--optimistic',
        type=float,
        default=0,
        help='乐观初始权重值（默认：0，禁用）'
    )

    parser.add_argument(
        '--report', '-r',
        type=int,
        default=100,
        help='进度报告间隔（默认：100）'
    )

    parser.add_argument(
        '--checkpoint', '-c',
        type=int,
        default=1000,
        help='检查点保存间隔（默认：1000）'
    )

    parser.add_argument(
        '--checkpoint-path',
        type=str,
        default='checkpoint.json',
        help='检查点文件路径（默认：checkpoint.json）'
    )

    parser.add_argument(
        '--weights-save', '-w',
        type=int,
        default=300,
        help='权重保存间隔（秒）（默认：300，0表示禁用）'
    )

    parser.add_argument(
        '--resume',
        action='store_true',
        help='从检查点恢复训练'
    )

    parser.add_argument(
        '--help', '-h',
        action='store_true',
        help='显示帮助信息'
    )

    args = parser.parse_args()

    if args.help:
        print_help()
        sys.exit(0)

    if args.episodes <= 0:
        print('Error: episodes must be positive')
        sys.exit(1)

    if args.learning_rate <= 0 or args.learning_rate > 1:
        print('Error: learning rate must be between 0 and 1')
        sys.exit(1)

    if args.report <= 0:
        print('Error: report interval must be positive')
        sys.exit(1)

    if args.checkpoint < 0:
        print('Error: checkpoint interval must be non-negative')
        sys.exit(1)

    if args.weights_save < 0:
        print('Error: weights save interval must be non-negative')
        sys.exit(1)

    return args


def main() -> None:
    args = parse_args()

    network = NTupleNetwork(DEFAULT_TRAINING_PATTERNS)

    config = TrainingConfig(
        episodes=args.episodes,
        learning_rate=args.learning_rate,
        output_path=args.output,
        enable_decay=args.decay,
        optimistic_init=args.optimistic,
        report_interval=args.report,
        checkpoint_interval=args.checkpoint,
        checkpoint_path=args.checkpoint_path,
        weights_save_interval=args.weights_save,
    )

    trainer = Trainer(network, config)
    trainer.train(args.resume)


if __name__ == '__main__':
    main()
