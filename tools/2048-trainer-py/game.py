"""
2048 N-Tuple Network Training - High Performance Game Engine

使用位棋盘（bitboard）表示实现高性能2048游戏引擎。
每个方块用4位表示（0-15对应空格到32768），整个棋盘用64位整数表示。

棋盘位置布局（从高位到低位）：
位置:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
位:   60 56 52 48 44 40 36 32 28 24 20 16 12  8  4  0

方块值编码：
0 = 空格
1 = 2
2 = 4
3 = 8
...
15 = 32768
"""

from typing import Optional, Tuple, List
import random

Board = int
Direction = int

LEFT_TABLE: List[Tuple[int, int]] = [(0, 0)] * 65536
RIGHT_TABLE: List[Tuple[int, int]] = [(0, 0)] * 65536

tables_initialized = False


def compute_row_left(row: int) -> Tuple[int, int]:
    tiles = [
        (row >> 12) & 0xF,
        (row >> 8) & 0xF,
        (row >> 4) & 0xF,
        row & 0xF,
    ]

    score = 0
    non_empty = [t for t in tiles if t != 0]

    merged: List[int] = []
    i = 0
    while i < len(non_empty):
        if i + 1 < len(non_empty) and non_empty[i] == non_empty[i + 1]:
            new_value = non_empty[i] + 1
            merged.append(new_value)
            score += 1 << new_value
            i += 2
        else:
            merged.append(non_empty[i])
            i += 1

    while len(merged) < 4:
        merged.append(0)

    new_row = (merged[0] << 12) | (merged[1] << 8) | (merged[2] << 4) | merged[3]

    return (new_row, score)


def reverse_row(row: int) -> int:
    return (
        ((row & 0xF) << 12) |
        (((row >> 4) & 0xF) << 8) |
        (((row >> 8) & 0xF) << 4) |
        ((row >> 12) & 0xF)
    )


def init_tables() -> None:
    global tables_initialized
    if tables_initialized:
        return

    for row in range(65536):
        LEFT_TABLE[row] = compute_row_left(row)

        reversed_row = reverse_row(row)
        left_result = compute_row_left(reversed_row)
        RIGHT_TABLE[row] = (
            reverse_row(left_result[0]),
            left_result[1]
        )

    tables_initialized = True


def extract_row(board: Board, row_index: int) -> int:
    shift = (3 - row_index) * 16
    return (board >> shift) & 0xFFFF


def set_row(board: Board, row_index: int, row: int) -> Board:
    shift = (3 - row_index) * 16
    mask = ~(0xFFFF << shift)
    return (board & mask) | (row << shift)


def transpose(board: Board) -> Board:
    tiles: List[int] = []
    for i in range(16):
        shift = (15 - i) * 4
        tiles.append((board >> shift) & 0xF)

    transposed: List[int] = [0] * 16
    for r in range(4):
        for c in range(4):
            transposed[c * 4 + r] = tiles[r * 4 + c]

    result = 0
    for i in range(16):
        result = (result << 4) | transposed[i]

    return result


def move_left(board: Board) -> Optional[Tuple[Board, int]]:
    if not tables_initialized:
        init_tables()

    new_board = 0
    total_score = 0
    moved = False

    for r in range(4):
        row = extract_row(board, r)
        result = LEFT_TABLE[row]
        new_board = set_row(new_board, r, result[0])
        total_score += result[1]
        if result[0] != row:
            moved = True

    return (new_board, total_score) if moved else None


def move_right(board: Board) -> Optional[Tuple[Board, int]]:
    if not tables_initialized:
        init_tables()

    new_board = 0
    total_score = 0
    moved = False

    for r in range(4):
        row = extract_row(board, r)
        result = RIGHT_TABLE[row]
        new_board = set_row(new_board, r, result[0])
        total_score += result[1]
        if result[0] != row:
            moved = True

    return (new_board, total_score) if moved else None


def move_up(board: Board) -> Optional[Tuple[Board, int]]:
    transposed = transpose(board)
    result = move_left(transposed)
    if result is None:
        return None
    return (transpose(result[0]), result[1])


def move_down(board: Board) -> Optional[Tuple[Board, int]]:
    transposed = transpose(board)
    result = move_right(transposed)
    if result is None:
        return None
    return (transpose(result[0]), result[1])


def move(board: Board, dir: Direction) -> Optional[Tuple[Board, int]]:
    if dir == 0:
        return move_up(board)
    elif dir == 1:
        return move_right(board)
    elif dir == 2:
        return move_down(board)
    elif dir == 3:
        return move_left(board)
    return None


def count_empty(board: Board) -> int:
    count = 0
    b = board
    for _ in range(16):
        if (b & 0xF) == 0:
            count += 1
        b >>= 4
    return count


def get_empty_positions(board: Board) -> List[int]:
    positions: List[int] = []
    for i in range(16):
        shift = (15 - i) * 4
        if ((board >> shift) & 0xF) == 0:
            positions.append(i)
    return positions


def set_tile(board: Board, pos: int, value: int) -> Board:
    shift = (15 - pos) * 4
    mask = ~(0xF << shift)
    return (board & mask) | (value << shift)


def get_tile(board: Board, pos: int) -> int:
    shift = (15 - pos) * 4
    return (board >> shift) & 0xF


def add_random_tile(board: Board) -> Board:
    empty_positions = get_empty_positions(board)
    if len(empty_positions) == 0:
        return board

    pos = random.choice(empty_positions)
    value = 1 if random.random() < 0.9 else 2

    return set_tile(board, pos, value)


def get_max_tile(board: Board) -> int:
    max_exp = 0
    b = board
    for _ in range(16):
        exp = b & 0xF
        if exp > max_exp:
            max_exp = exp
        b >>= 4
    return 0 if max_exp == 0 else 1 << max_exp


def is_game_over(board: Board) -> bool:
    if count_empty(board) > 0:
        return False

    for r in range(4):
        for c in range(4):
            pos = r * 4 + c
            tile = get_tile(board, pos)

            if c < 3 and get_tile(board, pos + 1) == tile:
                return False

            if r < 3 and get_tile(board, pos + 4) == tile:
                return False

    return True


def matrix_to_board(matrix: List[List[int]]) -> Board:
    board = 0
    for r in range(4):
        for c in range(4):
            value = matrix[r][c]
            exp = 0 if value == 0 else int(value.bit_length() - 1)
            board = (board << 4) | exp
    return board


def board_to_matrix(board: Board) -> List[List[int]]:
    matrix: List[List[int]] = []
    for r in range(4):
        row: List[int] = []
        for c in range(4):
            pos = r * 4 + c
            exp = get_tile(board, pos)
            row.append(0 if exp == 0 else 1 << exp)
        matrix.append(row)
    return matrix


def print_board(board: Board) -> None:
    matrix = board_to_matrix(board)
    print('┌──────┬──────┬──────┬──────┐')
    for r in range(4):
        row = [str(v).rjust(4) if v != 0 else '    ' for v in matrix[r]]
        print(f'│ {" │ ".join(row)} │')
        if r < 3:
            print('├──────┼──────┼──────┼──────┤')
    print('└──────┴──────┴──────┴──────┘')


class Game:
    def __init__(self):
        self.board: Board = 0
        self.score: int = 0

    def init(self) -> None:
        init_tables()
        self.board = 0
        self.score = 0
        self.board = add_random_tile(self.board)
        self.board = add_random_tile(self.board)

    def move(self, dir: Direction) -> Tuple[bool, int]:
        result = move(self.board, dir)

        if result is None:
            return (False, 0)

        self.board = result[0]
        self.score += result[1]

        return (True, result[1])

    def get_afterstate(self, dir: Direction) -> Optional[Tuple[Board, int]]:
        return move(self.board, dir)

    def add_random_tile(self) -> None:
        self.board = add_random_tile(self.board)

    def is_game_over(self) -> bool:
        return is_game_over(self.board)

    def get_max_tile(self) -> int:
        return get_max_tile(self.board)

    def count_empty(self) -> int:
        return count_empty(self.board)

    def clone(self) -> 'Game':
        game = Game()
        game.board = self.board
        game.score = self.score
        return game

    def set_from_matrix(self, matrix: List[List[int]], score: int = 0) -> None:
        self.board = matrix_to_board(matrix)
        self.score = score

    def to_matrix(self) -> List[List[int]]:
        return board_to_matrix(self.board)

    def print(self) -> None:
        print(f'Score: {self.score}')
        print_board(self.board)
