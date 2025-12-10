import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Package,
  Lock,
} from "lucide-react";
import {
  updateProfile,
  type TokenBundle,
  type UpdateProfilePayload,
} from "../api/auth";
import { ApiRequestError } from "../api/client";
import { fetchMyOrders, type OrderRecord } from "../api/orders";
import { updateStoredUser } from "../utils/authStorage";
import {
  normalizeSupabaseUser,
  type AppUser,
  type UserAddress,
} from "../utils/user";
type MessageState = {
  error: string | null;
  success: string | null;
};
interface ProfileProps {
  setCurrentView: (view: string) => void;
  user: AppUser | null;
  setUser: (user: AppUser) => void;
  authTokens: TokenBundle | null;
}
interface AddressDraft {
  title: string;
  city: string;
  address: string;
  isDefault: boolean;
}
const toApiAddresses = (addresses: UserAddress[]) =>
  addresses.map((address) => ({
    id: address.id,
    title: address.title,
    city: address.city,
    address: address.address,
    is_default: Boolean(address.isDefault),
  }));
export const Profile: React.FC<ProfileProps> = ({
  setCurrentView,
  user,
  setUser,
  authTokens,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<MessageState>({
    error: null,
    success: null,
  });
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    newPassword: "",
    confirmPassword: "",
  });
  const [newAddress, setNewAddress] = useState<AddressDraft>({
    title: "",
    city: "",
    address: "",
    isDefault: false,
  });
  useEffect(() => {
    if (!user) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }));
  }, [user]);
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }
    if (!authTokens?.access_token) {
      setOrderHistory([]);
      setOrdersLoading(false);
      setOrdersError(
        "Необходимо войти в аккаунт, чтобы просматривать историю заказов.",
      );
      return;
    }
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const fetchedOrders = await fetchMyOrders(authTokens.access_token);
        if (!cancelled) {
          setOrderHistory(fetchedOrders);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiRequestError) {
            setOrdersError(error.message);
          } else if (error instanceof Error) {
            setOrdersError(
              error.message || "Не удалось получить историю заказов.",
            );
          } else {
            setOrdersError("Не удалось получить историю заказов.");
          }
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };
    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [activeTab, authTokens?.access_token]);
  const withPersistedUpdate = async (
    payload: UpdateProfilePayload,
    successMessage: string,
    fallbackOverrides: Partial<AppUser> = {},
  ) => {
    if (!user || !authTokens?.access_token) {
      setMessages({
        error: "Необходимо войти в аккаунт, чтобы изменить профиль.",
        success: null,
      });
      return null;
    }
    setIsSaving(true);
    setMessages({ error: null, success: null });
    try {
      const response = await updateProfile(authTokens.access_token, payload);
      const normalizedUser = normalizeSupabaseUser(response.user, {
        name: fallbackOverrides.name ?? user.name,
        email: fallbackOverrides.email ?? user.email,
        phone: fallbackOverrides.phone ?? user.phone,
        addresses: fallbackOverrides.addresses ?? user.addresses,
      });
      setUser(normalizedUser);
      updateStoredUser(normalizedUser);
      setFormData({
        name: normalizedUser.name,
        email: normalizedUser.email,
        phone: normalizedUser.phone,
        newPassword: "",
        confirmPassword: "",
      });
      setMessages({ error: null, success: successMessage });
      return normalizedUser;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setMessages({ error: error.message, success: null });
      } else if (error instanceof Error) {
        setMessages({
          error: error.message || "Не удалось обновить профиль",
          success: null,
        });
      } else {
        setMessages({ error: "Не удалось обновить профиль", success: null });
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      setMessages({ error: "Пароли не совпадают", success: null });
      return;
    }
    const payload: UpdateProfilePayload = {
      full_name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };
    if (formData.newPassword) {
      payload.password = formData.newPassword;
    }
    const fallback: Partial<AppUser> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };
    const updated = await withPersistedUpdate(
      payload,
      "Профиль обновлен",
      fallback,
    );
    if (updated) {
      setIsEditing(false);
    }
  };
  const handleAddAddress = async () => {
    if (!user) {
      return;
    }
    const trimmedTitle = newAddress.title.trim();
    const trimmedCity = newAddress.city.trim();
    const trimmedAddress = newAddress.address.trim();
    if (!trimmedTitle || !trimmedCity || !trimmedAddress) {
      setMessages({ error: "Заполните все поля адреса", success: null });
      return;
    }
    const generatedId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`;
    const preparedAddresses: UserAddress[] = (user.addresses ?? []).map(
      (addr) => (newAddress.isDefault ? { ...addr, isDefault: false } : addr),
    );
    preparedAddresses.push({
      id: generatedId,
      title: trimmedTitle,
      city: trimmedCity,
      address: trimmedAddress,
      isDefault: newAddress.isDefault,
    });
    const payload: UpdateProfilePayload = {
      addresses: toApiAddresses(preparedAddresses),
    };
    const fallback: Partial<AppUser> = {
      addresses: preparedAddresses,
    };
    const updated = await withPersistedUpdate(
      payload,
      "Адрес добавлен",
      fallback,
    );
    if (updated) {
      setNewAddress({ title: "", city: "", address: "", isDefault: false });
      setShowAddAddress(false);
    }
  };
  const handleDeleteAddress = async (addressId: string) => {
    if (!user) {
      return;
    }
    const nextAddresses = user.addresses.filter(
      (addr) => addr.id !== addressId,
    );
    const payload: UpdateProfilePayload = {
      addresses: toApiAddresses(nextAddresses),
    };
    const fallback: Partial<AppUser> = {
      addresses: nextAddresses,
    };
    await withPersistedUpdate(payload, "Адрес удален", fallback);
  };
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) {
      return;
    }
    const nextAddresses = user.addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));
    const payload: UpdateProfilePayload = {
      addresses: toApiAddresses(nextAddresses),
    };
    const fallback: Partial<AppUser> = {
      addresses: nextAddresses,
    };
    await withPersistedUpdate(payload, "Адрес обновлен", fallback);
  };
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 mb-6">
            Для доступа к личному кабинету необходимо войти в аккаунт
          </p>
          <button
            onClick={() => setCurrentView("auth")}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            Войти в аккаунт
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentView("home")}
            className="flex items-center text-blue-900 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            На главную
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
        </div>
        {messages.error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
            {messages.error}
          </div>
        )}
        {messages.success && (
          <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-green-700">
            {messages.success}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${activeTab === "profile"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Профиль
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors border-l border-gray-200 ${activeTab === "addresses"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Адреса доставки
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors border-l border-gray-200 ${activeTab === "orders"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Заказы
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === "profile" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Личные данные
                    </h2>
                    <p className="text-gray-500">
                      Обновите информацию вашего аккаунта
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setMessages({ error: null, success: null });
                    }}
                    className="flex items-center text-blue-900 hover:text-blue-700"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {isEditing ? "Отменить" : "Редактировать"}
                  </button>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Имя и фамилия
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Введите ваше имя"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Введите ваш email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="+7 (999) 123-45-67"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Новый пароль
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newPassword: e.target.value,
                            })
                          }
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Оставьте пустым, если не нужно менять"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Подтверждение пароля
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Повторите новый пароль"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={!isEditing || isSaving}
                    className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                </div>
              </div>
            )}
            {activeTab === "addresses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Адреса доставки
                    </h2>
                    <p className="text-gray-500">
                      Добавьте или обновите адреса для доставки заказов
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddAddress(!showAddAddress);
                      setMessages({ error: null, success: null });
                    }}
                    className="flex items-center text-blue-900 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showAddAddress ? "Отменить" : "Добавить адрес"}
                  </button>
                </div>
                {showAddAddress && (
                  <div className="mb-6 border border-gray-200 rounded-lg p-5 bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4">Новый адрес</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Название адреса (дом, офис)"
                        value={newAddress.title}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Город"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        placeholder="Адрес доставки"
                        value={newAddress.address}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              isDefault: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        Сделать адресом по умолчанию
                      </label>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleAddAddress}
                        disabled={isSaving}
                        className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Сохранение..." : "Сохранить"}
                      </button>
                      <button
                        onClick={() => setShowAddAddress(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Отменить
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="font-semibold">
                                {address.title}
                              </span>
                              {address.isDefault && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  По умолчанию
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600">{address.city}</p>
                            <p className="text-gray-600">{address.address}</p>
                          </div>
                          <div className="flex space-x-2">
                            {!address.isDefault && (
                              <button
                                onClick={() =>
                                  handleSetDefaultAddress(address.id)
                                }
                                disabled={isSaving}
                                className="text-blue-900 hover:text-blue-700 text-sm disabled:text-blue-300 disabled:cursor-not-allowed"
                              >
                                По умолчанию
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              disabled={isSaving}
                              className="text-red-500 hover:text-red-700 disabled:text-red-300 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Адреса доставки не добавлены
                    </p>
                  )}
                </div>
              </div>
            )}
            {activeTab === "orders" && (
              <div>
                <h2 className="text-xl font-semibold mb-6">История заказов</h2>
                {ordersLoading && (
                  <p className="text-gray-500">Загрузка истории заказов...</p>
                )}
                {ordersError && (
                  <p className="text-red-600 mb-4">{ordersError}</p>
                )}
                {!ordersLoading &&
                  !ordersError &&
                  orderHistory.length === 0 && (
                    <p className="text-gray-500">
                      Вы еще не оформили ни одного заказа.
                    </p>
                  )}
                <div className="space-y-4">
                  {orderHistory.map((order) => {
                    const itemsSummary = order.items.length
                      ? order.items
                        .map((item) => `${item.name} (x${item.quantity})`)
                        .join(", ")
                      : "Нет товаров";
                    const shippingSummary = order.shipping_address
                      ? [
                        order.shipping_address.title,
                        order.shipping_address.city,
                        order.shipping_address.address,
                      ]
                        .filter((part): part is string => Boolean(part && part.trim()))
                        .join(", ")
                      : null;
                    const statusClasses =
                      order.status === "Одобрен"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "Ждет оплаты"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "Отклонен"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"; // На рассмотрении / fallback

                    const dateValue = new Date(order.created_at);
                    const dateLabel = Number.isNaN(dateValue.getTime())
                      ? order.created_at
                      : dateValue.toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    const currencyLabel = order.currency || "₽";
                    return (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-semibold">
                              Заказ #{order.id}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${statusClasses}`}
                          >
                            {order.status}
                          </span>
                          {/* added */}
                          <span
                            className={
                              order.payment_status === 'Оплачен'
                                ? 'ml-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800'
                                : 'ml-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800'
                            }
                          >
                            {order.payment_status}
                          </span>

                          {order.tracking_code && (
                            <p className="text-gray-600 mb-2">
                              Трек-номер СДЭК: {order.tracking_code}
                            </p>
                          )}

                          {/* added */}

                        </div>
                        <p className="text-gray-600 mb-2">Дата: {dateLabel}</p>
                        {shippingSummary && (
                          <p className="text-gray-600 mb-2">
                            Доставка: {shippingSummary}
                          </p>
                        )}
                        <p className="text-gray-600 mb-2">
                          Товары: {itemsSummary}
                        </p>
                        <p className="font-semibold text-blue-900">
                          Сумма: {order.total_cost.toLocaleString("ru-RU")}{" "}
                          {currencyLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
