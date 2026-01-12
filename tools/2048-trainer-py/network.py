"""
2048 N-Tuple Network Training - Network Implementation

训练专用的N-Tuple Network实现，使用numpy数组存储权重以提高精度。
支持从位棋盘直接提取特征，避免矩阵转换开销。

与Web应用的NTupleNetwork兼容，可以导出/导入相同格式的权重文件。
"""

from typing import List, Dict, Any, Optional, Callable
import numpy as np
from game import Board, get_tile
from patterns import Pattern, calculate_lut_size

BOARD_SIZE = 4


PositionTransform = Callable[[int], int]


def coord_to_pos(row: int, col: int) -> int:
    return row * BOARD_SIZE + col


def pos_to_coord(pos: int) -> tuple[int, int]:
    return (pos // BOARD_SIZE, pos % BOARD_SIZE)


def identity(pos: int) -> int:
    return pos


def rotate90(pos: int) -> int:
    row, col = pos_to_coord(pos)
    return coord_to_pos(col, BOARD_SIZE - 1 - row)


def rotate180(pos: int) -> int:
    row, col = pos_to_coord(pos)
    return coord_to_pos(BOARD_SIZE - 1 - row, BOARD_SIZE - 1 - col)


def rotate270(pos: int) -> int:
    row, col = pos_to_coord(pos)
    return coord_to_pos(BOARD_SIZE - 1 - col, row)


def mirror_h(pos: int) -> int:
    row, col = pos_to_coord(pos)
    return coord_to_pos(row, BOARD_SIZE - 1 - col)


def mirror_h_rotate90(pos: int) -> int:
    return rotate90(mirror_h(pos))


def mirror_h_rotate180(pos: int) -> int:
    return rotate180(mirror_h(pos))


def mirror_h_rotate270(pos: int) -> int:
    return rotate270(mirror_h(pos))


SYMMETRY_TRANSFORMS: List[PositionTransform] = [
    identity,
    rotate90,
    rotate180,
    rotate270,
    mirror_h,
    mirror_h_rotate90,
    mirror_h_rotate180,
    mirror_h_rotate270,
]


def precompute_symmetric_patterns(pattern: Pattern) -> List[Pattern]:
    return [list(map(transform, pattern)) for transform in SYMMETRY_TRANSFORMS]


def extract_tuple_index(board: Board, pattern: Pattern) -> int:
    index = 0
    for pos in pattern:
        tile_exp = get_tile(board, pos)
        index = index * 16 + tile_exp
    return index


class NTupleNetwork:
    def __init__(self, patterns: List[Pattern]):
        self.patterns: List[Pattern] = patterns
        self.lut_sizes: List[int] = [calculate_lut_size(len(p)) for p in patterns]

        self.weights: List[np.ndarray] = [np.zeros(size, dtype=np.float64) for size in self.lut_sizes]

        self.symmetric_patterns: List[List[Pattern]] = [
            precompute_symmetric_patterns(pattern) for pattern in self.patterns
        ]

    def evaluate(self, board: Board) -> float:
        total_score = 0.0

        for pattern_idx in range(len(self.patterns)):
            symmetric_patterns_for_tuple = self.symmetric_patterns[pattern_idx]
            weights_for_tuple = self.weights[pattern_idx]

            for transformed_pattern in symmetric_patterns_for_tuple:
                index = extract_tuple_index(board, transformed_pattern)
                total_score += weights_for_tuple[index]

        return total_score

    def update_weights(self, board: Board, delta: float) -> None:
        for pattern_idx in range(len(self.patterns)):
            symmetric_patterns_for_tuple = self.symmetric_patterns[pattern_idx]
            weights_for_tuple = self.weights[pattern_idx]

            for transformed_pattern in symmetric_patterns_for_tuple:
                index = extract_tuple_index(board, transformed_pattern)
                weights_for_tuple[index] += delta

    def init_optimistic(self, value: float) -> None:
        for weights in self.weights:
            weights.fill(value)

    def export_weights(self, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return {
            'version': 1,
            'patterns': self.patterns,
            'weights': [w.tolist() for w in self.weights],
            'metadata': metadata,
        }

    def load_weights(self, config: Dict[str, Any]) -> None:
        if len(config['patterns']) != len(self.patterns):
            raise ValueError(
                f'Pattern count mismatch: expected {len(self.patterns)}, got {len(config["patterns"])}'
            )

        for i in range(len(self.patterns)):
            if len(config['patterns'][i]) != len(self.patterns[i]):
                raise ValueError(
                    f'Pattern size mismatch at index {i}: expected {len(self.patterns[i])}, got {len(config["patterns"][i])}'
                )

        if len(config['weights']) != len(self.patterns):
            raise ValueError(
                f'Weight array count mismatch: expected {len(self.patterns)}, got {len(config["weights"])}'
            )

        for i in range(len(config['weights'])):
            expected_size = self.lut_sizes[i]
            actual_size = len(config['weights'][i])

            if actual_size != expected_size:
                raise ValueError(
                    f'Weight dimension mismatch for tuple {i}: expected {expected_size}, got {actual_size}'
                )

            self.weights[i] = np.array(config['weights'][i], dtype=np.float64)

    def get_patterns(self) -> List[Pattern]:
        return self.patterns

    def get_lut_sizes(self) -> List[int]:
        return self.lut_sizes

    def get_weights(self) -> List[np.ndarray]:
        return self.weights
