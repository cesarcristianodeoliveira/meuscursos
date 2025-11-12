import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAll, getCourses } from '../services/api';

const CourseContext = createContext();

export const useCourse = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);

  const [level, setLevel] = useState('beginner');
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);

  const loadStatsSafely = useCallback(async () => {
    try {
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${BASE_URL}/api/fetch/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 200));
        throw new Error('Resposta não é JSON');
      }
      
      const data = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      return null;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      await loadStatsSafely();
    } catch (error) {

    }
  }, [loadStatsSafely]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setProgressVisible(true);
      
      const all = await fetchAll();
      
      setCategories(all.categories || []);
      setSubcategories(all.subcategories || []);
      setCourses(all.courses || []);
      
      const statsData = await loadStatsSafely();
      
      if (statsData) {
        setStats(statsData);
      } else {
        console.warn('⚠️ Não foi possível carregar estatísticas');
      }
      
    } catch (err) {
      console.error('❌ Erro ao carregar dados iniciais:', err);
    } finally {
      setProgressVisible(false);
      setLoading(false);
    }
  }, [loadStatsSafely]);

  const reloadCourses = async () => {
    try {
      setLoading(true);
      const cs = await getCourses();
      setCourses(cs || []);
      
      await refreshStats();
    } catch (err) {
      console.error('❌ Erro ao recarregar cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCourse = (course) => {
    if (!course) return;

    const slug =
      typeof course.slug === 'object'
        ? course.slug.current
        : course.slug || course.id || course._id;

    if (!slug) {
      console.warn('⚠️ Curso sem slug válido:', course);
      return;
    }

    const newCourse = {
      ...course,
      id: course.id || course._id,
      slug,
      url: `/curso/${slug}`,
      _createdAt: course._createdAt || new Date().toISOString(),
      _updatedAt: course._updatedAt || new Date().toISOString(),
      // 👈 Garante que tenha as contagens mesmo se vierem vazias
      totalLessons: course.totalLessons || 0,
      totalExercises: course.totalExercises || 0,
    };

    setCourses((prev) => {
      const exists = prev.some((c) => c.slug === newCourse.slug); 
      if (exists) return prev;
      return [newCourse, ...prev];
    });

    refreshStats();
  };

  const updateStats = useCallback(async () => {
    await refreshStats();
  }, [refreshStats]);

  const resetCourse = () => {
    setCategory(null);
    setSubcategory(null);
    setLevel('beginner');
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        categories,
        subcategories,
        stats,
        loading,
        progressVisible,
        loadAll,
        reloadCourses,
        loadStats: loadStatsSafely,
        refreshStats,
        updateStats,
        addCourse,
        level,
        setLevel,
        category,
        setCategory,
        subcategory,
        setSubcategory,
        resetCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};