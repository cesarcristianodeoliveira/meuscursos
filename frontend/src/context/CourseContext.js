import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { fetchAll, getCourses } from '../services/api';

const CourseContext = createContext();
export const useCourse = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
  // ===============================================
  // 1. ESTADOS PRINCIPAIS
  // ===============================================
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Wizard
  const [level, setLevel] = useState('beginner');
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);

  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ===============================================
  // 2. CARREGAR ESTATÍSTICAS (SEGURO)
  // ===============================================
  const loadStatsSafely = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/fetch/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const txt = await response.text();
        console.error('❌ Resposta não JSON:', txt.slice(0, 200));
        throw new Error('Resposta inválida');
      }

      const data = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      return null;
    }
  }, [BASE_URL]);

  const refreshStats = useCallback(async () => {
    try {
      await loadStatsSafely();
    } catch (_) {}
  }, [loadStatsSafely]);

  // ===============================================
  // 3. FORÇAR RELOAD COMPLETO
  // ===============================================
  const forceRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    console.log('🔄 Forçando refresh geral…');
  }, []);

  // ===============================================
  // 4. CARREGAR TUDO (CATEGORIAS, SUBCATEGORIAS, CURSOS E STATS)
  // ===============================================
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setProgressVisible(true);

      const all = await fetchAll();

      setCategories(all.categories || []);
      setSubcategories(all.subcategories || []);
      setCourses(all.courses || []);

      await loadStatsSafely();
    } catch (err) {
      console.error('❌ Erro ao carregar dados iniciais:', err);
    } finally {
      setLoading(false);
      setProgressVisible(false);
    }
  }, [loadStatsSafely]);

  // ===============================================
  // 5. RECARREGAR APENAS CURSOS
  // ===============================================
  const reloadCourses = useCallback(async () => {
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
  }, [refreshStats]);

  // ===============================================
  // 6. ADICIONAR CURSO (SINCRONIZADO COM generate.js)
  // ===============================================
  const addCourse = useCallback(
    (course) => {
      if (!course) return console.warn('⚠️ Curso vazio recebido');

      const slug =
        typeof course.slug === 'object'
          ? course.slug.current
          : course.slug || course.id || course._id;

      if (!slug) {
        console.warn('⚠️ Curso sem slug válido:', course);
        return;
      }

      // 🔹 Usa totalLessons/totalExercises diretamente se vierem do generate
      const newCourse = {
        ...course,
        id: course.id || course._id,
        slug,
        url: `/curso/${slug}`,

        provider: course.provider || 'openai',
        level: course.level || 'beginner',          // ✅ pega o level do payload
        totalLessons: course.totalLessons || 0,     // ✅ não recalcula
        totalExercises: course.totalExercises || 0, // ✅ não recalcula

        modules: course.modules || [],
        tags: Array.isArray(course.tags) ? course.tags : [],

        category: course.category || null,
        subcategory: course.subcategory || null,

        _createdAt: course._createdAt || new Date().toISOString(),
        _updatedAt: course._updatedAt || new Date().toISOString(),
      };

      setCourses((prev) => {
        const exists = prev.some((c) => c.slug === newCourse.slug);
        if (exists) {
          return prev.map((c) => (c.slug === newCourse.slug ? newCourse : c));
        }
        return [newCourse, ...prev];
      });

      refreshStats();
    },
    [refreshStats]
  );

  // ===============================================
  // 7. SUBCATEGORIAS POR CATEGORIA
  // ===============================================
  const getSubcategoriesByCategory = useCallback(
    (categoryId) =>
      subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories]
  );

  // ===============================================
  // 8. RESET DO WIZARD
  // ===============================================
  const resetCourse = useCallback(() => {
    setCategory(null);
    setSubcategory(null);
    setLevel('beginner');
  }, []);

  // ===============================================
  // 9. EFEITO: CARREGAMENTO INICIAL
  // ===============================================
  useEffect(() => {
    loadAll();
  }, [loadAll, refreshTrigger]);

  // ===============================================
  // 10. MEMO FINAL (SEM RE-RENDERS DESNECESSÁRIOS)
  // ===============================================
  const value = useMemo(
    () => ({
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
      addCourse,
      forceRefresh,
      getSubcategoriesByCategory,

      level,
      setLevel,
      category,
      setCategory,
      subcategory,
      setSubcategory,
      resetCourse,
    }),
    [
      courses,
      categories,
      subcategories,
      stats,
      loading,
      progressVisible,
      loadAll,
      reloadCourses,
      loadStatsSafely,
      refreshStats,
      addCourse,
      forceRefresh,
      getSubcategoriesByCategory,
      level,
      category,
      subcategory,
      resetCourse,
    ]
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
};
