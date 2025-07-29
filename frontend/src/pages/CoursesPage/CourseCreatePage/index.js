// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import CourseCreationStepper from './components/CourseCreationStepper';
import { useAuth } from '../../../contexts/AuthContext';

function CourseCreatePage() {
  const [pageAlert, setPageAlert] = useState({ message: null, severity: null });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/entrar');
    }
  }, [user, navigate]);

  const handleShowPageAlert = useCallback((message, severity) => {
    setPageAlert({ message, severity });
  }, []);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      {pageAlert.message && (
        <Alert severity={pageAlert.severity}>
          {pageAlert.message}
        </Alert>
      )}
      <CourseCreationStepper onShowPageAlert={handleShowPageAlert} />
    </Container>
  );
}

export default CourseCreatePage;
