import React, { useState } from 'react';
import { Check, X, ArrowRight, RefreshCw } from 'lucide-react';
import Reveal from './Reveal';
import { DoodleEquations } from '../decor/StudyDoodles';

const QUESTIONS = [
  {
    track: 'IGCSE Physics', topic: 'Forces',
    text: 'A book rests on a table. The table pushes up on the book with a force equal to the book’s weight. What is this upward force called?',
    options: [
      { key: 'A', text: 'Friction' },
      { key: 'B', text: 'Normal reaction force' },
      { key: 'C', text: 'Air resistance' },
      { key: 'D', text: 'Gravity' },
    ],
    correct: 'B',
    explanation: 'The table pushes back on the book perpendicular to its surface, the normal reaction force. It balances the weight, which is why the book doesn’t accelerate.',
  },
  {
    track: 'IGCSE Chemistry', topic: 'Atomic structure',
    text: 'An atom has 11 protons, 12 neutrons, and 11 electrons. What element is it?',
    options: [
      { key: 'A', text: 'Magnesium' },
      { key: 'B', text: 'Carbon' },
      { key: 'C', text: 'Sodium' },
      { key: 'D', text: 'Neon' },
    ],
    correct: 'C',
    explanation: 'The proton number defines the element. 11 protons means atomic number 11, sodium. The neutrons only change the isotope, not the element.',
  },
  {
    track: 'SAT Math', topic: 'Linear equations',
    text: 'If 3x + 5 = 20, what is the value of x?',
    options: [
      { key: 'A', text: '3' },
      { key: 'B', text: '5' },
      { key: 'C', text: '7' },
      { key: 'D', text: '15' },
    ],
    correct: 'B',
    explanation: 'Subtract 5 from both sides (3x = 15), then divide by 3: x = 5. Exams love quick rearrangement checks like this.',
  },
  {
    track: 'NEET Biology', topic: 'Cell biology',
    text: 'Which organelle is known as the powerhouse of the cell?',
    options: [
      { key: 'A', text: 'Nucleus' },
      { key: 'B', text: 'Ribosome' },
      { key: 'C', text: 'Golgi apparatus' },
      { key: 'D', text: 'Mitochondrion' },
    ],
    correct: 'D',
    explanation: 'Mitochondria carry out aerobic respiration and release energy as ATP, the classic one-mark recall question.',
  },
  {
    track: 'IB Economics', topic: 'Demand',
    text: 'If the price of a normal good falls, what usually happens to the quantity demanded?',
    options: [
      { key: 'A', text: 'It increases' },
      { key: 'B', text: 'It decreases' },
      { key: 'C', text: 'It stays exactly the same' },
      { key: 'D', text: 'It falls to zero' },
    ],
    correct: 'A',
    explanation: 'The law of demand: price down, quantity demanded up, a movement along the demand curve, not a shift of it.',
  },
  {
    track: 'JEE Mathematics', topic: 'Algebra',
    text: 'What is the value of (x + 2)(x − 2) when x = 5?',
    options: [
      { key: 'A', text: '21' },
      { key: 'B', text: '25' },
      { key: 'C', text: '10' },
      { key: 'D', text: '29' },
    ],
    correct: 'A',
    explanation: 'Difference of squares: (x+2)(x−2) = x² − 4 = 25 − 4 = 21. Spotting the identity is faster than expanding.',
  },
];

export default function TryQuestion() {
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const QUESTION = QUESTIONS[qIndex];
  const answered = picked !== null;
  const isCorrect = picked === QUESTION.correct;
  const nextQuestion = () => { setPicked(null); setQIndex((i) => (i + 1) % QUESTIONS.length); };

  return (
    <section id="try" className="section-bg">
      <div className="max-w-[1280px] mx-auto px-6 py-20 lg:py-28">
        <Reveal>
          <div className="relative text-center max-w-[760px] mx-auto">
            <div className="hidden lg:block absolute -left-52 top-4"><DoodleEquations /></div>
            <h2 className="h-display text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.05]">Try a real question. Right here.</h2>
            <p className="mt-5 text-[16px] text-slate-500 leading-relaxed">
              This is what practice on InfinitySheets feels like, instant marking, an explanation, and a read on your weak spots.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="relative mt-14 max-w-[720px] mx-auto w-full">
            <div className="rounded-3xl liquid-glass shadow-xl shadow-slate-900/5 overflow-hidden">
              <div className="px-7 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <span className="text-[12px] font-semibold tracking-wider uppercase text-blue-600">{QUESTION.track}</span>
                <span className="text-[12px] text-slate-400">Topic: {QUESTION.topic} &middot; {qIndex + 1}/{QUESTIONS.length}</span>
              </div>
              <div className="p-7">
                <p className="text-[16.5px] text-slate-900 leading-relaxed font-medium">{QUESTION.text}</p>
                <div className="mt-6 flex flex-col gap-2.5">
                  {QUESTION.options.map((o) => {
                    const chosen = picked === o.key;
                    const showCorrect = answered && o.key === QUESTION.correct;
                    const showWrong = answered && chosen && !isCorrect;
                    return (
                      <button
                        key={o.key}
                        disabled={answered}
                        onClick={() => setPicked(o.key)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[15px] transition-colors ${
                          showCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                          : showWrong ? 'border-red-300 bg-red-50 text-red-900'
                          : chosen ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                        } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[13px] font-semibold ${
                          showCorrect ? 'bg-emerald-500 text-white' : showWrong ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {showCorrect ? <Check className="w-4 h-4" /> : showWrong ? <X className="w-4 h-4" /> : o.key}
                        </span>
                        {o.text}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <div className="mt-6 rounded-xl border border-slate-200/70 bg-slate-50/70 px-5 py-4">
                    <div className={`text-[14px] font-semibold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isCorrect ? 'Correct.' : `Not quite, the answer is ${QUESTION.correct}.`}
                    </div>
                    <p className="text-[13.5px] text-slate-600 mt-1.5 leading-relaxed">{QUESTION.explanation}</p>
                    <div className="mt-4 rounded-lg bg-white border border-slate-200 px-4 py-3 border-l-[3px] border-l-violet-500">
                      <div className="text-[10px] tracking-wider font-semibold uppercase text-slate-500">On InfinitySheets</div>
                      <p className="text-[13.5px] text-slate-700 mt-1">
                        {isCorrect
                          ? `${QUESTION.topic} would be marked strong, and your next worksheet would push one level deeper.`
                          : `${QUESTION.topic} would be flagged as a weak topic, and your next worksheet would target it automatically.`}
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button onClick={nextQuestion} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <RefreshCw className="w-4 h-4" /> Try another question
                      </button>
                      <a href="#signup" className="btn-violet inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium">
                        Start Free <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
