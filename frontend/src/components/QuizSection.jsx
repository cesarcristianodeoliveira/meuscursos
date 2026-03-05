const QuizSection = ({ courseId, moduleKey, title, questions, type = "exercise", onComplete, isCompleted, scrollToTop }) => {
  const storageKey = `quiz-${courseId}-${moduleKey}`;
  
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
  }, [questions]);

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
        
        let hits = 0;
        shuffledQuestions.forEach((q) => {
          if (answers[q.question] === q.correctAnswer) hits++;
        });

        if ((hits / total) >= 0.5 && onComplete) {
          onComplete();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [answers, shuffledQuestions, showResult, onComplete, storageKey]);

  const handleRetry = () => {
    setAnswers({});
    setShowResult(false);
    setScore(0);
    localStorage.removeItem(storageKey);
    if (scrollToTop) scrollToTop();
  };

  if (!questions || questions.length === 0) return null;

  return (
    <Box sx={{ 
      mt: 4, p: 3, borderRadius: 3, bgcolor: 'action.hover', border: '1px dashed', 
      borderColor: showResult ? (score >= shuffledQuestions.length / 2 ? 'success.main' : 'error.main') : 'primary.main' 
    }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        {type === "exam" ? <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} /> : <Assignment sx={{ mr: 1, color: 'primary.main' }} />}
        {title}
      </Typography>
      
      {shuffledQuestions.map((q, qIdx) => (
        <Box key={qIdx} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {qIdx + 1}. {q.question}
          </Typography>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup 
              value={answers[q.question] || ''} 
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.question]: e.target.value }))}
            >
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[q.question] === opt;
                const isCorrect = opt === q.correctAnswer;
                
                // Lógica de cores após o resultado
                let color = 'inherit';
                let fontWeight = 400;
                if (showResult) {
                  if (isCorrect) {
                    color = 'success.main'; // Sempre destaca a correta em verde
                    fontWeight = 700;
                  } else if (isSelected && !isCorrect) {
                    color = 'error.main'; // Se o usuário marcou esta e está errada, fica vermelho
                  }
                }

                return (
                  <FormControlLabel 
                    key={oIdx} 
                    value={opt} 
                    disabled={showResult}
                    control={<Radio size="small" sx={{ color: showResult && isCorrect ? 'success.main' : '' }} />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', color: color, fontWeight: fontWeight }}>
                        <Typography variant="body2">{opt}</Typography>
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
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity={score >= (shuffledQuestions.length / 2) || isCompleted ? "success" : "error"}>
            {isCompleted || score >= (shuffledQuestions.length / 2) 
              ? `Excelente! Você acertou ${score} de ${shuffledQuestions.length}.` 
              : `Você acertou ${score} de ${shuffledQuestions.length}. Confira as respostas corretas em verde e tente novamente.`}
          </Alert>
          {(score < (shuffledQuestions.length / 2) && !isCompleted) && (
            <Button variant="outlined" color="error" onClick={handleRetry} sx={{ alignSelf: 'flex-start' }}>
              Tentar Novamente
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};