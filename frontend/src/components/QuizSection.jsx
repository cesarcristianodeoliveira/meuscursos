import React, { useState, useMemo } from 'react';
import { Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio, Button, Alert } from '@mui/material';
import { Assignment, EmojiEvents, CheckCircleOutline } from '@mui/icons-material';

const QuizSection = ({ title, questions, type = "exercise", onComplete, isCompleted }) => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(isCompleted);
  const [score, setScore] = useState(0);

  // Embaralha as opções apenas uma vez quando o componente é carregado
  const shuffledQuestions = useMemo(() => {
    return questions.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
  }, [questions]);

  const handleSubmit = () => {
    let correct = 0;
    shuffledQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    const finalScore = (correct / questions.length) * 100;
    setScore(correct);
    setShowResult(true);

    if (finalScore >= 50) {
      if (onComplete) onComplete();
    }
  };

  if (!questions || questions.length === 0) return null;

  return (
    <Box sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: 'action.hover', border: '1px dashed', borderColor: showResult ? 'success.main' : 'primary.main' }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        {type === "exam" ? <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} /> : <Assignment sx={{ mr: 1, color: 'primary.main' }} />}
        {title}
        {showResult && score >= (questions.length / 2) && <CheckCircleOutline color="success" sx={{ ml: 'auto' }} />}
      </Typography>

      {shuffledQuestions.map((q, qIdx) => (
        <Box key={qIdx} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{qIdx + 1}. {q.question}</Typography>
          <FormControl component="fieldset">
            <RadioGroup value={answers[qIdx] || ''} onChange={(e) => setAnswers({ ...answers, [qIdx]: e.target.value })}>
              {q.options.map((opt, oIdx) => (
                <FormControlLabel key={oIdx} value={opt} control={<Radio size="small" />} label={<Typography variant="body2">{opt}</Typography>} disabled={showResult} />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      ))}

      {!showResult ? (
        <Button variant="contained" onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length}>
          Finalizar {type === "exam" ? "Prova" : "Exercícios"}
        </Button>
      ) : (
        <Alert severity={score >= (questions.length / 2) ? "success" : "error"} sx={{ mt: 2 }}>
          Você acertou {score} de {questions.length}. {score >= (questions.length / 2) ? "Avanço liberado!" : "Tente novamente para liberar o próximo nível."}
          {score < (questions.length / 2) && (
            <Button size="small" sx={{ ml: 2 }} onClick={() => { setShowResult(false); setAnswers({}); }}>Tentar de novo</Button>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default QuizSection;