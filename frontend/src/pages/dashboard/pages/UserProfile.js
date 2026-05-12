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
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

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
  transition: 'all 0.3s ease',
  border: '1px solid transparent',
  '&:hover': {
    transform: 'translateY(-4px)',
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.light,
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
        // Se for o próprio perfil, usamos os dados do Contexto (que já estão atualizados)
        if (isOwnProfile && loggedUser) {
          setProfileData(loggedUser);
          setLoading(false);
          return;
        }

        // Se for perfil de terceiros, buscamos no Sanity
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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} size={60} />
    </Box>
  );

  if (!profileData) return (
    <Container sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight="700">Usuário não encontrado.</Typography>
      <Button variant="contained" sx={{ mt: 2, borderRadius: 2 }} onClick={() => navigate('/dashboard')}>
        Voltar para o Painel
      </Button>
    </Container>
  );

  // --- LÓGICA DE GAMIFICAÇÃO v3.0 ---
  const userXP = profileData?.stats?.totalXp || 0;
  const userLevel = profileData?.stats?.level || 1;
  const coursesCompleted = profileData?.stats?.coursesCompleted || 0;
  const coursesCreated = profileData?.stats?.coursesCreated || 0;
  
  // Lógica: Cada nível exige 1000 XP
  const xpCurrentLevelBase = (userLevel - 1) * 1000;
  const progressInLevel = userXP - xpCurrentLevelBase;
  const progressPercentage = Math.min((progressInLevel / 1000) * 100, 100);

  const joinDate = profileData?._createdAt 
    ? new Date(profileData._createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) 
    : '---';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader>
        <AvatarWrapper>
          <Avatar 
            sx={{ 
              width: 130, height: 130, fontSize: '3.5rem', 
              bgcolor: 'primary.main', border: '5px solid white',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
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
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>
                  {profileData?.name}
                </Typography>
                {(profileData?.role === 'admin' || profileData?.plan === 'pro') && (
                  <Tooltip title={profileData?.role === 'admin' ? "Administrador" : "Assinante Pro"}>
                    <VerifiedIcon color="primary" />
                  </Tooltip>
                )}
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', mb: 2 }}>
                <CalendarMonthIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">Explorador desde {joinDate}</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Chip 
                  label={profileData?.plan?.toUpperCase() || 'FREE'} 
                  color={profileData?.plan === 'pro' ? 'secondary' : 'default'}
                  sx={{ fontWeight: '800', borderRadius: 1.5 }}
                />
                <Chip 
                  icon={<AutoAwesomeIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`Nível ${userLevel}`} 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontWeight: '800', borderRadius: 1.5 }}
                />
              </Stack>
            </Box>

            {/* CARD DE PROGRESSO */}
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  Progresso de Carreira
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="h3" fontWeight="900" color="primary">{userXP}</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">XP</Typography>
                </Stack>
                
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold">{progressInLevel} / 1000 para o Lvl {userLevel + 1}</Typography>
                    <Typography variant="caption" color="text.secondary">{Math.round(progressPercentage)}%</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }} 
                  />
                </Box>
              </CardContent>
            </Card>

            {isOwnProfile && (
              <Button 
                fullWidth 
                variant="outlined" 
                color="error" 
                startIcon={<LogoutIcon />}
                onClick={signOut}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: '700', border: '2px solid' }}
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
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="800">CRÉDITOS DE IA</Typography>
                  <Typography variant="h4" fontWeight="900">
                    {profileData?.role === 'admin' ? 'ILIMITADO' : (profileData?.credits ?? 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 60, height: 60, boxShadow: '0 4px 12px rgba(237, 108, 2, 0.2)' }}>
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
                    <Typography variant="body2" fontWeight="800" color="text.secondary">CURSOS CONCLUÍDOS</Typography>
                  </StatBox>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatBox elevation={0}>
                    <Typography variant="h4" fontWeight="900" color="primary">{coursesCreated}</Typography>
                    <Typography variant="body2" fontWeight="800" color="text.secondary">CURSOS GERADOS</Typography>
                  </StatBox>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatBox elevation={0} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                    <WorkspacePremiumIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="900">ESTUDANTE</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: '700' }}>Nível de Engajamento</Typography>
                  </StatBox>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <MilitaryTechIcon color="secondary" /> Conquistas Desbloqueadas
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                {[
                  { label: 'Pioneiro', color: '#FFD700', active: true, desc: 'Membro da fase inicial' },
                  { label: 'Curioso', color: '#C0C0C0', active: coursesCompleted >= 1, desc: 'Completou o primeiro curso' },
                  { label: 'Mestre IA', color: '#6366f1', active: coursesCreated >= 5, desc: 'Gerou mais de 5 cursos' },
                  { label: 'Pro Life', color: '#f43f5e', active: profileData?.plan === 'pro', desc: 'Assinante do plano PRO' },
                ].map((badge, index) => (
                  <Grid item key={index}>
                    <Tooltip title={badge.active ? `${badge.label}: ${badge.desc}` : 'Bloqueado'}>
                      <Avatar 
                        sx={{ 
                          width: 70, 
                          height: 70, 
                          bgcolor: badge.active ? badge.color : 'action.disabledBackground',
                          opacity: badge.active ? 1 : 0.2,
                          boxShadow: badge.active ? '0 4px 10px rgba(0,0,0,0.2)' : 0,
                          transition: 'transform 0.2s',
                          '&:hover': { transform: badge.active ? 'scale(1.1)' : 'none' }
                        }}
                      >
                        <MilitaryTechIcon sx={{ fontSize: 35 }} />
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