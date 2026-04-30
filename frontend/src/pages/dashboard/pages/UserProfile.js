import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Avatar, Button, Divider, Stack, Chip, LinearProgress,
  CircularProgress, IconButton, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Ícones
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LogoutIcon from '@mui/icons-material/Logout';
import ShareIcon from '@mui/icons-material/Share';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

import { useAuth } from '../../../contexts/AuthContext';

const ProfileHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  height: '160px',
  borderRadius: theme.spacing(3),
  position: 'relative',
  marginBottom: theme.spacing(8),
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '-50px',
  left: '40px',
  padding: '4px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '50%',
}));

export default function UserProfile() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user: loggedUser, signOut } = useAuth();

  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const isOwnProfile = !id || id === loggedUser?._id;

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (isOwnProfile && loggedUser) {
          setProfileData(loggedUser);
          setLoading(false);
          return;
        }

        // Busca perfil público adaptado para a nova estrutura de stats
        const query = `*[_type == "user" && _id == $userId][0]{
          _id, name, email, plan, role, credits,
          stats,
          "avatar": avatar.asset->url
        }`;
        const result = await client.fetch(query, { userId: id });
        setProfileData(result);
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
      <Button onClick={() => navigate('/')}>Voltar para o Início</Button>
    </Container>
  );

  // Lógica de Gamificação Centralizada (Stats vindos do Context ou Sanity)
  const userXP = profileData?.stats?.totalXp || 0;
  const userLevel = profileData?.stats?.level || 1;
  const coursesCompleted = profileData?.stats?.coursesCompleted || 0;
  
  // Cálculo de progresso para o próximo nível (base 1000 XP por nível)
  const progressToNextLevel = (userXP % 1000) / 10;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader>
        <AvatarWrapper>
          <Avatar 
            sx={{ width: 120, height: 120, fontSize: '3.5rem', bgcolor: 'secondary.main', border: '4px solid white' }}
            src={profileData?.avatar}
          >
            {profileData?.name?.charAt(0)}
          </Avatar>
        </AvatarWrapper>

        <Box sx={{ position: 'absolute', right: 20, top: 20 }}>
          <Tooltip title="Compartilhar Perfil">
            <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ProfileHeader>

      <Grid container spacing={4}>
        {/* COLUNA ESQUERDA: IDENTIDADE */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Box sx={{ pl: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight="bold">{profileData?.name}</Typography>
                {profileData?.role === 'admin' && <VerifiedIcon color="primary" fontSize="small" />}
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Membro desde {new Date().getFullYear()}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip 
                  label={profileData?.plan === 'pro' ? 'PRO MEMBER' : 'FREE'} 
                  color={profileData?.plan === 'pro' ? 'secondary' : 'default'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip label={`Nível ${userLevel}`} color="primary" size="small" variant="outlined" />
              </Stack>
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Progresso de Nível</Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h3" fontWeight="900" color="primary">{userXP}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">XP</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                  Faltam {1000 - (userXP % 1000)} XP para o nível {userLevel + 1}
                </Typography>
                <LinearProgress variant="determinate" value={progressToNextLevel} sx={{ height: 10, borderRadius: 5 }} />
              </CardContent>
            </Card>

            {isOwnProfile && (
              <Button 
                fullWidth 
                variant="outlined" 
                color="error" 
                startIcon={<LogoutIcon />}
                onClick={signOut}
                sx={{ borderRadius: 3 }}
              >
                Encerrar Sessão
              </Button>
            )}
          </Stack>
        </Grid>

        {/* COLUNA DIREITA: CONTEÚDO */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {isOwnProfile && (
              <Card variant="outlined" sx={{ borderRadius: 4, background: (theme) => `linear-gradient(90deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Saldo de Créditos</Typography>
                      <Typography variant="h4" fontWeight="bold">{profileData?.credits || 0}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                      <MonetizationOnIcon sx={{ fontSize: 32, color: 'warning.dark' }} />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" /> Estatísticas de Aprendizado
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'action.hover', borderRadius: 4 }}>
                      <Typography variant="h4" fontWeight="bold">{coursesCompleted}</Typography>
                      <Typography variant="body2" color="text.secondary">Cursos</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'action.hover', borderRadius: 4 }}>
                      <Typography variant="h4" fontWeight="bold">{coursesCompleted}</Typography>
                      <Typography variant="body2" color="text.secondary">Certificados</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 4 }}>
                      <MilitaryTechIcon sx={{ fontSize: 40 }} />
                      <Typography variant="h6" fontWeight="bold">Top 10%</Typography>
                      <Typography variant="caption">Ranking IA</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}