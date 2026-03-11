import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Pause, Clock, Zap, Info, X, Frown } from 'lucide-react';
import { BlockData, GameMode, GRID_COLS, GRID_ROWS, INITIAL_ROWS, MAX_TARGET, MIN_TARGET } from './types';

export default function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [grid, setGrid] = useState<BlockData[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('sumblok_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sumblok_highscore', score.toString());
    }
  }, [score, highScore]);

  const [level, setLevel] = useState(1);

  // Difficulty scaling
  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
    }
  }, [score, level]);

  const generateTarget = useCallback(() => {
    const max = Math.min(MAX_TARGET, MIN_TARGET + level * 2);
    return Math.floor(Math.random() * (max - MIN_TARGET + 1)) + MIN_TARGET;
  }, [level]);

  const generateRow = useCallback((rowIndex: number): BlockData[] => {
    return Array.from({ length: GRID_COLS }).map((_, colIndex) => ({
      id: Math.random().toString(36).substr(2, 9),
      value: Math.floor(Math.random() * 9) + 1,
      row: rowIndex,
      col: colIndex,
    }));
  }, []);

  const initGame = (selectedMode: GameMode) => {
    const initialGrid: BlockData[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      initialGrid.push(...generateRow(GRID_ROWS - 1 - r));
    }
    setGrid(initialGrid);
    setTarget(generateTarget());
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setMode(selectedMode);
    setSelectedIds([]);
    setTimeLeft(15);
    setIsPaused(false);
  };

  const addRow = useCallback(() => {
    setGrid((prev) => {
      // Check if any block is at the top row (row 0)
      const isFull = prev.some((b) => b.row === 0);
      if (isFull) {
        setGameOver(true);
        return prev;
      }

      // Shift existing blocks up
      const shifted = prev.map((b) => ({ ...b, row: b.row - 1 }));
      // Add new row at the bottom
      const newRow = generateRow(GRID_ROWS - 1);
      return [...shifted, ...newRow];
    });
  }, [generateRow]);

  // Timer for Time Mode
  useEffect(() => {
    if (mode === 'time' && !gameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            addRow();
            return 15; // Reset timer after adding row
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, gameOver, isPaused, addRow]);

  const handleBlockClick = (id: string) => {
    if (gameOver || isPaused) return;

    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      const newSelection = isSelected ? prev.filter((i) => i !== id) : [...prev, id];

      // Calculate sum
      const currentSum = newSelection.reduce((sum, sid) => {
        const block = grid.find((b) => b.id === sid);
        return sum + (block?.value || 0);
      }, 0);

      if (currentSum === target) {
        // Success!
        setScore((s) => s + newSelection.length * 10);
        setGrid((g) => g.filter((b) => !newSelection.includes(b.id)));
        setTarget(generateTarget());
        if (mode === 'classic') {
          addRow();
        } else if (mode === 'time') {
          setTimeLeft(15); // Reset timer on success
        }
        return [];
      } else if (currentSum > target) {
        // Exceeded sum, clear selection
        return [];
      }

      return newSelection;
    });
  };

  const getBlockColor = (value: number, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-500 text-white shadow-lg scale-95';
    
    const colors: Record<number, string> = {
      1: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
      2: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
      3: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100',
      4: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100',
      5: 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100',
      6: 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100',
      7: 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100',
      8: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
      9: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100',
    };
    return colors[value] || 'bg-gray-50 text-gray-600';
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-12 max-w-md w-full relative z-10"
        >
          <div className="space-y-3">
            <h1 className="text-7xl font-bold tracking-tight text-[#1D1D1F]">
              乐消除
            </h1>
            <p className="text-[#86868B] font-medium tracking-wide text-sm">简单、纯粹的数字挑战</p>
          </div>

          <div className="grid gap-6">
            <button
              onClick={() => initGame('classic')}
              className="group bg-white/80 backdrop-blur-md hover:bg-white p-8 rounded-[2rem] transition-all shadow-sm hover:shadow-xl border border-white/50 flex items-center justify-between"
            >
              <div className="text-left">
                <h3 className="text-2xl font-semibold">经典模式</h3>
                <p className="text-[#86868B]">稳扎稳打，步步为营</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white fill-current" />
              </div>
            </button>

            <button
              onClick={() => initGame('time')}
              className="group bg-white/80 backdrop-blur-md hover:bg-white p-8 rounded-[2rem] transition-all shadow-sm hover:shadow-xl border border-white/50 flex items-center justify-between"
            >
              <div className="text-left">
                <h3 className="text-2xl font-semibold">计时模式</h3>
                <p className="text-[#86868B]">瞬息万变，挑战手速</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>

          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-2 mx-auto text-[#06c] hover:underline font-medium transition-all"
          >
            <Info className="w-4 h-4" />
            <span>了解如何开始</span>
          </button>
        </motion.div>

        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white p-10 rounded-[3rem] max-w-sm w-full relative shadow-2xl"
              >
                <button
                  onClick={() => setShowTutorial(false)}
                  className="absolute top-6 right-6 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold mb-8">游戏指南</h2>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <p className="text-[#424245] leading-relaxed">点击数字，使它们的总和等于顶部的 <span className="text-[#1D1D1F] font-bold">目标数字</span>。</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <p className="text-[#424245] leading-relaxed">你可以跨区域选择任何方块，无需相邻。</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                    <p className="text-[#424245] leading-relaxed">保持警惕，不要让方块触碰到顶部的 <span className="text-red-500 font-bold">警戒线</span>。</p>
                  </li>
                </ul>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="w-full mt-10 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                >
                  开始挑战
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentSum = selectedIds.reduce((sum, id) => {
    const block = grid.find((b) => b.id === id);
    return sum + (block?.value || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col items-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/50 blur-[120px] rounded-full" />

      {/* Top Area: Stats */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-6 mb-8 shadow-xl relative z-10">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setMode(null)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-[#86868B]" />
          </button>
          
          <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'classic' ? 'bg-blue-500' : 'bg-purple-500'}`} />
            <span className="text-xs font-semibold text-[#1D1D1F]">
              {mode === 'classic' ? '经典模式' : '计时模式'}
            </span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5 text-blue-600 fill-current" /> : <Pause className="w-5 h-5 text-[#86868B]" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1">当前得分</div>
              <div className="text-3xl font-bold text-[#1D1D1F]">{score}</div>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1">最高纪录</div>
              <div className="text-3xl font-bold text-[#1D1D1F]">{highScore}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-inner border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2">目标 / 当前和</div>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={target}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-bold text-[#0071e3]"
              >
                {target}
              </motion.span>
              <span className="text-gray-300 text-2xl font-light">/</span>
              <span className={`text-3xl font-bold ${currentSum > target ? 'text-red-500' : 'text-[#1D1D1F]'}`}>
                {currentSum}
              </span>
            </div>
            <div className="mt-3 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold tracking-widest">LEVEL {level}</div>
          </div>
        </div>
      </div>

      {/* Game Area: Grid */}
      <div className="relative w-full max-w-md aspect-[6/10] bg-white rounded-[3rem] border-[6px] border-white shadow-2xl overflow-hidden relative z-10">
        {/* Deadline Indicator */}
        <div className="absolute top-4 left-4 right-4 h-12 border-b border-dashed border-red-200 flex items-center justify-center pointer-events-none z-10">
          <div className="px-3 py-1 bg-red-50 rounded-full">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">警戒区域</span>
          </div>
        </div>

        {/* Grid Background */}
        <div className="absolute inset-4 grid grid-cols-6 grid-rows-10 gap-3 opacity-[0.03] pointer-events-none">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="bg-black rounded-2xl" />
          ))}
        </div>

        {/* Blocks */}
        <div className="absolute inset-4 grid grid-cols-6 grid-rows-10 gap-3">
          <AnimatePresence>
            {grid.map((block) => (
              <motion.button
                key={block.id}
                layoutId={block.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  gridRowStart: block.row + 1,
                  gridColumnStart: block.col + 1,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => handleBlockClick(block.id)}
                className={`
                  relative rounded-2xl flex items-center justify-center text-2xl font-bold transition-all border
                  ${getBlockColor(block.value, selectedIds.includes(block.id))}
                `}
              >
                {block.value}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Time Mode Progress Bar */}
        {mode === 'time' && (
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-100">
            <motion.div
              initial={false}
              animate={{ width: `${(timeLeft / 15) * 100}%` }}
              className={`h-full transition-colors duration-1000 ${timeLeft < 5 ? 'bg-red-500' : 'bg-blue-500'}`}
            />
          </div>
        )}

        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 flex flex-col items-center justify-center"
            >
              <h2 className="text-4xl font-bold mb-8">已暂停</h2>
              <button
                onClick={() => setIsPaused(false)}
                className="bg-[#0071e3] text-white px-10 py-4 rounded-2xl font-semibold text-xl flex items-center gap-3 hover:bg-[#0077ed] transition-all shadow-lg shadow-blue-500/20"
              >
                <Play className="w-6 h-6 fill-current" />
                继续游戏
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-10 text-center"
            >
              <div className="bg-red-50 p-6 rounded-full mb-6 relative shadow-inner">
                <Frown className="w-16 h-16 text-red-500" />
                {/* Tears */}
                <motion.div
                  animate={{ y: [0, 15], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn" }}
                  className="absolute top-10 left-7 w-2 h-2 bg-blue-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, 15], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn", delay: 0.7 }}
                  className="absolute top-10 right-7 w-2 h-2 bg-blue-400 rounded-full"
                />
              </div>
              <h2 className="text-5xl font-bold mb-3">游戏结束</h2>
              <p className="text-[#86868B] mb-10">方块堆积到了警戒线！</p>

              <div className="grid grid-cols-2 gap-6 w-full mb-10">
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1">最终得分</div>
                  <div className="text-3xl font-bold">{score}</div>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1">最高纪录</div>
                  <div className="text-3xl font-bold text-amber-500">{highScore}</div>
                </div>
              </div>

              <button
                onClick={() => initGame(mode)}
                className="w-full bg-[#0071e3] text-white py-5 rounded-2xl font-semibold text-xl hover:bg-[#0077ed] transition-all shadow-lg shadow-blue-500/20 mb-6"
              >
                再试一次
              </button>
              <button
                onClick={() => setMode(null)}
                className="text-[#06c] hover:underline font-medium transition-all"
              >
                返回主菜单
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
