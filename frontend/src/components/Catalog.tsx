import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShoppingCart,
} from 'lucide-react';

import { fetchCatalogItems, type CatalogGroup, type CatalogItem } from '../api/catalog';
import {
  buildPlaceholderImage,
  formatPrice,
  formatQuantity,
} from '../utils/catalogFormatting';

interface CartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
}

interface CatalogProps {
  setCurrentView: (view: string) => void;
  addToCart: (product: CartProduct) => void;
  user: any;
  groups: CatalogGroup[];
  groupsLoading: boolean;
  groupsError?: string | null;
  groupId?: string | null;
  onGroupChange?: (groupId: string | null) => void;
}

const PAGE_SIZE = 20;

const emptyState = (
  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
    <h2 className="text-2xl font-semibold text-gray-900 mb-3">Товары не найдены</h2>
    <p className="text-gray-600">Похоже, что на складе сейчас нет товаров для отображения.</p>
  </div>
);

export const Catalog: React.FC<CatalogProps> = ({
  setCurrentView,
  addToCart,
  user: _user,
  groups,
  groupsLoading,
  groupsError,
  groupId = null,
  onGroupChange,
}) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selectedGroup, setSelectedGroupState] = useState<string | null>(groupId);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGroupState(groupId ?? null);
    setPage(1);
  }, [groupId]);

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchCatalogItems({
          page,
          pageSize: PAGE_SIZE,
          groupId: selectedGroup ?? undefined,
        });

        if (!isMounted) {
          return;
        }

        setItems(response.items);
        setTotalPages(response.total_pages);
        setTotalItems(response.total);
      } catch (err: unknown) {
        console.error('Не удалось загрузить товары', err);
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Не удалось загрузить товары. Попробуйте позже.';
          setError(message);
          setItems([]);
          setTotalPages(0);
          setTotalItems(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [page, selectedGroup]);

  const sortedGroups = useMemo(() => {
    if (!groups.length) {
      return [];
    }
    const filtered = groups.filter((group) => group.parent_id);
    const base = filtered.length > 0 ? filtered : groups;
    return [...base].sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
  }, [groups]);

  useEffect(() => {
    if (!selectedGroup || sortedGroups.length === 0) {
      return;
    }

    const exists = sortedGroups.some((group) => group.id === selectedGroup);
    if (!exists) {
      setSelectedGroupState(null);
      onGroupChange?.(null);
      setPage(1);
    }
  }, [sortedGroups, selectedGroup, onGroupChange]);

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupState((current) => {
      const nextGroupId = current === groupId ? null : groupId;
      if (nextGroupId !== current) {
        setPage(1);
      }
      onGroupChange?.(nextGroupId);
      return nextGroupId;
    });
  };

  const handleAddToCart = (item: CatalogItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: buildPlaceholderImage(item.id, item.name),
      brand: item.group_name ?? 'Evotor',
    });
  };

  const canGoPrev = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  const activeGroupName = useMemo(() => {
    if (!selectedGroup) {
      return null;
    }
    return sortedGroups.find((group) => group.id === selectedGroup)?.name ?? null;
  }, [sortedGroups, selectedGroup]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center text-blue-900 hover:text-blue-700 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              На главную
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Каталог товаров</h1>
              <p className="text-sm text-gray-500">
                {selectedGroup && activeGroupName
                  ? `Категория: ${activeGroupName}`
                  : 'Показаны все доступные товарные позиции Evotor'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {loading ? 'Загрузка...' : `Найдено: ${totalItems.toLocaleString('ru-RU')} товаров`}
          </div>
        </div>

        {groupsLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 w-28 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : groupsError ? (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-6 text-sm">
            {groupsError}
          </div>
        ) : sortedGroups.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {sortedGroups.map((group) => {
                const isSelected = selectedGroup === group.id;
                return (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    {group.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-semibold">Что-то пошло не так</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 text-blue-900 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          emptyState
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col"
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
                    <img
                      src={buildPlaceholderImage(item.id, item.name)}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="relative z-10 text-white text-center px-4">
                      <p className="text-sm uppercase tracking-widest text-blue-100">
                        {item.group_name || 'Без категории'}
                      </p>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="text-sm text-gray-500">
                      В наличии: {formatQuantity(item.quantity, item.measure_name)}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-2xl font-bold text-blue-900">
                        {formatPrice(item.price)} ₽
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  Страница {page} из {totalPages}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => canGoPrev && setPage((prev) => Math.max(1, prev - 1))}
                    disabled={!canGoPrev}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      canGoPrev
                        ? 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Назад
                  </button>
                  <button
                    onClick={() => canGoNext && setPage((prev) => prev + 1)}
                    disabled={!canGoNext}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      canGoNext
                        ? 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Вперёд
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
