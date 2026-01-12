"""
2048 N-Tuple Network Training - TD Learning Trainer

实现TD(0) Learning算法的训练器，通过自我对弈来学习最优的权重参数。

TD Learning核心思想：
1. AI使用当前权重进行游戏决策
2. 每次移动后，根据实际获得的奖励和下一状态的预估价值来更新权重
3. 通过大量游戏迭代，权重逐渐收敛到最优值

更新公式：w += α × (reward + V(next_afterstate) - V(current_afterstate))
"""

from typing import Dict, Any, Optional, List
import json
import time
import signal
import sys
import os
from game import Game, Board, Direction
from network import NTupleNetwork

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


class TrainingConfig:
    def __init__(
        self,
        episodes: int = 100000,
        learning_rate: float = 0.0025,
        enable_decay: bool = False,
        decay_rate: float = 0.95,
        decay_interval: int = 10000,
        optimistic_init: float = 0,
        report_interval: int = 100,
        output_path: str = 'weights.json',
        checkpoint_interval: int = 1000,
        checkpoint_path: str = 'checkpoint.json',
        weights_save_interval: int = 300,
    ):
        self.episodes = episodes
        self.learning_rate = learning_rate
        self.enable_decay = enable_decay
        self.decay_rate = decay_rate
        self.decay_interval = decay_interval
        self.optimistic_init = optimistic_init
        self.report_interval = report_interval
        
        if not os.path.isabs(output_path):
            self.output_path = os.path.join(SCRIPT_DIR, output_path)
        else:
            self.output_path = output_path
            
        self.checkpoint_interval = checkpoint_interval
        
        if not os.path.isabs(checkpoint_path):
            self.checkpoint_path = os.path.join(SCRIPT_DIR, checkpoint_path)
        else:
            self.checkpoint_path = checkpoint_path
            
        self.weights_save_interval = weights_save_interval


class EpisodeResult:
    def __init__(self, score: int, max_tile: int, moves: int):
        self.score = score
        self.max_tile = max_tile
        self.moves = moves


class TrainingStats:
    def __init__(self):
        self.episode = 0
        self.total_score = 0
        self.avg_score = 0.0
        self.recent_avg_score = 0.0
        self.max_tile = 0
        self.rate2048 = 0.0
        self.rate4096 = 0.0
        self.rate8192 = 0.0
        self.episodes_per_second = 0.0
        self.elapsed_time = 0.0
        self.estimated_remaining = 0.0


class CheckpointData:
    def __init__(
        self,
        version: int,
        config: Dict[str, Any],
        episode: int,
        current_learning_rate: float,
        stats: Dict[str, Any],
        milestone_count: Dict[str, int],
        recent_scores: List[float],
        weights: Dict[str, Any],
        timestamp: int,
    ):
        self.version = version
        self.config = config
        self.episode = episode
        self.current_learning_rate = current_learning_rate
        self.stats = stats
        self.milestone_count = milestone_count
        self.recent_scores = recent_scores
        self.weights = weights
        self.timestamp = timestamp

    def to_dict(self) -> Dict[str, Any]:
        return {
            'version': self.version,
            'config': self.config,
            'episode': self.episode,
            'currentLearningRate': self.current_learning_rate,
            'stats': self.stats,
            'milestoneCount': self.milestone_count,
            'recentScores': self.recent_scores,
            'weights': self.weights,
            'timestamp': self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CheckpointData':
        return cls(
            version=data['version'],
            config=data['config'],
            episode=data['episode'],
            current_learning_rate=data['currentLearningRate'],
            stats=data['stats'],
            milestone_count=data['milestoneCount'],
            recent_scores=data['recentScores'],
            weights=data['weights'],
            timestamp=data['timestamp'],
        )


DEFAULT_TRAINING_CONFIG = TrainingConfig()


class Trainer:
    def __init__(self, network: NTupleNetwork, config: Optional[TrainingConfig] = None):
        self.network = network
        self.config = config if config is not None else DEFAULT_TRAINING_CONFIG
        self.current_learning_rate = self.config.learning_rate
        self.start_episode = 1
        self.weights_loaded = False

        self.stats = TrainingStats()
        self.recent_scores: List[float] = []
        self.milestone_count = {'tile2048': 0, 'tile4096': 0, 'tile8192': 0}
        self.start_time = 0
        self.last_weights_save_time = 0

        if self.config.optimistic_init > 0:
            self.network.init_optimistic(self.config.optimistic_init)

    def load_checkpoint(self, checkpoint_path: Optional[str] = None) -> bool:
        path = checkpoint_path if checkpoint_path is not None else self.config.checkpoint_path

        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if data['version'] != 1:
                print(f'警告：检查点版本不匹配：期望 1，实际 {data["version"]}')
                return False

            checkpoint = CheckpointData.from_dict(data)

            self.start_episode = checkpoint.episode + 1
            self.current_learning_rate = checkpoint.current_learning_rate
            self.stats = TrainingStats()
            self.stats.episode = checkpoint.stats['episode']
            self.stats.total_score = checkpoint.stats['totalScore']
            self.stats.avg_score = checkpoint.stats['avgScore']
            self.stats.recent_avg_score = checkpoint.stats['recentAvgScore']
            self.stats.max_tile = checkpoint.stats['maxTile']
            self.stats.rate2048 = checkpoint.stats['rate2048']
            self.stats.rate4096 = checkpoint.stats['rate4096']
            self.stats.rate8192 = checkpoint.stats['rate8192']
            self.stats.episodes_per_second = checkpoint.stats['episodesPerSecond']
            self.stats.elapsed_time = checkpoint.stats['elapsedTime']
            self.stats.estimated_remaining = checkpoint.stats['estimatedRemaining']

            self.milestone_count = checkpoint.milestone_count
            self.recent_scores = checkpoint.recent_scores

            self.network.load_weights(checkpoint.weights)
            self.weights_loaded = True

            print(f'检查点已从 {path} 加载')
            print(f'从第 {self.start_episode} 轮继续训练')

            return True
        except FileNotFoundError:
            return False
        except Exception as e:
            print(f'加载检查点失败: {e}')
            return False

    def load_weights(self, weights_path: Optional[str] = None) -> bool:
        path = weights_path if weights_path is not None else self.config.output_path

        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self.network.load_weights(data)
            self.weights_loaded = True

            if 'metadata' in data and data['metadata']:
                metadata = data['metadata']
                print(f'权重已从 {path} 加载')
                print(f'  已训练局数: {metadata.get("trainedGames", "N/A")}')
                print(f'  平均得分: {metadata.get("avgScore", "N/A")}')
                print(f'  最大方块: {metadata.get("maxTile", "N/A")}')
                print(f'  训练时间: {metadata.get("trainingTime", "N/A")}秒')
            else:
                print(f'权重已从 {path} 加载')

            return True
        except FileNotFoundError:
            return False
        except Exception as e:
            print(f'加载权重失败: {e}')
            return False

    def save_checkpoint(self) -> None:
        metadata = {
            'trainedGames': self.stats.episode,
            'avgScore': round(self.stats.avg_score),
            'maxTile': self.stats.max_tile,
            'rate2048': round(self.stats.rate2048 * 10000) / 10000,
            'rate4096': round(self.stats.rate4096 * 10000) / 10000,
            'rate8192': round(self.stats.rate8192 * 10000) / 10000,
            'trainingTime': round(self.stats.elapsed_time),
        }

        weights_config = self.network.export_weights(metadata)

        checkpoint_data = CheckpointData(
            version=1,
            config=self.config.__dict__,
            episode=self.stats.episode,
            current_learning_rate=self.current_learning_rate,
            stats={
                'episode': self.stats.episode,
                'totalScore': self.stats.total_score,
                'avgScore': self.stats.avg_score,
                'recentAvgScore': self.stats.recent_avg_score,
                'maxTile': self.stats.max_tile,
                'rate2048': self.stats.rate2048,
                'rate4096': self.stats.rate4096,
                'rate8192': self.stats.rate8192,
                'episodesPerSecond': self.stats.episodes_per_second,
                'elapsedTime': self.stats.elapsed_time,
                'estimatedRemaining': self.stats.estimated_remaining,
            },
            milestone_count=self.milestone_count,
            recent_scores=self.recent_scores,
            weights=weights_config,
            timestamp=int(time.time() * 1000),
        )

        with open(self.config.checkpoint_path, 'w', encoding='utf-8') as f:
            json.dump(checkpoint_data.to_dict(), f, indent=2)

    def save_weights_periodically(self) -> None:
        metadata = {
            'trainedGames': self.stats.episode,
            'avgScore': round(self.stats.avg_score),
            'maxTile': self.stats.max_tile,
            'rate2048': round(self.stats.rate2048 * 10000) / 10000,
            'rate4096': round(self.stats.rate4096 * 10000) / 10000,
            'rate8192': round(self.stats.rate8192 * 10000) / 10000,
            'trainingTime': round(self.stats.elapsed_time),
        }

        weights_config = self.network.export_weights(metadata)

        with open(self.config.output_path, 'w', encoding='utf-8') as f:
            json.dump(weights_config, f, indent=2)

        print(f'\n  [权重已保存: {self.config.output_path} @ 第 {self.stats.episode} 轮]')

    def train(self, resume: bool = False) -> None:
        if resume:
            if not self.load_checkpoint():
                print('未找到检查点文件，尝试加载权重文件...')
                if not self.load_weights():
                    print('未找到已有权重，从零开始训练。')
        else:
            if os.path.exists(self.config.output_path):
                print(f'发现已有权重文件: {self.config.output_path}')
                print('加载权重以继续训练...')
                if self.load_weights():
                    print()
                else:
                    print('加载权重失败，从零开始训练。')
                    print()

        print('=' * 60)
        print('N-Tuple Network 训练')
        print('=' * 60)
        print(f'训练轮数: {self.config.episodes}')
        print(f'学习率: {self.config.learning_rate}')
        if self.config.enable_decay:
            print(f'学习率衰减: 启用 (衰减率={self.config.decay_rate}, 间隔={self.config.decay_interval})')
        else:
            print('学习率衰减: 禁用')
        print(f'乐观初始化: {self.config.optimistic_init if self.config.optimistic_init > 0 else "禁用"}')
        print(f'输出文件: {self.config.output_path}')
        print(f'检查点: {self.config.checkpoint_path} (每 {self.config.checkpoint_interval} 轮)')
        print(f'权重保存: 每 {self.config.weights_save_interval} 秒')
        if self.start_episode > 1:
            print(f'从第 {self.start_episode} 轮继续训练')
        print('=' * 60)
        print()

        self.start_time = time.time()
        self.last_weights_save_time = self.start_time
        last_progress_time = self.start_time
        last_checkpoint_episode = self.start_episode - 1

        def handle_interrupt(signum, frame):
            print('\n\n训练中断！保存检查点和权重...')
            self.save_checkpoint()
            self.save_weights_periodically()
            print('检查点和权重已保存。使用 --resume 标志继续训练。')
            sys.exit(0)

        signal.signal(signal.SIGINT, handle_interrupt)
        if hasattr(signal, 'SIGTERM'):
            signal.signal(signal.SIGTERM, handle_interrupt)

        if not self.weights_loaded:
            print('保存初始权重...')
            self.save_weights_periodically()

        for ep in range(self.start_episode, self.config.episodes + 1):
            result = self.train_episode()
            self.update_stats(ep, result)

            if self.config.enable_decay and ep % self.config.decay_interval == 0:
                self.current_learning_rate *= self.config.decay_rate

            now = time.time()
            time_since_last_progress = now - last_progress_time

            if ep % self.config.report_interval == 0 or time_since_last_progress >= 5:
                self.report_progress()
                last_progress_time = now
            elif ep % 10 == 0 and ep < self.start_episode + 100:
                print('.', end='', flush=True)

            if self.config.checkpoint_interval > 0 and ep - last_checkpoint_episode >= self.config.checkpoint_interval:
                self.save_checkpoint()
                last_checkpoint_episode = ep

            if self.config.weights_save_interval > 0:
                time_since_last_save = now - self.last_weights_save_time
                if time_since_last_save >= self.config.weights_save_interval:
                    self.save_weights_periodically()
                    self.last_weights_save_time = now

        print()
        print('=' * 60)
        print('训练完成！')
        print('=' * 60)
        self.report_progress()
        self.save_weights()

        if os.path.exists(self.config.checkpoint_path):
            os.remove(self.config.checkpoint_path)
            print('检查点文件已删除。')

    def train_episode(self) -> EpisodeResult:
        game = Game()
        game.init()

        moves = 0
        prev_afterstate: Optional[Board] = None
        prev_value = 0.0

        while not game.is_game_over():
            best_move = self.select_best_move(game)

            if best_move == -1:
                break

            afterstate_result = game.get_afterstate(best_move)

            if afterstate_result is None:
                continue

            afterstate, reward = afterstate_result
            current_value = self.network.evaluate(afterstate)

            if prev_afterstate is not None:
                td_error = reward + current_value - prev_value
                self.network.update_weights(prev_afterstate, self.current_learning_rate * td_error)

            game.move(best_move)
            game.add_random_tile()

            prev_afterstate = afterstate
            prev_value = current_value
            moves += 1

        if prev_afterstate is not None:
            final_td_error = 0 - prev_value
            self.network.update_weights(prev_afterstate, self.current_learning_rate * final_td_error)

        return EpisodeResult(score=game.score, max_tile=game.get_max_tile(), moves=moves)

    def select_best_move(self, game: Game) -> Direction:
        best_dir: Direction = -1
        best_value = float('-inf')

        for dir in range(4):
            result = game.get_afterstate(dir)

            if result is not None:
                value = result[1] + self.network.evaluate(result[0])

                if value > best_value:
                    best_value = value
                    best_dir = dir

        return best_dir

    def get_current_learning_rate(self) -> float:
        return self.current_learning_rate

    def update_stats(self, episode: int, result: EpisodeResult) -> None:
        self.stats.episode = episode
        self.stats.total_score += result.score
        self.stats.avg_score = self.stats.total_score / episode

        if result.max_tile > self.stats.max_tile:
            self.stats.max_tile = result.max_tile

        if result.max_tile >= 2048:
            self.milestone_count['tile2048'] += 1
        if result.max_tile >= 4096:
            self.milestone_count['tile4096'] += 1
        if result.max_tile >= 8192:
            self.milestone_count['tile8192'] += 1

        self.stats.rate2048 = self.milestone_count['tile2048'] / episode
        self.stats.rate4096 = self.milestone_count['tile4096'] / episode
        self.stats.rate8192 = self.milestone_count['tile8192'] / episode

        self.recent_scores.append(result.score)
        if len(self.recent_scores) > 1000:
            self.recent_scores.pop(0)

        recent_sum = sum(self.recent_scores)
        self.stats.recent_avg_score = recent_sum / len(self.recent_scores)

        now = time.time()
        self.stats.elapsed_time = now - self.start_time

        episodes_this_run = episode - self.start_episode + 1
        self.stats.episodes_per_second = episodes_this_run / self.stats.elapsed_time

        remaining_episodes = self.config.episodes - episode
        self.stats.estimated_remaining = remaining_episodes / self.stats.episodes_per_second

    def report_progress(self) -> None:
        progress = (self.stats.episode / self.config.episodes * 100)

        def format_time(seconds: float) -> str:
            if seconds < 60:
                return f'{int(seconds)}s'
            elif seconds < 3600:
                return f'{int(seconds // 60)}m{int(seconds % 60)}s'
            else:
                return f'{int(seconds // 3600)}h{int((seconds % 3600) // 60)}m'

        bar_width = 20
        filled = int(self.stats.episode / self.config.episodes * bar_width)
        bar = '█' * filled + '░' * (bar_width - filled)

        line = (f'[{bar}] {progress:5.1f}% | '
                 f'轮: {self.stats.episode:6d}/{self.config.episodes} | '
                 f'得分: {self.stats.recent_avg_score:6.0f} | '
                 f'2048: {self.stats.rate2048 * 100:5.1f}% | '
                 f'速度: {self.stats.episodes_per_second:4.0f} 轮/秒 | '
                 f'剩余: {format_time(self.stats.estimated_remaining):8s}')

        print(f'\r{line}', end='', flush=True)

        if self.stats.episode % 1000 == 0 or self.stats.episode == self.config.episodes:
            print()
            print(f'  最大: {self.stats.max_tile} | '
                  f'4096: {self.stats.rate4096 * 100:5.1f}% | '
                  f'8192: {self.stats.rate8192 * 100:5.1f}% | '
                  f'学习率: {self.current_learning_rate:.2e}')

    def save_weights(self) -> None:
        metadata = {
            'trainedGames': self.stats.episode,
            'avgScore': round(self.stats.avg_score),
            'maxTile': self.stats.max_tile,
            'rate2048': round(self.stats.rate2048 * 10000) / 10000,
            'rate4096': round(self.stats.rate4096 * 10000) / 10000,
            'rate8192': round(self.stats.rate8192 * 10000) / 10000,
            'trainingTime': round(self.stats.elapsed_time),
        }

        weights_config = self.network.export_weights(metadata)

        with open(self.config.output_path, 'w', encoding='utf-8') as f:
            json.dump(weights_config, f, indent=2)

        print(f'权重已保存到: {self.config.output_path}')

    def get_stats(self) -> TrainingStats:
        return self.stats

    def get_config(self) -> TrainingConfig:
        return self.config
