import { create } from "zustand";
import type { StyleProfile, Outfit, ReferralData, TryOnAnalysis } from "@/lib/types";

interface StyleState {
  // Photo
  photo: string | null;
  photoFile: File | null;
  photoBase64: string | null;
  photoMediaType: string | null;
  setPhoto: (photo: string | null, file?: File | null) => void;
  setPhotoBase64: (base64: string, mediaType: string) => void;

  // Analysis
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number, stage: string) => void;

  // Style Profile
  profile: StyleProfile | null;
  setProfile: (profile: StyleProfile) => void;

  // Occasion
  selectedOccasion: string | null;
  setSelectedOccasion: (occasion: string) => void;

  // Outfits
  outfits: Outfit[];
  selectedOutfit: Outfit | null;
  isLoadingOutfits: boolean;
  setOutfits: (outfits: Outfit[]) => void;
  setSelectedOutfit: (outfit: Outfit | null) => void;
  setLoadingOutfits: (loading: boolean) => void;

  // Try-On
  tryOnAnalysis: TryOnAnalysis | null;
  tryOnImage: string | null;
  isTryOnLoading: boolean;
  setTryOnAnalysis: (analysis: TryOnAnalysis | null) => void;
  setTryOnImage: (url: string | null) => void;
  setTryOnLoading: (loading: boolean) => void;

  // Auto Try-On (persists across navigation)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoTryOnResult: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoTryOnSearchResults: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAutoTryOnResult: (result: any | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAutoTryOnSearchResults: (results: any | null) => void;

  // Referral
  referral: ReferralData | null;
  setReferral: (referral: ReferralData) => void;

  // Reset
  reset: () => void;
}

export const useStyleStore = create<StyleState>((set) => ({
  photo: null,
  photoFile: null,
  photoBase64: null,
  photoMediaType: null,
  setPhoto: (photo, file = null) => set({ photo, photoFile: file }),
  setPhotoBase64: (photoBase64, photoMediaType) =>
    set({ photoBase64, photoMediaType }),

  isAnalyzing: false,
  analysisProgress: 0,
  analysisStage: "",
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisProgress: (analysisProgress, analysisStage) =>
    set({ analysisProgress, analysisStage }),

  profile: null,
  setProfile: (profile) => set({ profile }),

  selectedOccasion: null,
  setSelectedOccasion: (selectedOccasion) => set({ selectedOccasion, autoTryOnResult: null, autoTryOnSearchResults: null }),

  outfits: [],
  selectedOutfit: null,
  isLoadingOutfits: false,
  setOutfits: (outfits) => set({ outfits }),
  setSelectedOutfit: (selectedOutfit) =>
    set({ selectedOutfit, tryOnAnalysis: null, tryOnImage: null }),
  setLoadingOutfits: (isLoadingOutfits) => set({ isLoadingOutfits }),

  tryOnAnalysis: null,
  tryOnImage: null,
  isTryOnLoading: false,
  setTryOnAnalysis: (tryOnAnalysis) => set({ tryOnAnalysis }),
  setTryOnImage: (tryOnImage) => set({ tryOnImage }),
  setTryOnLoading: (isTryOnLoading) => set({ isTryOnLoading }),

  autoTryOnResult: null,
  autoTryOnSearchResults: null,
  setAutoTryOnResult: (autoTryOnResult) => set({ autoTryOnResult }),
  setAutoTryOnSearchResults: (autoTryOnSearchResults) => set({ autoTryOnSearchResults }),

  referral: null,
  setReferral: (referral) => set({ referral }),

  reset: () =>
    set({
      photo: null,
      photoFile: null,
      photoBase64: null,
      photoMediaType: null,
      isAnalyzing: false,
      analysisProgress: 0,
      analysisStage: "",
      profile: null,
      selectedOccasion: null,
      outfits: [],
      selectedOutfit: null,
      isLoadingOutfits: false,
      tryOnAnalysis: null,
      tryOnImage: null,
      isTryOnLoading: false,
      autoTryOnResult: null,
      autoTryOnSearchResults: null,
      referral: null,
    }),
}));
