# Create Page Template - Clean Architecture Pattern

## Prompt Template for Creating New Pages

Use this prompt template to create new pages following Clean Architecture and SOLID principles

## Pattern Overview

This template follows the established Clean Architecture pattern with:

1. **Server Component** for SEO optimization (`app/[page-path]/page.tsx`)
2. **Presenter Pattern** for business logic separation (`src/presentation/presenters/[page-name]/[PageName]Presenter.ts`)
3. **Custom Hook** for state management (`src/presentation/presenters/[page-name]/use[PageName]Presenter.ts`)
4. **View Component** for UI rendering (`src/presentation/components/[page-name]/[PageName]View.tsx`)

---

## 1. Pattern: `app/[page-path]/page.tsx`

```typescript
import { [PageName]View } from "@/src/presentation/components/[page-name]/[PageName]View";
import { [PageName]PresenterFactory } from "@/src/presentation/presenters/[page-name]/[PageName]Presenter";
import type { Metadata } from "next";
import Link from "next/link";

// Tell Next.js this is a dynamic page
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface [PageName]PageProps {
  params: Promise<{ [paramName]: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({
  params,
}: [PageName]PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const presenter = await [PageName]PresenterFactory.createServer();

  try {
    return presenter.generateMetadata(resolvedParams.[paramName]);
  } catch (error) {
    console.error("Error generating metadata:", error);

    // Fallback metadata
    return {
      title: "จัดการ[PageThaiName] | Shop Queue",
      description: "ระบบจัดการ[PageThaiDescription]",
    };
  }
}

/**
 * [PageName] Management page - Server Component for SEO optimization
 * Uses presenter pattern following Clean Architecture
 */
export default async function [PageName]Page({ params }: [PageName]PageProps) {
  const resolvedParams = await params;
  const presenter = await [PageName]PresenterFactory.createServer();

  try {
    // Get view model from presenter
    const viewModel = await presenter.getViewModel(resolvedParams.[paramName]);

    return (
      <[PageName]View [paramName]={resolvedParams.[paramName]} initialViewModel={viewModel} />
    );
  } catch (error) {
    console.error("Error fetching [page-name] data:", error);

    // Fallback UI
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-muted mb-4">ไม่สามารถโหลดข้อมูล[PageThaiName]ได้</p>
          <Link
            href="/"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }
}
```

### Key Features:

- **Server Component** for SEO optimization
- **Dynamic page** configuration for proper data fetching
- **Metadata generation** with fallback handling
- **Error handling** with user-friendly fallback UI
- **Presenter pattern** for clean separation of concerns
- **Dependency injection** through factory pattern

---

## 2. Pattern: `src/presentation/presenters/[page-name]/[PageName]Presenter.ts`

```typescript
import { createServerSupabaseClient } from "@/src/infrastructure/config/supabase-server-client.ts";
import { createClientSupabaseClient } from "@/src/infrastructure/config/supabase-client-client.ts";
import type { User } from "@supabase/supabase-js";

// Define your interfaces and types here
export interface [PageItem] {
  id: string;
  name: string;
  // Add your item fields here
  createdAt: string;
  updatedAt: string;
}

export interface [PageStats] {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  // Add your stats fields here
}

export interface Create[PageItem]Data {
  name: string;
  // Add your create fields here
}

export interface Update[PageItem]Data {
  id: string;
  name: string;
  // Add your update fields here
}

export interface [PageName]ViewModel {
  user: User | null;
  items: [PageItem][];
  stats: [PageStats];
  totalCount: number;
  page: number;
  perPage: number;
  // Add your view model fields here
}

/**
 * Presenter for [PageName] management
 * Follows Clean Architecture with proper separation of concerns
 */
export class [PageName]Presenter {
  constructor(
    private readonly supabase: SupabaseClient
  ) {
  }

  /**
   * Get view model for the page
   */
  async getViewModel([paramName]: string, page: number, perPage: number): Promise<[PageName]ViewModel> {
    try {
      // Get user for authentication
      const user = await this.getUser();

      // Get data in parallel for better performance
      const [items, stats] = await Promise.all([
        this.getPaginatedItems(page, perPage),
        this.getStats()
      ]);

      return {
        user,
        items: items.data,
        stats,
        totalCount: items.total,
        page,
        perPage
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate metadata for the page
   */
  async generateMetadata([paramName]: string) {
    try {
      return {
        title: "จัดการ[PageThaiName] | Shop Queue",
        description: "ระบบจัดการ[PageThaiDescription]",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async create[PageItem](data: Create[PageItem]Data): Promise<[PageItem]> {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const item = await this.supabase.from("[page-name]").insert(data);
      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update[PageItem](id: string, data: Update[PageItem]Data): Promise<[PageItem]> {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const item = await this.supabase.from("[page-name]").update(data).eq("id", id);
      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async delete[PageItem](id: string): Promise<boolean> {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      await this.supabase.from("[page-name]").delete().eq("id", id);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async get[PageItem]ById(id: string): Promise<[PageItem]> {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const item = await this.supabase.from("[page-name]").select("*").eq("id", id);
      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get paginated items
   */
  async getPaginated[PageItems](page: number, perPage: number) {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const result = await this.supabase.from("[page-name]").select("*").order("createdAt", { ascending: false }).limit(perPage).offset((page - 1) * perPage);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get stats
   */
  async getStats() {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const result = await this.supabase.from("[page-name]").select("*").order("createdAt", { ascending: false }).limit(perPage).offset((page - 1) * perPage);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user
   */
  async getUser() {
    try {
      const user = await this.supabase.auth.getUser();
      return user;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Factory for creating [PageName]Presenter instances
 */
export class [PageName]PresenterFactory {
  static async createServer(): Promise<[PageName]Presenter> {
    const supabase = createServerSupabaseClient();
    return new [PageName]Presenter(
      supabase,
    );
  }

  static createClient(): [PageName]Presenter {
    const supabase = createClientSupabaseClient();
    return new [PageName]Presenter(
      supabase,
    );
  }
}
```

### Key Features:

- **Clean Architecture** with proper separation of concerns
- **Authentication and authorization** checks
- **CRUD operations** with proper error handling
- **Parallel data fetching** for performance
- **Factory pattern** for dependency injection
- **Server and client factories** for different environments

---

## 3. Pattern: `src/presentation/presenters/[page-name]/use[PageName]Presenter.ts`

### 3A. Pattern with Parameters (e.g., courseId, shopId)

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { [PageName]ViewModel } from "./[PageName]Presenter";
import { [PageName]PresenterFactory } from "./[PageName]Presenter";
import type { [PageItem] } from "./[PageName]Presenter";
import type { Create[PageItem]Data } from "./[PageName]Presenter";
import type { Update[PageItem]Data } from "./[PageName]Presenter";

// Initialize presenter instance once (singleton pattern)
// ไม่ต้อง await เพราะ createClient() return instance โดยตรง
const presenter = [PageName]PresenterFactory.createClient();

export interface [PageName]PresenterState {
  viewModel: [PageName]ViewModel | null;
  loading: boolean;
  error: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedItemId: string | null;
}

export interface [PageName]PresenterActions {
  loadData: () => Promise<void>;
  create[PageItem]: (data: Create[PageItem]Data) => Promise<void>;
  update[PageItem]: (data: Update[PageItem]Data) => Promise<void>;
  delete[PageItem]: (id: string) => Promise<void>;
  get[PageItem]ById: (id: string) => Promise<[PageItem]>;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (itemId: string) => void;
  closeEditModal: () => void;
  openDeleteModal: (itemId: string) => void;
  closeDeleteModal: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for [PageName] presenter
 * Provides state management and actions for [PageName] operations
 */
export function use[PageName]Presenter(
  [paramName]: string,
  initialViewModel?: [PageName]ViewModel
): [[PageName]PresenterState, [PageName]PresenterActions] {
  const [viewModel, setViewModel] = useState<[PageName]ViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel([paramName]);
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading [page-name] data:", err);
    } finally {
      setLoading(false);
    }
  }, [[paramName]]);

  /**
   * Create a new item
   */
  const create[PageItem] = useCallback(async (data: Create[PageItem]Data) => {
    setLoading(true);
    setError(null);

    try {
      await presenter.create[PageItem](data);
      setIsCreateModalOpen(false);
      await loadData(); // Refresh data after creation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error creating [page-item]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  /**
   * Update an existing item
   */
  const update[PageItem] = useCallback(async (data: Update[PageItem]Data) => {
    setLoading(true);
    setError(null);

    try {
      await presenter.update[PageItem](data.id, data);

      setIsEditModalOpen(false);
      setSelectedItemId(null);
      await loadData(); // Refresh data after update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error updating [page-item]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  /**
   * Delete an item
   */
  const delete[PageItem] = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await presenter.delete[PageItem](id);

      setIsDeleteModalOpen(false);
      setSelectedItemId(null);
      await loadData(); // Refresh data after deletion
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error deleting [page-item]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  /**
   * Get item by ID
   */
  const get[PageItem]ById = useCallback(async (id: string) => {
    try {
      return await presenter.get[PageItem]ById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error getting [page-item]:", err);
      throw err;
    }
  }, []);

  // Modal actions
  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
    setError(null);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setError(null);
  }, []);

  const openEditModal = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setIsEditModalOpen(true);
    setError(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedItemId(null);
    setError(null);
  }, []);

  const openDeleteModal = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setIsDeleteModalOpen(true);
    setError(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedItemId(null);
    setError(null);
  }, []);

  // Load data on mount or when paramName changes
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [[paramName]]);

  return [
    {
      viewModel,
      loading,
      error,
      isCreateModalOpen,
      isEditModalOpen,
      isDeleteModalOpen,
      selectedItemId,
    },
    {
      loadData,
      create[PageItem],
      update[PageItem],
      delete[PageItem],
      get[PageItem]ById,
      openCreateModal,
      closeCreateModal,
      openEditModal,
      closeEditModal,
      openDeleteModal,
      closeDeleteModal,
      setError,
    },
  ];
}
```

### 3B. Pattern with userId (Authentication Required)

**⚠️ IMPORTANT: ใช้ Zustand Store ดึง userId ใน Custom Hook, ไม่ส่งเป็น parameter**

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/src/presentation/stores/authStore";
import { [PageName]ViewModel } from "./[PageName]Presenter";
import { [PageName]PresenterFactory } from "./[PageName]Presenter";
import type { [PageItem] } from "./[PageName]Presenter";
import type { Create[PageItem]Data } from "./[PageName]Presenter";
import type { Update[PageItem]Data } from "./[PageName]Presenter";

// Initialize presenter instance once (singleton pattern)
const presenter = [PageName]PresenterFactory.createClient();

export interface [PageName]PresenterState {
  viewModel: [PageName]ViewModel | null;
  loading: boolean;
  error: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedItemId: string | null;
}

export interface [PageName]PresenterActions {
  loadData: () => Promise<void>;
  create[PageItem]: (data: Create[PageItem]Data) => Promise<void>;
  update[PageItem]: (data: Update[PageItem]Data) => Promise<void>;
  delete[PageItem]: (id: string) => Promise<void>;
  get[PageItem]ById: (id: string) => Promise<[PageItem]>;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (itemId: string) => void;
  closeEditModal: () => void;
  openDeleteModal: (itemId: string) => void;
  closeDeleteModal: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for [PageName] presenter with authentication
 * ✅ ใช้ useAuthStore() ดึง userId แทนการรับเป็น parameter
 */
export function use[PageName]Presenter(
  initialViewModel?: [PageName]ViewModel
): [[PageName]PresenterState, [PageName]PresenterActions] {
  const { user } = useAuthStore(); // ดึง user จาก Zustand store
  const [viewModel, setViewModel] = useState<[PageName]ViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  /**
   * Load data from presenter using userId from store
   */
  const loadData = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel(user.id);
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading [page-name] data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create a new item
   */
  const create[PageItem] = useCallback(async (data: Create[PageItem]Data) => {
    setLoading(true);
    setError(null);

    try {
      await presenter.create[PageItem](data);
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error creating [page-item]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  /**
   * Update an existing item
   */
  const update[PageItem] = useCallback(async (data: Update[PageItem]Data) => {
    setLoading(true);
    setError(null);

    try {
      await presenter.update[PageItem](data.id, data);
      setIsEditModalOpen(false);
      setSelectedItemId(null);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error updating [page-item]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  /**
   * Delete an item
   */
  const delete[PageItem] = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await presenter.delete[PageItem](id);
      setIsDeleteModalOpen(false);
      setSelectedItemId(null);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error deleting [page-item]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  /**
   * Get item by ID
   */
  const get[PageItem]ById = useCallback(async (id: string) => {
    try {
      return await presenter.get[PageItem]ById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error getting [page-item]:", err);
      throw err;
    }
  }, []);

  // Modal actions
  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
    setError(null);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setError(null);
  }, []);

  const openEditModal = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setIsEditModalOpen(true);
    setError(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedItemId(null);
    setError(null);
  }, []);

  const openDeleteModal = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setIsDeleteModalOpen(true);
    setError(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedItemId(null);
    setError(null);
  }, []);

  // Load data on mount or when user changes
  useEffect(() => {
    if (!initialViewModel && user?.id) {
      loadData();
    }
  }, [user?.id, initialViewModel, loadData]);

  return [
    {
      viewModel,
      loading,
      error,
      isCreateModalOpen,
      isEditModalOpen,
      isDeleteModalOpen,
      selectedItemId,
    },
    {
      loadData,
      create[PageItem],
      update[PageItem],
      delete[PageItem],
      get[PageItem]ById,
      openCreateModal,
      closeCreateModal,
      openEditModal,
      closeEditModal,
      openDeleteModal,
      closeDeleteModal,
      setError,
    },
  ];
};
```

### Key Features:

- **Pattern 3A**: รับ `[paramName]` parameter สำหรับ dynamic routes
- **Pattern 3B**: ใช้ `useAuthStore()` ดึง `userId` แทนการรับเป็น parameter
- **Singleton pattern**: สร้าง presenter instance ครั้งเดียวนอก hook
- **State and actions separation**: แยก state และ actions เป็น tuple
- **CRUD operations** with validation and error handling
- **Modal state management** for create/edit/delete operations
- **Initial data support** from server component
- **Type safety** with TypeScript interfaces
- **Auto-load data** on mount or when dependencies change

---

## 4. Pattern: `src/presentation/components/[page-name]/[PageName]View.tsx`

```typescript
"use client";

import { [PageName]ViewModel } from "@/src/presentation/presenters/[page-name]/[PageName]Presenter";
import { use[PageName]Presenter } from "@/src/presentation/presenters/[page-name]/use[PageName]Presenter";
import { useState } from "react";

interface [PageName]ViewProps {
  [paramName]: string;
  initialViewModel?: [PageName]ViewModel;
}

export function [PageName]View({ [paramName], initialViewModel }: [PageName]ViewProps) {
  const [state, actions] = use[PageName]Presenter([paramName], initialViewModel);
  const [searchTerm, setSearchTerm] = useState("");
  const viewModel = state.viewModel;

  // Helper functions
  const formatStatus = (status: string) => {
    switch (status) {
      case "active":
        return "ใช้งาน";
      case "inactive":
        return "ไม่ใช้งาน";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Show loading only on initial load or when explicitly loading
  if (state.loading && !viewModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                กำลังโหลดข้อมูล[PageThaiName]...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error but we have no data
  if (state.error && !viewModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                เกิดข้อผิดพลาด
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {state.error}
              </p>
              <button
                onClick={actions.loadData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have no view model and not loading, show empty state
  if (!viewModel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                ยังไม่มีข้อมูล[PageThaiName]
              </p>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                ข้อมูล[PageThaiName]จะแสดงที่นี่เมื่อมีการสร้าง[PageThaiName]
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            จัดการ[PageThaiName]
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ระบบจัดการ[PageThaiDescription]
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={actions.openCreateModal}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            เพิ่ม[PageThaiName]
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ทั้งหมด
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {viewModel.stats.totalItems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ใช้งาน
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {viewModel.stats.activeItems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ไม่ใช้งาน
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {viewModel.stats.inactiveItems}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              รายการ[PageThaiName]
            </h2>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="ค้นหา..."
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ชื่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  รายละเอียด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {viewModel.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        item.isActive ? "active" : "inactive"
                      )}`}
                    >
                      {formatStatus(item.isActive ? "active" : "inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => actions.openEditModal(item.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => actions.openDeleteModal(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {viewModel.items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
              ยังไม่มีข้อมูล[PageThaiName]
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              ข้อมูล[PageThaiName]จะแสดงที่นี่เมื่อมีการสร้าง[PageThaiName]
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {viewModel.totalCount > viewModel.perPage && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => actions.setCurrentPage(viewModel.currentPage - 1)}
              disabled={viewModel.currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              ก่อนหน้า
            </button>
            <span className="px-4 py-2">
              หน้า {viewModel.currentPage} จาก {Math.ceil(viewModel.totalCount / viewModel.perPage)}
            </span>
            <button
              onClick={() => actions.setCurrentPage(viewModel.currentPage + 1)}
              disabled={viewModel.currentPage === Math.ceil(viewModel.totalCount / viewModel.perPage)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state.error && viewModel && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{state.error}</span>
            <button
              onClick={() => actions.setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Key Features:

- **Client component** with "use client" directive
- **Presenter hook integration** for state and actions
- **Loading, error, and empty states** with proper UX
- **Statistics cards** for data overview
- **Data table** with sorting and filtering
- **Pagination** support
- **Modal triggers** for CRUD operations
- **Responsive design** with Tailwind CSS
- **Thai language localization**
- **Error handling** with toast notifications

---

## Usage Instructions

### 1. Replace Placeholders

Replace all placeholders in the templates:

- `[PageName]` - PascalCase page name (e.g., `Customers`)
- `[page-name]` - kebab-case page name (e.g., `customers`)
- `[PageItem]` - PascalCase item name (e.g., `Customer`)
- `[page-item]` - kebab-case item name (e.g., `customer`)
- `[PageThaiName]` - Thai name for the page (e.g., `ลูกค้า`)
- `[PageThaiDescription]` - Thai description (e.g., `จัดการข้อมูลลูกค้าในระบบ`)
- `[PageStats]` - Stats interface name (e.g., `CustomerStats`)
- `[PageFilters]` - Filters interface name (e.g., `CustomerFilters`)

### 2. Create Required Files

Create the following files in their respective directories:

```

app/[page-path]/page.tsx
src/presentation/presenters/[page-name]/[PageName]Presenter.ts
src/presentation/presenters/[page-name]/use[PageName]Presenter.ts
src/presentation/components/[page-name]/[PageName]View.tsx

```

---

## Best Practices

### 1. Clean Architecture

- Follow the established layer separation
- Use dependency injection for all services
- Keep business logic in the application layer
- Use interfaces for all dependencies

### 2. Error Handling

- Implement comprehensive error handling
- Provide user-friendly error messages
- Use fallback UI when needed

### 3. Performance

- Use parallel data fetching with `Promise.all`
- Implement proper loading states
- Use dynamic imports for code splitting
- Optimize re-renders with proper state management

### 4. User Experience

- Provide loading indicators
- Show empty states with helpful messages
- Implement proper error recovery
- Use consistent Thai language localization
- Ensure responsive design

### 5. Type Safety

- Use TypeScript interfaces for all data structures
- Implement proper validation
- Use enums for status values
- Ensure type safety throughout the application

---

## Example Implementation (Optional)

For a complete example, refer to any existing page implementation in the codebase, such as:

- `app/[page-path]/page.tsx`
- `src/presentation/presenters/[page-name]/[PageName]Presenter.ts`
- `src/presentation/presenters/[page-name]/use[PageName]Presenter.ts`
- `src/presentation/components/[page-name]/[PageName]View.tsx`

---

## Testing (Optional)

Ensure comprehensive testing:

1. **Unit tests** for presenters and hooks
2. **Integration tests** for services and repositories
3. **E2E tests** for user flows
4. **Accessibility tests** for UI components
5. **Performance tests** for data loading

---

This pattern ensures consistency across all backend pages while maintaining Clean Architecture principles and providing excellent user experience.
```
