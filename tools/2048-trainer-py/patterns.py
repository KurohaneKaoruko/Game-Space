"""
2048 N-Tuple Network Training - Pattern Definitions

定义用于2048游戏AI训练的N-Tuple元组模式。
这些模式与Web应用中的模式兼容，确保训练出的权重可以直接在Web应用中使用。

2048棋盘位置索引布局（4x4）：
 0  1  2  3
 4  5  6  7
 8  9 10 11
12 13 14 15
"""

from typing import List

Pattern = List[int]

HORIZONTAL_4TUPLE: List[Pattern] = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
]

VERTICAL_4TUPLE: List[Pattern] = [
    [0, 4, 8, 12],
    [1, 5, 9, 13],
    [2, 6, 10, 14],
    [3, 7, 11, 15],
]

RECTANGLE_6TUPLE: List[Pattern] = [
    [0, 1, 2, 4, 5, 6],
    [1, 2, 3, 5, 6, 7],
    [4, 5, 6, 8, 9, 10],
    [5, 6, 7, 9, 10, 11],
    [8, 9, 10, 12, 13, 14],
    [9, 10, 11, 13, 14, 15],
]

CORNER_6TUPLE: List[Pattern] = [
    [0, 1, 4, 5, 8, 9],
    [2, 3, 6, 7, 10, 11],
    [4, 5, 8, 9, 12, 13],
    [6, 7, 10, 11, 14, 15],
]

STANDARD_6TUPLE_PATTERNS: List[Pattern] = [
    [0, 1, 2, 4, 5, 6],
    [4, 5, 6, 8, 9, 10],
    [1, 2, 3, 5, 6, 7],
    [5, 6, 7, 9, 10, 11],
    [8, 9, 10, 12, 13, 14],
    [9, 10, 11, 13, 14, 15],
    [0, 1, 4, 5, 8, 9],
    [2, 3, 6, 7, 10, 11],
    [4, 5, 8, 9, 12, 13],
    [6, 7, 10, 11, 14, 15],
]

ROW_COL_4TUPLE_PATTERNS: List[Pattern] = [
    [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
    [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
]

DEFAULT_TRAINING_PATTERNS: List[Pattern] = ROW_COL_4TUPLE_PATTERNS


def calculate_lut_size(tuple_size: int) -> int:
    return 16 ** tuple_size
