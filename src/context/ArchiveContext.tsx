import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import packagedArtifactsJson from '../data/artifacts.json';
import packagedPermissionsJson from '../data/permissions.json';
import packagedSourcesJson from '../data/sources.json';
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
  PermissionRegistryEntry,
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
  permissions: PermissionRegistryEntry[];
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  isPublicPreview: boolean;
  setIsPublicPreview: (val: boolean) => void;
  geminiHealth: GeminiHealthStatus | null;
  realStats: {
    totalReal: number;
    verifiedCount: number;
    permittedCount: number;
    dublinCoreCompleteCount: number;
    totalRealImages: number;
    permittedRealImages: number;
    needConservationCount: number;
    sufficientSourcesCount: number;
  };
  sourceStats: {
    totalSources: number;
    officialSources: number;
    directArtifactSources: number;
    unverifiedSources: number;
    artifactsWithTwoSources: number;
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
  const [permissions, setPermissions] = useState<PermissionRegistryEntry[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPublicPreview, setIsPublicPreview] = useState(false);
  const [geminiHealth, setGeminiHealth] = useState<GeminiHealthStatus | null>(null);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initDatabase();

      // Load public packaged records from Express backend (fallback to bundled JSON)
      let publicArtifacts: FamilyArtifact[] = (
        packagedArtifactsJson as FamilyArtifact[]
      ).map((a) => ({ ...a, isPackagedPublic: true }));
      let publicSources: ReferenceSourceRegistryItem[] =
        packagedSourcesJson as ReferenceSourceRegistryItem[];
      let publicPermissions: PermissionRegistryEntry[] =
        packagedPermissionsJson as PermissionRegistryEntry[];

      try {
        const res = await fetch('/api/public/bundle');
        if (res.ok) {
          const bundle = await res.json();
          if (Array.isArray(bundle.artifacts)) {
            publicArtifacts = bundle.artifacts.map((a: FamilyArtifact) => ({
              ...a,
              isPackagedPublic: true,
            }));
          }
          if (Array.isArray(bundle.sources)) {
            publicSources = bundle.sources;
          }
          if (Array.isArray(bundle.permissions)) {
            publicPermissions = bundle.permissions;
          }
        }
      } catch {
        // Offline or static fallback already initialized
      }

      const [localArtifacts, loadedProfile, localSources] = await Promise.all([
        getAllArtifacts(),
        getFamilyProfile(),
        getAllSources(),
      ]);

      // Merge packaged public records with local IndexedDB edits/drafts (local takes precedence by ID)
      const mergedMap = new Map<string, FamilyArtifact>();
      for (const pub of publicArtifacts) {
        mergedMap.set(pub.id, pub);
      }
      for (const loc of localArtifacts) {
        mergedMap.set(loc.id, loc);
      }

      const mergedArtifacts = Array.from(mergedMap.values()).sort((a, b) =>
        a.identifier.localeCompare(b.identifier)
      );

      // Merge packaged sources with local IndexedDB sources
      const srcMap = new Map<string, ReferenceSourceRegistryItem>();
      for (const s of publicSources) {
        srcMap.set(s.id, s);
      }
      for (const ls of localSources) {
        srcMap.set(ls.id, {
          ...ls,
          sourceCategory: ls.sourceCategory ?? 'C',
          publisher: ls.publisher ?? ls.authorOrProvider ?? 'Chưa cập nhật',
          publishedDate: ls.publishedDate ?? '',
          accessedDate: ls.accessedDate ?? ls.surveyDate ?? '',
          isVerified: ls.isVerified ?? Boolean(ls.url && ls.verifiedContent),
        });
      }

      setRealArtifacts(mergedArtifacts);
      setFamilyProfile(loadedProfile);
      setSources(Array.from(srcMap.values()));
      setPermissions(publicPermissions);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu hồ sơ.'
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
    const used = new Set(realArtifacts.map((a) => a.identifier));
    let nextCode = await peekNextIdentifier();
    let num = parseInt(nextCode.replace('C03-', ''), 10) || 1;
    while (used.has(`C03-${String(num).padStart(5, '0')}`)) {
      num += 1;
    }
    return `C03-${String(num).padStart(5, '0')}`;
  }, [realArtifacts]);

  const realStats = useMemo(() => {
    let verifiedCount = 0;
    let permittedCount = 0;
    let dublinCoreCompleteCount = 0;
    let totalRealImages = 0;
    let permittedRealImages = 0;
    let needConservationCount = 0;
    let sufficientSourcesCount = 0;

    for (const a of realArtifacts) {
      const rep = evaluateArtifactCompleteness(a);
      if (
        (a.verificationStatus === 'Đã xác minh' ||
          a.verificationStatus === 'Đã kiểm chứng') &&
        a.referenceSources.length > 0 &&
        Boolean(a.currentStorageLocation.trim())
      ) {
        verifiedCount += 1;
      }
      if (a.permissionStatus === 'Đã được phép' && !a.isDraft) {
        permittedCount += 1;
      }
      if (rep.isDublinCoreComplete) {
        dublinCoreCompleteCount += 1;
      }
      if (rep.needsConservation) {
        needConservationCount += 1;
      }
      if (rep.hasSufficientSources) {
        sufficientSourcesCount += 1;
      }
      totalRealImages += a.imageFiles.length;
      if (a.permissionStatus === 'Đã được phép') {
        permittedRealImages += a.imageFiles.filter((i) => i.isPermittedForPublic).length;
      }
    }

    return {
      totalReal: realArtifacts.length,
      verifiedCount,
      permittedCount,
      dublinCoreCompleteCount,
      totalRealImages,
      permittedRealImages,
      needConservationCount,
      sufficientSourcesCount,
    };
  }, [realArtifacts]);

  const sourceStats = useMemo(() => {
    return {
      totalSources: sources.length,
      officialSources: sources.filter((s) => s.isOfficial).length,
      directArtifactSources: sources.filter((s) => s.sourceCategory === 'A').length,
      unverifiedSources: sources.filter((s) => !s.isVerified).length,
      artifactsWithTwoSources: realStats.sufficientSourcesCount,
    };
  }, [sources, realStats.sufficientSourcesCount]);

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
    permissions,
    isDemoMode,
    setIsDemoMode,
    isPublicPreview,
    setIsPublicPreview,
    geminiHealth,
    realStats,
    sourceStats,
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
