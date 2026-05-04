import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Avatar, Button, Divider, Stack, Chip, LinearProgress,
  CircularProgress, IconButton, Tooltip, Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Ícones
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LogoutIcon from '@mui/icons-material/Logout';
import ShareIcon from '@mui/icons-material/Share';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { useAuth } from '../../../contexts/AuthContext';

// --- ESTILOS CUSTOMIZADOS ---
const ProfileHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  height: '180px',
  borderRadius: theme.spacing(3),
  position: 'relative',
  marginBottom: theme.spacing(8),
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '-60px',
  left: '40px',
  padding: '6px',
  backgroundColor: theme.palette.background.default,
  borderRadius: '50%',
}));

const StatBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    backgroundColor: theme.palette.action.selected,
  }
}));

export default function UserProfile() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user: loggedUser, signOut } = useAuth();

  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Verifica se o perfil sendo visualizado é o do próprio usuário logado
  const isOwnProfile = React.useMemo(() => {
    return !id || id === loggedUser?._id;
  }, [id, loggedUser?._id]);

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (isOwnProfile && loggedUser) {
          setProfileData(loggedUser);
          setLoading(false);
          return;
        }

        if (id) {
          const query = `*[_type == "user" && _id == $userId][0]{
            _id, name, email, plan, role, credits, _createdAt,
            stats,
            "avatar": avatar.asset->url
          }`;
          const result = await client.fetch(query, { userId: id });
          setProfileData(result);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, loggedUser, isOwnProfile]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  if (!profileData) return (
    <Container sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h5">Usuário não encontrado.</Typography>
      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>Voltar para o Início</Button>
    </Container>
  );

  // --- LÓGICA DE GAMIFICAÇÃO ---
  const userXP = profileData?.stats?.totalXp || 0;
  const userLevel = profileData?.stats?.level || 1;
  const coursesCompleted = profileData?.stats?.coursesCompleted || 0;
  
  // Lógica de progresso baseada em blocos de 1000 XP por nível
  const xpCurrentLevelBase = (userLevel - 1) * 1000;
  const progressInLevel = Math.max(0, userXP - xpCurrentLevelBase);
  const progressPercentage = Math.min((progressInLevel / 1000) * 100, 100);

  const joinDate = profileData?._createdAt 
    ? new Date(profileData._createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) 
    : '---';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader>
        <AvatarWrapper>
          <Avatar 
            sx={{ width: 130, height: 130, fontSize: '3.5rem', bgcolor: 'secondary.main', border: '5px solid white' }}
            src={profileData?.avatar}
          >
            {profileData?.name?.charAt(0)}
          </Avatar>
        </AvatarWrapper>

        <Box sx={{ position: 'absolute', right: 20, top: 20 }}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Compartilhar Perfil">
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </ProfileHeader>

      <Grid container spacing={4}>
        {/* COLUNA ESQUERDA: IDENTIDADE E XP */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Box sx={{ pl: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight="900">{profileData?.name}</Typography>
                {profileData?.role === 'admin' && <VerifiedIcon color="primary" />}
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', mb: 2 }}>
                <CalendarMonthIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">Entrou em {joinDate}</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Chip 
                  label={profileData?.plan === 'pro' ? 'PRO MEMBER' : 'Membro Free'} 
                  color={profileData?.plan === 'pro' ? 'secondary' : 'default'}
                  sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                />
                <Chip 
                  icon={<AutoAwesomeIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`Level ${userLevel}`} 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                />
              </Stack>
            </Box>

            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                  Progresso do Nível {userLevel}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="h3" fontWeight="900" color="primary">{userXP}</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">XP Total</Typography>
                </Stack>
                
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold">{progressInLevel} / 1000 XP</Typography>
                    <Typography variant="caption" color="text.secondary">Próximo: {userLevel + 1}</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ height: 12, borderRadius: 6, bgcolor: 'action.hover' }} 
                  />
                </Box>
              </CardContent>
            </Card>

            {isOwnProfile && (
              <Button 
                fullWidth 
                variant="text" 
                color="error" 
                startIcon={<LogoutIcon />}
                onClick={signOut}
                sx={{ borderRadius: 3, py: 1.5 }}
              >
                Encerrar Sessão
              </Button>
            )}
          </Stack>
        </Grid>

        {/* COLUNA DIREITA: ESTATÍSTICAS E CONQUISTAS */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            {isOwnProfile && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: (theme) => `linear-gradient(90deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">Créditos de IA Disponíveis</Typography>
                  <Typography variant="h4" fontWeight="900">{profileData?.credits ?? 0}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 60, height: 60 }}>
                  <MonetizationOnIcon sx={{ fontSize: 35, color: 'warning.dark' }} />
                </Avatar>
              </Paper>
            )}

            <Box>
              <Typography variant="h6" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SchoolIcon color="primary" /> Jornada de Aprendizado
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <StatBox elevation={0}>
                    <Typography variant="h4" fontWeight="900" color="primary">{coursesCompleted}</Typography>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary">Cursos Concluídos</Typography>
                  </StatBox>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatBox elevation={0}>
                    <Typography variant="h4" fontWeight="900" color="primary">{profileData?.stats?.coursesCreated ?? 0}</Typography>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary">Cursos Gerados</Typography>
                  </StatBox>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatBox elevation={0} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                    <MilitaryTechIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">TOP 10%</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>No Ranking Global</Typography>
                  </StatBox>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AutoAwesomeIcon color="secondary" /> Conquistas
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                {[
                  { label: 'Pioneiro', color: '#FFD700', active: true },
                  { label: 'Curioso', color: '#C0C0C0', active: coursesCompleted >= 1 },
                  { label: 'Mestre IA', color: '#CD7F32', active: (profileData?.stats?.coursesCreated ?? 0) >= 5 },
                ].map((badge, index) => (
                  <Grid item key={index}>
                    <Tooltip title={badge.active ? `Conquista: ${badge.label}` : 'Bloqueado'}>
                      <Avatar 
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          bgcolor: badge.active ? badge.color : 'action.disabledBackground',
                          opacity: badge.active ? 1 : 0.3,
                          boxShadow: badge.active ? 3 : 0
                        }}
                      >
                        <MilitaryTechIcon />
                      </Avatar>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}