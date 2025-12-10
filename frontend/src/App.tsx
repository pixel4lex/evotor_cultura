import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { Catalog } from "./components/Catalog";
import { Gallery } from "./components/Gallery";
import { Cart } from "./components/Cart";
import { Auth } from "./components/Auth";
import { Certificates } from "./components/Certificates";
import { Profile } from "./components/Profile";
import { CheckoutForm } from "./components/CheckoutForm";
import { Admin } from "./components/Admin";
import { fetchCurrentUser, type TokenBundle } from "./api/auth";
import {
  fetchCatalogGroups,
  fetchCatalogItems,
  type CatalogGroup,
  type CatalogItem,
} from "./api/catalog";
import { clearAuthStorage, getStoredAuth, saveAuth } from "./utils/authStorage";
import { normalizeSupabaseUser, type AppUser } from "./utils/user";
import {
  buildPlaceholderImage,
  formatPrice,
  formatQuantity,
} from "./utils/catalogFormatting";

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  brand: string;
  quantity: number;
}

const SEARCH_PAGE_SIZE = 100;

type AppView =
  | "home"
  | "catalog"
  | "gallery"
  | "cart"
  | "auth"
  | "certificates"
  | "profile"
  | "checkout"
  | "admin"
  | "search-results";

const ADMIN_PATH = "/admin";

const getViewFromPath = (pathname: string): AppView => {
  if (pathname === ADMIN_PATH) {
    return "admin";
  }
  return "home";
};

const getPathFromView = (view: AppView): string => {
  if (view === "admin") {
    return ADMIN_PATH;
  }
  return "/";
};

function App() {
  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    if (typeof window !== "undefined") {
      return getViewFromPath(window.location.pathname);
    }
    return "home";
  });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [authTokens, setAuthTokens] = useState<TokenBundle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [catalogGroupId, setCatalogGroupId] = useState<string | null>(null);
  const [catalogGroups, setCatalogGroups] = useState<CatalogGroup[]>([]);
  const [catalogGroupsLoading, setCatalogGroupsLoading] = useState(false);
  const [catalogGroupsError, setCatalogGroupsError] = useState<string | null>(null);
  const searchRequestIdRef = useRef(0);

  const setCurrentView = useCallback((view: AppView) => {
    if (typeof window !== "undefined") {
      const nextPath = getPathFromView(view);
      if (window.location.pathname !== nextPath) {
        window.history.pushState(null, "", nextPath);
      }
    }
    setCurrentViewState(view);
  }, [setCurrentViewState]);

  const openCatalog = useCallback(
    (groupId: string | null = null) => {
      setCatalogGroupId(groupId);
      setCurrentView("catalog");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setCurrentView]
  );

  useEffect(() => {
    let isMounted = true;

    const loadGroups = async () => {
      setCatalogGroupsLoading(true);
      setCatalogGroupsError(null);

      try {
        const response = await fetchCatalogGroups();
        if (!isMounted) {
          return;
        }
        const sorted = [...response].sort((a, b) =>
          a.name.localeCompare(b.name, "ru", { sensitivity: "base" })
        );
        setCatalogGroups(sorted);
      } catch (err) {
        if (isMounted) {
          console.error("Не удалось загрузить список категорий", err);
          const message =
            err instanceof Error ? err.message : "Не удалось загрузить категории. Попробуйте позже.";
          setCatalogGroupsError(message);
        }
      } finally {
        if (isMounted) {
          setCatalogGroupsLoading(false);
        }
      }
    };

    loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      setCurrentViewState(getViewFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setCurrentViewState]);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      return;
    }

    const tokens: TokenBundle = {
      access_token: stored.accessToken,
      refresh_token: stored.refreshToken ?? null,
    };

    setAuthTokens(tokens);
    setUser(stored.user);

    const verifyUser = async () => {
      try {
        const response = await fetchCurrentUser(stored.accessToken);
        const normalizedUser = normalizeSupabaseUser(response.user, stored.user);
        setUser(normalizedUser);
        saveAuth({ user: normalizedUser, tokens });
      } catch (error) {
        console.error("Не удалось обновить данные пользователя", error);
        clearAuthStorage();
        setAuthTokens(null);
        setUser(null);
      }
    };

    verifyUser();
  }, []);

  const handleAuthTokens = (tokens: TokenBundle) => {
    setAuthTokens(tokens);
  };

  const handleUserLogin = (nextUser: AppUser) => {
    setUser(nextUser);
  };

  const handleUserUpdate = (nextUser: AppUser) => {
    setUser(nextUser);
    if (authTokens) {
      saveAuth({ user: nextUser, tokens: authTokens });
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    if (authTokens) {
      setAuthTokens(null);
    }
    setUser(null);
  };

  const addToCart = (product: any) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartItem = (id: number | string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: number | string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSearch = async (query?: string) => {
    const effectiveQuery = typeof query === "string" ? query : searchQuery;
    setSearchQuery(effectiveQuery);

    const trimmedQuery = effectiveQuery.trim();
    if (!trimmedQuery) {
      setLastSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    setLastSearchQuery(trimmedQuery);
    setCurrentView("search-results");
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const firstPage = await fetchCatalogItems({
        page: 1,
        pageSize: SEARCH_PAGE_SIZE,
        search: trimmedQuery,
      });

      if (searchRequestIdRef.current !== requestId) {
        return;
      }

      let collected = [...firstPage.items];
      const totalPages = Math.max(firstPage.total_pages ?? 1, 1);

      for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
        if (searchRequestIdRef.current !== requestId) {
          break;
        }
        const pageResponse = await fetchCatalogItems({
          page: nextPage,
          pageSize: SEARCH_PAGE_SIZE,
          search: trimmedQuery,
        });
        if (searchRequestIdRef.current !== requestId) {
          break;
        }
        collected = collected.concat(pageResponse.items);
      }

      if (searchRequestIdRef.current === requestId) {
        setSearchResults(collected);
      }
    } catch (error) {
      console.error("Не удалось выполнить поиск по каталогу", error);
      if (searchRequestIdRef.current === requestId) {
        setSearchError("Не удалось выполнить поиск. Попробуйте ещё раз.");
      }
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setSearchLoading(false);
      }
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "home":
        return (
          <Home
            setCurrentView={setCurrentView}
            openCatalog={openCatalog}
            groups={catalogGroups}
            groupsLoading={catalogGroupsLoading}
            groupsError={catalogGroupsError}
          />
        );
      case "catalog":
        return (
          <Catalog
            setCurrentView={setCurrentView}
            addToCart={addToCart}
            user={user}
            groups={catalogGroups}
            groupsLoading={catalogGroupsLoading}
            groupsError={catalogGroupsError}
            groupId={catalogGroupId}
            onGroupChange={setCatalogGroupId}
          />
        );
      case "gallery":
        return <Gallery setCurrentView={setCurrentView} />;
      case "cart":
        return (
          <Cart
            setCurrentView={setCurrentView}
            openCatalog={openCatalog}
            cartItems={cartItems}
            updateCartItem={updateCartItem}
            removeFromCart={removeFromCart}
            user={user}
          />
        );
      case "auth":
        return (
          <Auth
            setCurrentView={setCurrentView}
            setUser={handleUserLogin}
            setAuthTokens={handleAuthTokens}
          />
        );
      case "profile":
        return (
          <Profile
            setCurrentView={setCurrentView}
            user={user}
            setUser={handleUserUpdate}
            authTokens={authTokens}
          />
        );
      case "certificates":
        return <Certificates setCurrentView={setCurrentView} addToCart={addToCart} />;
      case "checkout":
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setCurrentView("cart")}
                  className="flex items-center text-blue-900 hover:text-blue-700 mr-4"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Назад к корзине
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Оформление заказа</h1>
              </div>
              <CheckoutForm
                user={user}
                authTokens={authTokens}
                setUser={handleUserUpdate}
                cartItems={cartItems}
                setCurrentView={setCurrentView}
                removeFromCart={removeFromCart}
              />
            </div>
          </div>
        );
      case "admin":
        return (
          <Admin
            setCurrentView={setCurrentView}
            authTokens={authTokens}
            user={user}
          />
        );
      case "search-results":
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Результаты поиска: "{lastSearchQuery}"
              </h1>
              {searchLoading ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Идёт поиск по каталогу...</span>
                </div>
              ) : searchError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                  {searchError}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((item) => (
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
                            {item.group_name || "Без категории"}
                          </p>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col gap-4 flex-1">
                        <div className="text-sm text-gray-600">
                          В наличии: {formatQuantity(item.quantity, item.measure_name)}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-2xl font-bold text-blue-900">
                            {formatPrice(item.price)} ₽
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              addToCart({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: buildPlaceholderImage(item.id, item.name),
                                brand: item.group_name ?? "Evotor",
                              })
                            }
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
              ) : (
                <p className="text-gray-600">
                  По запросу "{lastSearchQuery}" товары не найдены.
                </p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <Home
            setCurrentView={setCurrentView}
            openCatalog={openCatalog}
            groups={catalogGroups}
            groupsLoading={catalogGroupsLoading}
            groupsError={catalogGroupsError}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        openCatalog={openCatalog}
        cartItems={cartItems}
        user={user}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        searchLoading={searchLoading}
      />
      {renderCurrentView()}
    </div>
  );
}

export default App;







