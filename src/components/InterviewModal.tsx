import type { InterviewQuestion } from '../game/data/types';

interface Props {
  question: InterviewQuestion;
  onPick: (index: number) => void;
}

export function InterviewModal({ question, onPick }: Props) {
  return (
    <div className="overlay">
      <div className="jr-panel interview">
        <p className="eyebrow">TECHNICAL INTERVIEW</p>
        <h2>PLEASE ANSWER</h2>
        <p className="prompt">{question.prompt}</p>
        <div className="btn-col">
          {question.options.map((option, index) => (
            <button
              key={option}
              type="button"
              className="jr-btn ghost"
              onClick={() => onPick(index)}
            >
              {['A', 'B', 'C'][index]}. {option}
            </button>
          ))}
        </div>
        <p className="muted">A few seconds. Then the committee disappears.</p>
      </div>
    </div>
  );
}
