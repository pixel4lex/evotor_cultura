import React, { useState } from "react";
import { Loader2, Menu, Search, ShoppingCart, User, X } from "lucide-react";

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openCatalog: (groupId?: string | null) => void;
  cartItems: any[];
  user: any;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  searchLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  openCatalog,
  cartItems,
  user,
  onLogout,
  searchQuery,
  setSearchQuery,
  onSearch,
  searchLoading,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLoading) {
      return;
    }
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    setCurrentView("home");
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView("home")}
              className="flex items-center"
            >
              <img
                src="/src/images/IMG_1060.PNG"
                alt="Cultura Shop"
                className="h-10 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => openCatalog()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "catalog"
                  ? "text-blue-900 bg-blue-50"
                  : "text-gray-700 hover:text-blue-900"
              }`}
            >
              Каталог
            </button>
            <button
              onClick={() => setCurrentView("certificates")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "certificates"
                  ? "text-blue-900 bg-blue-50"
                  : "text-gray-700 hover:text-blue-900"
              }`}
            >
              Сертификаты
            </button>
            <button
              onClick={() => setCurrentView("gallery")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "gallery"
                  ? "text-blue-900 bg-blue-50"
                  : "text-gray-700 hover:text-blue-900"
              }`}
            >
              Галерея
            </button>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center max-w-md mx-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className={`ml-2 px-4 py-2 rounded-lg transition-colors ${
                searchLoading
                  ? "bg-blue-200 text-white cursor-not-allowed"
                  : "bg-blue-900 text-white hover:bg-blue-800"
              }`}
            >
              {searchLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Найти"
              )}
            </button>
          </form>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView("cart")}
              className="relative p-2 text-gray-700 hover:text-blue-900 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors">
                  <User className="h-6 w-6" />
                  <span className="hidden md:block">{user.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => setCurrentView("profile")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Личный кабинет
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView("auth")}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors"
              >
                <User className="h-6 w-6" />
                <span className="hidden md:block">Войти</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-900"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск товаров..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className={`mt-2 w-full px-4 py-2 rounded-lg transition-colors ${
                  searchLoading
                    ? "bg-blue-200 text-white cursor-not-allowed"
                    : "bg-blue-900 text-white hover:bg-blue-800"
                }`}
              >
                {searchLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Найти"
                )}
              </button>
            </form>
            <div className="space-y-2">
              <button
                onClick={() => {
                  openCatalog();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-900"
              >
                Каталог
              </button>
              <button
                onClick={() => {
                  setCurrentView("certificates");
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-900"
              >
                Сертификаты
              </button>
              <button
                onClick={() => {
                  setCurrentView("gallery");
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-900"
              >
                Галерея
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
