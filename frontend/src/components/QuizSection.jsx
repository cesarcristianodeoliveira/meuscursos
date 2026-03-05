const QuizSection = ({ courseId, moduleKey, title, questions, type = "exercise", onComplete, isCompleted, scrollToTop }) => {
  const storageKey = `quiz-${courseId}-${moduleKey}`;
  
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  // O showResult deve ser true se já estiver completado OU se todas as questões foram respondidas
  const [showResult, setShowResult] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    const savedAnswers = saved ? JSON.parse(saved) : {};
    return isCompleted || (questions.length > 0 && Object.keys(savedAnswers).length === questions.length);
  });

  const [score, setScore] = useState(0);

  const shuffledQuestions = useMemo(() => {
    return shuffleArray(questions.map(q => ({
      ...q,
      options: shuffleArray(q.options || [])
    })));
  }, [questions]);

  // Efeito para calcular o score e manter a interface atualizada
  useEffect(() => {
    let hits = 0;
    shuffledQuestions.forEach((q) => {
      if (answers[q.question] === q.correctAnswer) hits++;
    });
    setScore(hits);
  }, [answers, shuffledQuestions]);

  // Validação Automática com Delay para salvar o progresso
  useEffect(() => {
    const total = shuffledQuestions.length;
    const answeredCount = Object.keys(answers).length;

    if (total > 0 && answeredCount === total && !showResult) {
      const timer = setTimeout(() => {
        setShowResult(true);
        // SALVA SEMPRE: Para que ao voltar as respostas estejam aqui
        localStorage.setItem(storageKey, JSON.stringify(answers));
        
        let hits = 0;
        shuffledQuestions.forEach((q) => {
          if (answers[q.question] === q.correctAnswer) hits++;
        });

        // Só libera o próximo módulo se atingir a média
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
          <FormControl component="fieldset">
            <RadioGroup 
              value={answers[q.question] || ''} 
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.question]: e.target.value }))}
            >
              {q.options.map((opt, oIdx) => (
                <FormControlLabel 
                  key={oIdx} value={opt} 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">{opt}</Typography>} 
                  disabled={showResult} 
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      ))}

      {showResult && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity={score >= (shuffledQuestions.length / 2) || isCompleted ? "success" : "error"}>
            {isCompleted || score >= (shuffledQuestions.length / 2) 
              ? `Excelente! Você acertou ${score} de ${shuffledQuestions.length}.` 
              : `Você acertou ${score} de ${shuffledQuestions.length}. Tente revisar o conteúdo acima.`}
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