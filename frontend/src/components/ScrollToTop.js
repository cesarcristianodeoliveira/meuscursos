import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Joga o scroll para o topo (0,0) toda vez que o caminho da URL mudar
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;