import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { fetchAll, getCourses } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

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
  // 2. NORMALIZAÇÃO DE CURSO (usado internamente)
  // ===============================================
  const normalizeCourse = useCallback((course) => {
    if (!course) return null;

    const slug = course.slug?.current || course.slug || course.id || course._id;
    const totalLessons =
      course.totalLessons ??
      (course.modules?.reduce((sumM, m) => sumM + (m.lessons?.length || 0), 0) || 0);
    const totalExercises =
      course.totalExercises ??
      (course.modules?.reduce(
        (sumM, m) =>
          sumM +
          (m.lessons?.reduce((sumL, l) => sumL + (l.exercises?.length || 0), 0) || 0),
        0
      ) || 0);

    const modules = (course.modules || []).map((m) => ({
      ...m,
      _key: m._key || uuidv4(),
      lessons: (m.lessons || []).map((l) => ({
        ...l,
        _key: l._key || uuidv4(),
        exercises: (l.exercises || []).map((e) => ({ ...e, _key: e._key || uuidv4() })),
      })),
    }));

    return {
      ...course,
      id: course.id || course._id,
      slug,
      url: `/curso/${slug}`,
      totalLessons,
      totalExercises,
      provider: course.provider || 'openai',
      tags: Array.isArray(course.tags) ? course.tags : [],
      modules,
      _createdAt: course._createdAt || new Date().toISOString(),
      _updatedAt: course._updatedAt || new Date().toISOString(),
    };
  }, []);

  // ===============================================
  // 3. CARREGAR ESTATÍSTICAS (SEGURO)
  // ===============================================
  const loadStatsSafely = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/fetch/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) throw new Error('Resposta inválida');
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
  // 4. FORÇAR RELOAD COMPLETO
  // ===============================================
  const forceRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    console.log('🔄 Forçando refresh geral…');
  }, []);

  // ===============================================
  // 5. CARREGAR TUDO (CATEGORIAS, SUBCATEGORIAS, CURSOS E STATS)
  // ===============================================
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setProgressVisible(true);

      const all = await fetchAll();

      setCategories(all.categories || []);
      setSubcategories(all.subcategories || []);
      setCourses((all.courses || []).map(normalizeCourse));

      await loadStatsSafely();
    } catch (err) {
      console.error('❌ Erro ao carregar dados iniciais:', err);
    } finally {
      setLoading(false);
      setProgressVisible(false);
    }
  }, [loadStatsSafely, normalizeCourse]);

  // ===============================================
  // 6. RECARREGAR APENAS CURSOS
  // ===============================================
  const reloadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const cs = await getCourses();
      setCourses((cs || []).map(normalizeCourse));
      await refreshStats();
    } catch (err) {
      console.error('❌ Erro ao recarregar cursos:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshStats, normalizeCourse]);

  // ===============================================
  // 7. ADICIONAR CURSO (SINCRONIZADO COM generate.js)
  // ===============================================
  const addCourse = useCallback(
    (course) => {
      const normalized = normalizeCourse(course);
      if (!normalized) return console.warn('⚠️ Curso inválido recebido');
      setCourses((prev) => {
        const exists = prev.some((c) => c.slug === normalized.slug);
        if (exists) return prev.map((c) => (c.slug === normalized.slug ? normalized : c));
        return [normalized, ...prev];
      });
      refreshStats();
    },
    [normalizeCourse, refreshStats]
  );

  // ===============================================
  // 8. SUBCATEGORIAS POR CATEGORIA
  // ===============================================
  const getSubcategoriesByCategory = useCallback(
    (categoryId) => subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories]
  );

  // ===============================================
  // 9. RESET DO WIZARD
  // ===============================================
  const resetCourse = useCallback(() => {
    setCategory(null);
    setSubcategory(null);
    setLevel('beginner');
  }, []);

  // ===============================================
  // 10. EFEITO: CARREGAMENTO INICIAL
  // ===============================================
  useEffect(() => {
    loadAll();
  }, [loadAll, refreshTrigger]);

  // ===============================================
  // 11. MEMO FINAL
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
