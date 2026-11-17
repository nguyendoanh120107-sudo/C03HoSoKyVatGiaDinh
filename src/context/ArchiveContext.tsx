import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_FAMILY_PROFILE,
  DEMO_ARTIFACTS,
} from '../data/constants';
import {
  deleteArtifact as dbDeleteArtifact,
  deleteSource as dbDeleteSource,
  getAllArtifacts,
  getAllSources,
  getFamilyProfile,
  initDatabase,
  peekNextIdentifier,
  saveArtifact as dbSaveArtifact,
  saveFamilyProfile as dbSaveFamilyProfile,
  saveSource as dbSaveSource,
} from '../services/db';
import { checkGeminiHealth, GeminiHealthStatus } from '../services/geminiService';
import {
  FamilyArchiveProfile,
  FamilyArtifact,
  ReferenceSourceRegistryItem,
} from '../types/artifact';
import { evaluateArtifactCompleteness } from '../utils/completeness';

interface ArchiveContextValue {
  isLoading: boolean;
  error: string | null;
  realArtifacts: FamilyArtifact[];
  demoArtifacts: FamilyArtifact[];
  activeViewArtifacts: FamilyArtifact[];
  familyProfile: FamilyArchiveProfile;
  sources: ReferenceSourceRegistryItem[];
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  isPublicPreview: boolean;
  setIsPublicPreview: (val: boolean) => void;
  geminiHealth: GeminiHealthStatus | null;
  realStats: {
    totalReal: number;
    permittedCount: number;
    dublinCoreCompleteCount: number;
    totalRealImages: number;
    permittedRealImages: number;
    needConservationCount: number;
  };
  refreshAll: () => Promise<void>;
  upsertArtifact: (artifact: FamilyArtifact) => Promise<void>;
  removeArtifact: (id: string) => Promise<void>;
  updateFamilyProfile: (profile: FamilyArchiveProfile) => Promise<void>;
  upsertSource: (source: ReferenceSourceRegistryItem) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  getNextCode: () => Promise<string>;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

export const ArchiveProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realArtifacts, setRealArtifacts] = useState<FamilyArtifact[]>([]);
  const [familyProfile, setFamilyProfile] =
    useState<FamilyArchiveProfile>(DEFAULT_FAMILY_PROFILE);
  const [sources, setSources] = useState<ReferenceSourceRegistryItem[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPublicPreview, setIsPublicPreview] = useState(false);
  const [geminiHealth, setGeminiHealth] = useState<GeminiHealthStatus | null>(null);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initDatabase();
      const [loadedArtifacts, loadedProfile, loadedSources] = await Promise.all([
        getAllArtifacts(),
        getFamilyProfile(),
        getAllSources(),
      ]);
      setRealArtifacts(loadedArtifacts);
      setFamilyProfile(loadedProfile);
      setSources(loadedSources);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu từ bộ nhớ cục bộ IndexedDB.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
    checkGeminiHealth()
      .then(setGeminiHealth)
      .catch(() => setGeminiHealth({ configured: false, model: 'gemini-4-hydrogen' }));
  }, [refreshAll]);

  const upsertArtifact = useCallback(
    async (artifact: FamilyArtifact) => {
      await dbSaveArtifact(artifact);
      await refreshAll();
    },
    [refreshAll]
  );

  const removeArtifact = useCallback(
    async (id: string) => {
      await dbDeleteArtifact(id);
      await refreshAll();
    },
    [refreshAll]
  );

  const updateFamilyProfile = useCallback(
    async (profile: FamilyArchiveProfile) => {
      await dbSaveFamilyProfile({
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      await refreshAll();
    },
    [refreshAll]
  );

  const upsertSource = useCallback(
    async (source: ReferenceSourceRegistryItem) => {
      await dbSaveSource(source);
      await refreshAll();
    },
    [refreshAll]
  );

  const removeSource = useCallback(
    async (id: string) => {
      await dbDeleteSource(id);
      await refreshAll();
    },
    [refreshAll]
  );

  const getNextCode = useCallback(async () => {
    return peekNextIdentifier();
  }, []);

  const realStats = useMemo(() => {
    let permittedCount = 0;
    let dublinCoreCompleteCount = 0;
    let totalRealImages = 0;
    let permittedRealImages = 0;
    let needConservationCount = 0;

    for (const a of realArtifacts) {
      if (a.permissionStatus === 'Đã được phép' && !a.isDraft) {
        permittedCount += 1;
      }
      const rep = evaluateArtifactCompleteness(a);
      if (rep.isDublinCoreComplete) {
        dublinCoreCompleteCount += 1;
      }
      if (rep.needsConservation) {
        needConservationCount += 1;
      }
      totalRealImages += a.imageFiles.length;
      if (a.permissionStatus === 'Đã được phép') {
        permittedRealImages += a.imageFiles.filter((i) => i.isPermittedForPublic).length;
      }
    }

    return {
      totalReal: realArtifacts.length,
      permittedCount,
      dublinCoreCompleteCount,
      totalRealImages,
      permittedRealImages,
      needConservationCount,
    };
  }, [realArtifacts]);

  const activeViewArtifacts = useMemo(() => {
    return isDemoMode ? [...realArtifacts, ...DEMO_ARTIFACTS] : realArtifacts;
  }, [isDemoMode, realArtifacts]);

  const value: ArchiveContextValue = {
    isLoading,
    error,
    realArtifacts,
    demoArtifacts: DEMO_ARTIFACTS,
    activeViewArtifacts,
    familyProfile,
    sources,
    isDemoMode,
    setIsDemoMode,
    isPublicPreview,
    setIsPublicPreview,
    geminiHealth,
    realStats,
    refreshAll,
    upsertArtifact,
    removeArtifact,
    updateFamilyProfile,
    upsertSource,
    removeSource,
    getNextCode,
  };

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
};

export function useArchive(): ArchiveContextValue {
  const ctx = useContext(ArchiveContext);
  if (!ctx) {
    throw new Error('useArchive phải được dùng bên trong ArchiveProvider.');
  }
  return ctx;
}
