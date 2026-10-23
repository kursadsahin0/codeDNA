"use client";

import { useEffect, useState } from "react";
import {
  loadPublicRepositoryAnalysis,
  type PublicRepositoryAnalysis,
} from "@/lib/public-repository-store";

export function usePublicRepositoryAnalysis() {
  const [analysis, setAnalysis] = useState<PublicRepositoryAnalysis | null>(null);

  useEffect(() => {
    const update = () => setAnalysis(loadPublicRepositoryAnalysis());
    update();
    window.addEventListener("codedna:public-repository-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("codedna:public-repository-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return analysis;
}
