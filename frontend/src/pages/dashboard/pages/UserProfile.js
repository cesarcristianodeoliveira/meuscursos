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
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ShareIcon from '@mui/icons-material/Share';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';

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
  const { id } = useParams(); // ID vindo da URL para perfil público
  const navigate = useNavigate();
  const { user: loggedUser, signOut } = useAuth();
  
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Define se o perfil visualizado pertence ao usuário logado
  const isOwnProfile = !id || id === loggedUser?._id;

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Se for o próprio perfil e não houver ID na URL, usa dados do context
        if (isOwnProfile && loggedUser) {
          setProfileData(loggedUser);
          setLoading(false);
          return;
        }

        // Busca perfil público no Sanity via ID
        const query = `*[_type == "user" && _id == $userId][0]{
          _id, name, email, plan, role, xp, credits,
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

  // Lógica de Nível
  const userXP = profileData?.xp || 0;
  const currentLevel = Math.floor(userXP / 1000) + 1;
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
        
        {isOwnProfile && (
          <Box sx={{ position: 'absolute', right: 20, top: 20 }}>
            <Tooltip title="Compartilhar Perfil">
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </ProfileHeader>

      <Grid container spacing={4}>
        {/* IDENTIDADE */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Box sx={{ pl: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight="bold">{profileData?.name}</Typography>
                {profileData?.role === 'admin' && <VerifiedIcon color="primary" fontSize="small" />}
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Estudante de IA desde 2026
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip 
                  label={profileData?.plan === 'pro' ? 'PRO MEMBER' : 'FREE'} 
                  color={profileData?.plan === 'pro' ? 'secondary' : 'default'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip label={`Lvl ${currentLevel}`} color="primary" size="small" variant="outlined" />
              </Stack>
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Progresso Acadêmico</Typography>
                <Typography variant="h3" fontWeight="900" color="primary">{userXP}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>XP TOTAL ACUMULADO</Typography>
                <LinearProgress variant="determinate" value={progressToNextLevel} sx={{ height: 6, borderRadius: 3 }} />
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

        {/* CONTEÚDO PÚBLICO / PRIVADO */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Se for o próprio perfil, mostra os créditos */}
            {isOwnProfile && (
              <Card variant="outlined" sx={{ borderRadius: 4, borderLeft: '6px solid', borderLeftColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Créditos Disponíveis</Typography>
                      <Typography variant="h5" fontWeight="bold">{profileData?.credits || 0}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <MonetizationOnIcon />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* BOX DE CONQUISTAS (Visível para todos) */}
            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" /> Conquistas do Aluno
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="h5" fontWeight="bold">0</Typography>
                      <Typography variant="caption">Cursos Concluídos</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="h5" fontWeight="bold">0</Typography>
                      <Typography variant="caption">Certificados</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="h5" fontWeight="bold">{currentLevel}</Typography>
                      <Typography variant="caption">Rank Global</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* CONFIGURAÇÕES (Somente o dono vê) */}
            {isOwnProfile && (
              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" fontSize="small" /> Preferências de Conta
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Apenas você pode ver esta seção.
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<WorkspacePremiumIcon />} color="secondary">
                    Gerenciar Assinatura PRO
                  </Button>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}