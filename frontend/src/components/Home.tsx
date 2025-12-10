import React, { useMemo } from 'react';
import { Star, Shield, Truck, Award, ArrowRight } from 'lucide-react';
import type { CatalogGroup } from '../api/catalog';
import { selectCatalogGradient } from '../utils/catalogFormatting';

interface HomeProps {
  setCurrentView: (view: string) => void;
  openCatalog: (groupId?: string | null) => void;
  groups: CatalogGroup[];
  groupsLoading: boolean;
  groupsError: string | null;
}

const CATEGORY_GRADIENTS = [
  'from-blue-900 via-blue-800 to-blue-600',
  'from-indigo-900 via-purple-800 to-purple-600',
  'from-emerald-700 via-green-600 to-lime-500',
  'from-rose-600 via-pink-500 to-orange-400',
  'from-slate-800 via-slate-700 to-slate-600',
  'from-amber-500 via-yellow-500 to-orange-500',
];

const CATEGORY_SKELETON_COUNT = 6;

export const Home: React.FC<HomeProps> = ({
  setCurrentView,
  openCatalog,
  groups,
  groupsLoading,
  groupsError,
}) => {
  const sortedGroups = useMemo(() => {
    const filtered = groups.filter((group) => group.parent_id);
    const base = filtered.length > 0 ? filtered : groups;
    return [...base].sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
  }, [groups]);

  const skeletonPlaceholders = useMemo(
    () => Array.from({ length: CATEGORY_SKELETON_COUNT }, (_, index) => index),
    []
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <img src="/public/IMG_1060.PNG" alt="Cultura Shop" className="w-[550px] h-auto mx-auto mb-4" />
            </div>
            <p className="text-xl md:text-2xl mb-[60px] text-blue-100">
              Приходи к нам в Урам парк или заказывай прямо сейчас!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => openCatalog()}
                className="bg-white text-blue-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all shadow-lg"
              >
                Смотреть каталог
              </button>
              <button
                onClick={() => setCurrentView('certificates')}
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-900 transform hover:scale-105 transition-all"
              >
                Подарочные сертификаты
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Наши категории</h2>
          {groupsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {skeletonPlaceholders.map((placeholder) => (
                <div
                  key={placeholder}
                  className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse h-44 sm:h-52"
                >
                  <div className="absolute inset-0 bg-white/40" />
                </div>
              ))}
            </div>
          ) : groupsError ? (
            <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center text-sm">
              {groupsError}
            </div>
          ) : sortedGroups.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-200 text-gray-600 rounded-xl p-4 text-center text-sm">
              Категории пока не найдены.
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={() => openCatalog()}
                  className="px-6 py-3 rounded-full bg-blue-900 text-white text-sm font-semibold shadow-md hover:bg-blue-800 transition-colors"
                >
                  Смотреть весь каталог
                </button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedGroups.map((group) => {
                  const gradient =
                    selectCatalogGradient(group.id, CATEGORY_GRADIENTS) || CATEGORY_GRADIENTS[0];
                  const trimmedName = group.name.trim();
                  const initials = trimmedName ? trimmedName.slice(0, 2).toUpperCase() : '—';

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => openCatalog(group.id)}
                      className="group relative overflow-hidden rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                      <div className="relative p-6 flex flex-col h-full text-white gap-6">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-semibold uppercase">
                          {initials}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                          <p className="text-sm text-white/80">Товары этой категории</p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-white/70">
                          <span>Перейти в каталог</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Exclusive Products Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full font-bold text-lg mb-6">
              ⭐ ЭКСКЛЮЗИВНЫЕ ТОВАРЫ
            </div>
            <h2 className="text-4xl font-bold mb-6">Эксклюзивно в нашем магазине</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Уникальные товары от ведущих мировых брендов, доступные исключительно в Cultura Shop
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                src: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400',
                title: 'BMX Cult Gateway 2024',
                brand: 'Cult',
                price: '45,000 ₽',
                oldPrice: '52,000 ₽',
              },
              {
                src: 'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=400',
                title: 'Ethic Erawan V2',
                brand: 'Ethic',
                price: '28,000 ₽',
                oldPrice: '32,000 ₽',
              },
              {
                src: 'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=400',
                title: 'Худи SV Classic',
                brand: 'SV',
                price: '4,500 ₽',
              },
              {
                src: 'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
                title: 'Наколенники 187 Pro',
                brand: '187',
                price: '3,800 ₽',
              },
            ].map((product) => (
              <div
                key={product.title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all transform hover:scale-105"
              >
                <div className="relative mb-4">
                  <img src={product.src} alt={product.title} className="w-full h-40 object-cover rounded-lg" />
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    Эксклюзив
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                <p className="text-gray-300 text-sm mb-3">{product.brand}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-yellow-400">{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">{product.oldPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => openCatalog()}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all shadow-lg"
            >
              Смотреть все эксклюзивы
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Готов к экстриму?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Присоединяйся к сообществу райдеров и получи эксклюзивные товары
          </p>
          <button
            onClick={() => openCatalog()}
            className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all shadow-lg"
          >
            Начать покупки
          </button>
        </div>
      </section>
    </div>
  );
};
