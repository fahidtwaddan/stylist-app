"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ScanningAnimation from "@/components/ScanningAnimation";
import { useStyleStore } from "@/store/useStyleStore";

// Check if a file is HEIC/HEIF format
function isHeicFile(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif"
    || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

// Convert HEIC to JPEG using heic2any, then resize
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const result = Array.isArray(blob) ? blob[0] : blob;
  const safeName = file.name.replace(/\.[^/.]+$/, "") || "upload";
  return new File([result], `${safeName}.jpg`, { type: "image/jpeg" });
}

// Convert image to JPEG client-side and resize if needed.
async function resizeImage(file: File, maxDim: number): Promise<File> {
  // Convert HEIC first since browsers can't decode it natively
  const inputFile = isHeicFile(file) ? await convertHeicToJpeg(file) : file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const safeName = inputFile.name.replace(/\.[^/.]+$/, "") || "upload";
            resolve(new File([blob], `${safeName}.jpg`, { type: "image/jpeg" }));
          } else {
            resolve(inputFile);
          }
        },
        "image/jpeg",
        0.85
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(inputFile);
    };
    const objectUrl = URL.createObjectURL(inputFile);
    img.src = objectUrl;
  });
}

const ANALYSIS_STAGES = [
  "Validating your photo...",
  "Detecting body proportions...",
  "Analyzing skin tone...",
  "Mapping color season...",
  "Decoding style personality...",
  "Crafting your archetype...",
  "Generating recommendations...",
  "Finalizing your style DNA...",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const {
    photo,
    photoFile,
    analysisProgress,
    analysisStage,
    setAnalysisProgress,
    setProfile,
    setAnalyzing,
    setPhotoBase64,
    setGender,
    setPhoto,
  } = useStyleStore();

  const hasRun = useRef(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [displayPhoto, setDisplayPhoto] = useState<string | null>(
    photo && !photoFile ? photo : (photoFile && !isHeicFile(photoFile) ? photo : null)
  );

  const runAnalysis = useCallback(async () => {
    if (hasRun.current) return;
    if (!photoFile || !photo) {
      router.push("/");
      return;
    }

    hasRun.current = true;
    setAnalyzing(true);
    setValidationError(null);

    // Convert HEIC to JPEG first so preview + API both work
    let workingFile = photoFile;
    if (isHeicFile(photoFile)) {
      try {
        setAnalysisProgress(5, "Converting image format...");
        const jpegFile = await convertHeicToJpeg(photoFile);
        const url = URL.createObjectURL(jpegFile);
        setDisplayPhoto(url);
        setPhoto(url, jpegFile);
        workingFile = jpegFile;
      } catch {
        // Fall through — resizeImage will also try conversion
      }
    }

    // Simulate progress while API call runs
    let progress = 10;
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 8 + 2;
        if (progress > 90) progress = 90;
        const stageIndex = Math.min(
          Math.floor((progress / 100) * ANALYSIS_STAGES.length),
          ANALYSIS_STAGES.length - 1
        );
        setAnalysisProgress(progress, ANALYSIS_STAGES[stageIndex]);
      }
    }, 400);

    try {
      // Resize image before upload to speed up Vision API
      const resizedFile = await resizeImage(workingFile, 1024);

      // Save base64 of the normalized image for later try-on API
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        setPhotoBase64(base64, resizedFile.type || "image/jpeg");
      };
      reader.readAsDataURL(resizedFile);

      const formData = new FormData();
      formData.append("photo", resizedFile);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (err.validationFailed) {
          clearInterval(interval);
          setAnalyzing(false);
          setValidationError(err.error);
          return;
        }
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();

      clearInterval(interval);
      setAnalysisProgress(100, "Complete!");
      if (data.profile.gender) setGender(data.profile.gender);
      setProfile(data.profile);

      setTimeout(() => {
        setAnalyzing(false);
        router.push("/occasions");
      }, 800);
    } catch (error) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      setAnalyzing(false);
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setAnalysisProgress(
        0,
        isTimeout ? "Timed out — tap to retry" : "Error — tap to retry"
      );
    }
  }, [photoFile, photo, router, setAnalyzing, setAnalysisProgress, setProfile, setPhotoBase64, setGender, setPhoto]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleGoBack = () => {
    setPhoto(null);
    setValidationError(null);
    router.push("/");
  };

  if (!photo) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-8">
      {/* Validation Error Overlay */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#1a1a2e] border border-red-500/30 p-6 text-center"
            >
              <div className="h-14 w-14 mx-auto rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Photo Rejected</h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">{validationError}</p>
              <button
                onClick={handleGoBack}
                className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-3.5 text-sm font-bold text-black"
              >
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <ScanningAnimation
          photoUrl={displayPhoto || photo}
          progress={analysisProgress}
          stage={analysisStage}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center text-sm text-white/40"
      >
        Our AI is reading your unique style DNA...
      </motion.p>

      {analysisStage === "Error — tap to retry" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => { hasRun.current = false; runAnalysis(); }}
          className="mt-4 rounded-xl bg-gold-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Retry Analysis
        </motion.button>
      )}
    </div>
  );
}
