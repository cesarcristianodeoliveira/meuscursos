import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, Box, Button, Radio, RadioGroup, 
  FormControlLabel, FormControl, Alert, Stack 
} from '@mui/material';
import { Check } from '@mui/icons-material';

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const QuizSection = ({ courseId, moduleKey, title, questions, type = "exercise", onComplete, isCompleted, scrollToTop }) => {
  const storageKey = `quiz-${courseId}-${moduleKey}`;
  const [shuffleTicket, setShuffleTicket] = useState(0);

  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [showResult, setShowResult] = useState(() => {
    if (isCompleted) return true;
    const saved = localStorage.getItem(storageKey);
    const savedAnswers = saved ? JSON.parse(saved) : {};
    return questions.length > 0 && Object.keys(savedAnswers).length === questions.length;
  });

  const [score, setScore] = useState(0);

  const shuffledQuestions = useMemo(() => {
    return shuffleArray(questions.map(q => ({
      ...q,
      options: shuffleArray(q.options || [])
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, shuffleTicket]); 

  useEffect(() => {
    let hits = 0;
    shuffledQuestions.forEach((q) => {
      if (answers[q.question] === q.correctAnswer) hits++;
    });
    setScore(hits);
  }, [answers, shuffledQuestions]);

  useEffect(() => {
    const total = shuffledQuestions.length;
    const answeredCount = Object.keys(answers).length;

    if (total > 0 && answeredCount === total && !showResult) {
      const timer = setTimeout(() => {
        setShowResult(true);
        localStorage.setItem(storageKey, JSON.stringify(answers));
        
        if (onComplete) {
          onComplete();
        }
      }, 300); // Mantido seus 300ms
      return () => clearTimeout(timer);
    }
  }, [answers, shuffledQuestions, showResult, onComplete, storageKey]);

  const handleRetry = () => {
    setAnswers({});
    setShowResult(false);
    setScore(0);
    localStorage.removeItem(storageKey);
    setShuffleTicket(prev => prev + 1);
    if (scrollToTop) scrollToTop();
  };

  if (!questions || questions.length === 0) return null;

  return (
    <Box sx={{ 
      mt: 2, p: 2, 
      borderRadius: 2, bgcolor: 'action.hover', border: '1px dashed', 
      borderColor: showResult ? (score >= shuffledQuestions.length / 2 ? 'success.main' : 'error.main') : 'primary.main' 
    }}>
      <Typography sx={{ display: 'flex', alignItems: 'center' }} lineHeight={1}>
        {title}
      </Typography>
      
      {shuffledQuestions.map((q, qIdx) => (
        <Box key={qIdx} sx={{ mt: 2 }}>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: .5,
              mb: 1
            }}
          >
            <Typography variant="subtitle2" color='text.secondary' lineHeight={1}>{qIdx + 1}.</Typography>
            <Typography variant="subtitle2" lineHeight={1}>{q.question}</Typography>
          </Box>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup 
              value={answers[q.question] || ''} 
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.question]: e.target.value }))}
            >
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[q.question] === opt;
                const isCorrect = opt === q.correctAnswer;
                let color = 'inherit';

                if (showResult) {
                  if (isCorrect) { color = 'success.main'; }
                  else if (isSelected && !isCorrect) { color = 'error.main'; }
                }

                return (
                  <FormControlLabel 
                    key={oIdx} value={opt} disabled={showResult}
                    control={<Radio size="small" sx={{ color: showResult && isCorrect ? 'success.main' : '' }} />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', color: color }}>
                        <Typography variant="body2" sx={{ mt: .4 }}>{opt}</Typography>
                        {showResult && isCorrect && <Check fontSize="small" sx={{ ml: 1 }} />}
                      </Box>
                    } 
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        </Box>
      ))}

      {showResult && (
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert icon={false} severity={score >= (shuffledQuestions.length / 2) || isCompleted ? "success" : "error"}>
            {isCompleted || score >= (shuffledQuestions.length / 2) 
              ? `Você acertou ${score} de ${shuffledQuestions.length}.` 
              : `Você acertou ${score} de ${shuffledQuestions.length}. O progresso foi liberado, mas você pode revisar as respostas acima.`}
          </Alert>
          <Button variant="outlined" color="primary" onClick={handleRetry} sx={{ alignSelf: 'flex-start' }}>
            Refazer
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default QuizSection;