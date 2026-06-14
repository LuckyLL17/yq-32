import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Send, ChevronRight, BookOpen, Award } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { experiments } from '@/data/experiments'
import { generateQuiz, checkAnswer, formatNumber } from '@/utils/quizGenerator'
import type { Question } from '@/utils/quizGenerator'
import { cn } from '@/lib/utils'

export default function Quiz() {
  const { experimentId } = useParams<{ experimentId: string }>()
  const navigate = useNavigate()

  const config = useMemo(
    () => experiments.find((e) => e.experiment.id === experimentId),
    [experimentId]
  )

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)
  const [quizKey, setQuizKey] = useState(0)

  useEffect(() => {
    if (config) {
      const newQuestions = generateQuiz(config.experiment.id, config)
      setQuestions(newQuestions)
      setCurrentIndex(0)
      setUserAnswers(new Array(newQuestions.length).fill(null))
      setSubmitted(false)
      setShowAllResults(false)
    }
  }, [config, quizKey])

  const currentQuestion = questions[currentIndex]

  const handleAnswerChange = (value: number | null) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentIndex] = value
    setUserAnswers(newAnswers)
  }

  const handleSubmitAll = () => {
    setSubmitted(true)
    setShowAllResults(true)
  }

  const handleRegenerate = () => {
    setQuizKey((k) => k + 1)
  }

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (!submitted) {
      handleSubmitAll()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const answeredCount = userAnswers.filter((a) => a !== null).length
  const correctCount = submitted
    ? userAnswers.filter((a, i) => a !== null && checkAnswer(a, questions[i].answer, questions[i].tolerance)).length
    : 0

  const score = submitted ? Math.round((correctCount / questions.length) * 100) : 0

  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreGlow = score >= 80 ? 'shadow-[0_0_30px_rgba(34,197,94,0.4)]' : score >= 60 ? 'shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'shadow-[0_0_30px_rgba(239,68,68,0.4)]'

  if (!config) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-400">未找到该实验</p>
        </div>
      </Layout>
    )
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="relative min-h-screen canvas-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-space-900 via-space-900/95 to-space-900 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/library')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass-panel text-slate-300 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all duration-300 border border-slate-600/30"
            >
              <ArrowLeft className="w-4 h-4" />
              返回实验库
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/lab/${config.experiment.id}`)}
                className="px-4 py-2 rounded-lg text-sm glass-panel text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-all duration-300"
              >
                去做实验
              </button>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-neon-purple/10 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/20 transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4" />
                再来一组
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <BookOpen className="w-8 h-8 text-neon-purple" />
              <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-neon-purple glow-text">
                {config.experiment.title} · 做题练习
              </h1>
            </div>
            <p className="text-slate-400">
              共 {questions.length} 道题目 · 已作答 {answeredCount}/{questions.length}
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {questions.map((_, idx) => {
              const isAnswered = userAnswers[idx] !== null
              const isCurrent = idx === currentIndex
              const isCorrect = submitted && userAnswers[idx] !== null && checkAnswer(userAnswers[idx]!, questions[idx].answer, questions[idx].tolerance)
              const isWrong = submitted && userAnswers[idx] !== null && !checkAnswer(userAnswers[idx]!, questions[idx].answer, questions[idx].tolerance)

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-10 h-10 rounded-lg font-medium transition-all duration-300 relative',
                    isCurrent && !submitted && 'bg-neon-purple/20 text-neon-purple border-2 border-neon-purple/60 ring-2 ring-neon-purple/30',
                    !isCurrent && !submitted && isAnswered && 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40',
                    !isCurrent && !submitted && !isAnswered && 'bg-slate-800/50 text-slate-500 border border-slate-600/30 hover:border-slate-500/50',
                    submitted && isCorrect && 'bg-green-500/20 text-green-400 border-2 border-green-500/60',
                    submitted && isWrong && 'bg-red-500/20 text-red-400 border-2 border-red-500/60',
                    submitted && userAnswers[idx] === null && 'bg-slate-800/50 text-slate-500 border border-slate-600/30'
                  )}
                >
                  {idx + 1}
                  {submitted && isCorrect && (
                    <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-space-900 rounded-full" />
                  )}
                  {submitted && isWrong && (
                    <XCircle className="absolute -top-1 -right-1 w-4 h-4 text-red-400 bg-space-900 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {submitted && showAllResults && (
            <div className="glass-panel rounded-2xl p-6 mb-8 border border-neon-purple/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={cn('w-24 h-24 rounded-full flex items-center justify-center bg-space-800/80 border-2', scoreColor, scoreGlow)}>
                    <span className="font-orbitron text-3xl font-bold">{score}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-5 h-5 text-neon-cyan" />
                      <h3 className="font-orbitron text-xl font-bold text-white">答题完成！</h3>
                    </div>
                    <p className={cn('text-lg font-medium mb-1', scoreColor)}>
                      {score >= 80 ? '太棒了，你对知识掌握得很好！' : score >= 60 ? '还不错，继续加油！' : '需要多加练习哦～'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      正确 {correctCount} / 共 {questions.length} 题
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neon-purple text-white font-medium hover:bg-neon-purple/80 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    再来一组
                  </button>
                  <button
                    onClick={() => navigate(`/lab/${config.experiment.id}`)}
                    className="px-5 py-2.5 rounded-xl glass-panel text-neon-cyan font-medium border border-neon-cyan/40 hover:bg-neon-cyan/10 transition-all duration-300"
                  >
                    去实验巩固
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-600/30">
            <div className="bg-gradient-to-r from-neon-purple/10 via-space-800/50 to-neon-cyan/10 px-6 py-4 border-b border-slate-600/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium border',
                    currentQuestion.type === 'fillblank'
                      ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40'
                      : 'bg-neon-purple/10 text-neon-purple border-neon-purple/40'
                  )}>
                    {currentQuestion.type === 'fillblank' ? '填空题' : '选择题'}
                  </span>
                  <span className="text-slate-400 text-sm">第 {currentIndex + 1} / {questions.length} 题</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="mb-6">
                <p className="text-white text-lg leading-relaxed whitespace-pre-line">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="mb-8 p-5 rounded-xl bg-space-800/50 border border-slate-600/30">
                <p className="text-xs text-slate-500 mb-2 font-medium">核心公式</p>
                <p className="font-orbitron text-xl text-neon-cyan" style={{ fontFamily: 'KaTeX_Math, serif' }}>
                  {currentQuestion.formula}
                </p>
              </div>

              {currentQuestion.type === 'choice' && currentQuestion.options ? (
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentIndex] === opt
                    const isCorrectOption = submitted && checkAnswer(opt, currentQuestion.answer, currentQuestion.tolerance)
                    const isWrongSelected = submitted && isSelected && !checkAnswer(opt, currentQuestion.answer, currentQuestion.tolerance)

                    return (
                      <button
                        key={idx}
                        disabled={submitted}
                        onClick={() => handleAnswerChange(opt)}
                        className={cn(
                          'w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4',
                          !submitted && isSelected && 'border-neon-purple/60 bg-neon-purple/10 text-white',
                          !submitted && !isSelected && 'border-slate-600/30 bg-slate-800/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-800/50',
                          submitted && isCorrectOption && 'border-green-500/60 bg-green-500/10 text-green-300',
                          submitted && isWrongSelected && 'border-red-500/60 bg-red-500/10 text-red-300',
                          submitted && !isCorrectOption && !isSelected && 'border-slate-600/20 bg-slate-800/20 text-slate-500'
                        )}
                      >
                        <span className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center font-medium text-sm shrink-0',
                          !submitted && isSelected && 'bg-neon-purple/30 text-neon-purple',
                          !submitted && !isSelected && 'bg-slate-700/50 text-slate-400',
                          submitted && isCorrectOption && 'bg-green-500/30 text-green-300',
                          submitted && isWrongSelected && 'bg-red-500/30 text-red-300',
                          submitted && !isCorrectOption && !isSelected && 'bg-slate-700/30 text-slate-500'
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-medium">
                          {formatNumber(opt, 6)}
                          {currentQuestion.unit && <span className="text-slate-400 ml-1 text-sm">{currentQuestion.unit}</span>}
                        </span>
                        {submitted && isCorrectOption && (
                          <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                        )}
                        {submitted && isWrongSelected && (
                          <XCircle className="w-5 h-5 text-red-400 ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mb-8">
                  <label className="text-sm text-slate-400 mb-2 block">
                    请输入答案{currentQuestion.unit && `（单位：${currentQuestion.unit}）`}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      disabled={submitted}
                      value={userAnswers[currentIndex] ?? ''}
                      onChange={(e) => handleAnswerChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      className={cn(
                        'w-full px-5 py-4 rounded-xl border-2 bg-space-800/50 text-white text-lg font-orbitron outline-none transition-all duration-300',
                        !submitted && 'border-slate-600/30 focus:border-neon-cyan/60 focus:ring-2 focus:ring-neon-cyan/20',
                        submitted && userAnswers[currentIndex] !== null && checkAnswer(userAnswers[currentIndex]!, currentQuestion.answer, currentQuestion.tolerance) && 'border-green-500/60',
                        submitted && userAnswers[currentIndex] !== null && !checkAnswer(userAnswers[currentIndex]!, currentQuestion.answer, currentQuestion.tolerance) && 'border-red-500/60'
                      )}
                      placeholder="输入数值..."
                    />
                    {submitted && userAnswers[currentIndex] !== null && checkAnswer(userAnswers[currentIndex]!, currentQuestion.answer, currentQuestion.tolerance) && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-400" />
                    )}
                    {submitted && userAnswers[currentIndex] !== null && !checkAnswer(userAnswers[currentIndex]!, currentQuestion.answer, currentQuestion.tolerance) && (
                      <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-red-400" />
                    )}
                  </div>
                  {submitted && (
                    <div className="mt-4 p-4 rounded-xl bg-space-800/70 border border-slate-600/30">
                      <p className="text-slate-400 text-sm mb-1">正确答案</p>
                      <p className="font-orbitron text-xl text-green-400">
                        {formatNumber(currentQuestion.answer, 6)}
                        {currentQuestion.unit && <span className="text-slate-400 text-base ml-1">{currentQuestion.unit}</span>}
                      </p>
                      {userAnswers[currentIndex] !== null && !checkAnswer(userAnswers[currentIndex]!, currentQuestion.answer, currentQuestion.tolerance) && (
                        <p className="text-sm text-red-400/80 mt-2">
                          你的答案：{formatNumber(userAnswers[currentIndex]!, 6)}，误差允许范围：±{formatNumber(currentQuestion.tolerance, 6)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {submitted && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-neon-cyan/5 via-space-800/70 to-neon-purple/5 border border-neon-cyan/20">
                  <h4 className="font-medium text-neon-cyan mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    详细解析
                  </h4>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 md:px-8 py-5 border-t border-slate-600/30 flex items-center justify-between">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className={cn(
                  'px-5 py-2.5 rounded-xl font-medium transition-all duration-300',
                  currentIndex === 0
                    ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                    : 'glass-panel text-slate-300 border border-slate-600/30 hover:border-slate-500/50 hover:text-white'
                )}
              >
                上一题
              </button>

              <div className="text-sm text-slate-500">
                {submitted ? '已提交' : answeredCount === questions.length ? '全部作答完毕' : `还有 ${questions.length - answeredCount} 题未答`}
              </div>

              {!submitted ? (
                currentIndex < questions.length - 1 ? (
                  <button
                    onClick={goToNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neon-purple text-white font-medium hover:bg-neon-purple/80 transition-all duration-300"
                  >
                    下一题
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAll}
                    disabled={answeredCount < questions.length}
                    className={cn(
                      'flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-medium transition-all duration-300',
                      answeredCount >= questions.length
                        ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]'
                        : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                    )}
                  >
                    <CheckCircle className="w-4 h-4" />
                    提交答卷
                  </button>
                )
              ) : (
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neon-purple text-white font-medium hover:bg-neon-purple/80 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  再来一组
                </button>
              )}
            </div>
          </div>

          {submitted && (
            <div className="mt-10">
              <h3 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-neon-cyan" />
                全部题目回顾
              </h3>
              <div className="space-y-5">
                {questions.map((q, idx) => {
                  const ua = userAnswers[idx]
                  const correct = ua !== null && checkAnswer(ua, q.answer, q.tolerance)

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'glass-panel rounded-xl p-5 border transition-all duration-300',
                        correct ? 'border-green-500/40' : ua === null ? 'border-slate-600/30' : 'border-red-500/40'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0',
                          correct && 'bg-green-500/20 text-green-400',
                          ua === null && 'bg-slate-800/50 text-slate-500',
                          !correct && ua !== null && 'bg-red-500/20 text-red-400'
                        )}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={cn(
                              'px-2.5 py-0.5 rounded text-xs font-medium border',
                              q.type === 'fillblank'
                                ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                                : 'bg-neon-purple/10 text-neon-purple border-neon-purple/30'
                            )}>
                              {q.type === 'fillblank' ? '填空题' : '选择题'}
                            </span>
                            {correct ? (
                              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" /> 回答正确
                              </span>
                            ) : ua === null ? (
                              <span className="text-xs text-slate-500">未作答</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                                <XCircle className="w-3.5 h-3.5" /> 回答错误
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm mb-3 whitespace-pre-line">{q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-lg bg-space-800/50">
                              <span className="text-slate-500 text-xs">你的答案</span>
                              <p className="font-orbitron text-base mt-1 text-white">
                                {ua !== null ? `${formatNumber(ua, 6)}${q.unit ? ` ${q.unit}` : ''}` : '—'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                              <span className="text-slate-500 text-xs">正确答案</span>
                              <p className="font-orbitron text-base mt-1 text-green-400">
                                {formatNumber(q.answer, 6)}{q.unit ? ` ${q.unit}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
