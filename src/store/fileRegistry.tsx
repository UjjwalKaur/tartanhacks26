'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FileKey = 'finance_json' | 'physical_json' | 'transactions_csv' | 'health_csv' | 'checkins_csv';

export interface FileRef {
  key: FileKey;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  uploadedAt: number;
  objectUrl?: string;
}

interface FileRegistryContextType {
  fileRefs: Map<FileKey, FileRef>;
  files: Map<FileKey, File>;
  setFile: (key: FileKey, file: File) => void;
  getFile: (key: FileKey) => File | undefined;
  getFileRef: (key: FileKey) => FileRef | undefined;
  getAllFiles: () => Array<{ key: FileKey; file: File }>;
  clearFile: (key: FileKey) => void;
  clearAll: () => void;
  isHydrated: boolean;
}

const FileRegistryContext = createContext<FileRegistryContextType | undefined>(undefined);

const STORAGE_KEY = 'mosaic:fileRegistry';

export const useFileRegistry = () => {
  const context = useContext(FileRegistryContext);
  if (!context) {
    throw new Error('useFileRegistry must be used within FileRegistryProvider');
  }
  return context;
};

export const FileRegistryProvider = ({ children }: { children: ReactNode }) => {
  const [fileRefs, setFileRefs] = useState<Map<FileKey, FileRef>>(new Map());
  const [files, setFiles] = useState<Map<FileKey, File>>(new Map());
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<[FileKey, FileRef]>;
        setFileRefs(new Map(parsed));
      }
    } catch (error) {
      console.error('Failed to load FileRegistry from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever fileRefs changes
  useEffect(() => {
    if (isHydrated) {
      try {
        const data = Array.from(fileRefs.entries());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save FileRegistry to localStorage:', error);
      }
    }
  }, [fileRefs, isHydrated]);

  const setFile = (key: FileKey, file: File) => {
    // Create object URL
    const objectUrl = URL.createObjectURL(file);

    // Create FileRef
    const fileRef: FileRef = {
      key,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      uploadedAt: Date.now(),
      objectUrl,
    };

    // Update refs
    setFileRefs((prev) => new Map(prev).set(key, fileRef));

    // Update files
    setFiles((prev) => new Map(prev).set(key, file));
  };

  const getFile = (key: FileKey): File | undefined => {
    return files.get(key);
  };

  const getFileRef = (key: FileKey): FileRef | undefined => {
    return fileRefs.get(key);
  };

  const getAllFiles = (): Array<{ key: FileKey; file: File }> => {
    const result: Array<{ key: FileKey; file: File }> = [];
    files.forEach((file, key) => {
      result.push({ key, file });
    });
    return result;
  };

  const clearFile = (key: FileKey) => {
    // Revoke object URL
    const fileRef = fileRefs.get(key);
    if (fileRef?.objectUrl) {
      URL.revokeObjectURL(fileRef.objectUrl);
    }

    // Remove from maps
    setFileRefs((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });

    setFiles((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  const clearAll = () => {
    // Revoke all object URLs
    fileRefs.forEach((ref) => {
      if (ref.objectUrl) {
        URL.revokeObjectURL(ref.objectUrl);
      }
    });

    // Clear maps
    setFileRefs(new Map());
    setFiles(new Map());
  };

  return (
    <FileRegistryContext.Provider
      value={{
        fileRefs,
        files,
        setFile,
        getFile,
        getFileRef,
        getAllFiles,
        clearFile,
        clearAll,
        isHydrated,
      }}
    >
      {children}
    </FileRegistryContext.Provider>
  );
};
