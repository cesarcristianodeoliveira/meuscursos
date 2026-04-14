import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import { 
  Box, Typography, Card, CardContent, Button, 
  Radio, RadioGroup, FormControlLabel, FormControl, 
  Stack, CircularProgress 
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';

export default function FinalExam() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState({});
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    const fetchExam = async () => {
      const query = `*[_type == "course" && slug.current == $slug][0]{
        _id, title, finalExam
      }`;
      const data = await client.fetch(query, { slug });
      setCourse(data);
      setLoading(false);
    };
    fetchExam();
  }, [slug]);

  const handleOptionChange = (questionIdx, value) => {
    setAnswers({ ...answers, [questionIdx]: parseInt(value) });
  };

  const handleSubmit = async () => {
    let score = 0;
    course.finalExam.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });

    const percent = (score / course.finalExam.length) * 100;
    setResult({ score, total: course.finalExam.length, percent });

    if (percent >= 70) {
      // Aqui você pode chamar uma rota de backend para dar XP extra por conclusão
      await refreshUser(); 
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (!course?.finalExam) return <Typography>Exame não disponível para este curso.</Typography>;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{course.title}</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>Exame de Certificação</Typography>

      {!result ? (
        <Stack spacing={4}>
          {course.finalExam.map((q, idx) => (
            <Card key={idx} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  {idx + 1}. {q.question}
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup value={answers[idx] ?? ""} onChange={(e) => handleOptionChange(idx, e.target.value)}>
                    {q.options.map((opt, optIdx) => (
                      <FormControlLabel key={optIdx} value={optIdx} control={<Radio />} label={opt} />
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          ))}
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < course.finalExam.length}
          >
            Finalizar Exame
          </Button>
        </Stack>
      ) : (
        <Card sx={{ textAlign: 'center', p: 4, bgcolor: result.percent >= 70 ? 'success.light' : 'error.light' }}>
          <Typography variant="h5" fontWeight="bold">
            {result.percent >= 70 ? "🎉 Parabéns! Você passou!" : "📚 Quase lá! Continue estudando."}
          </Typography>
          <Typography variant="h6" sx={{ my: 2 }}>
            Sua nota: {result.percent}% ({result.score} de {result.total})
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Voltar ao Painel
          </Button>
        </Card>
      )}
    </Box>
  );
}