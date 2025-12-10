import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, Check } from "lucide-react";
import { createOrder, type CreateOrderRequest } from "../api/orders";
import type { TokenBundle } from "../api/auth";
import { updateStoredUser } from "../utils/authStorage";
import type { AppUser, UserAddress } from "../utils/user";

interface CheckoutCartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  brand?: string;
  image?: string;
}

interface CheckoutFormProps {
  user: AppUser | null;
  authTokens: TokenBundle | null;
  setUser: (user: AppUser) => void;
  cartItems: CheckoutCartItem[];
  setCurrentView: (view: string) => void;
  removeFromCart: (id: number | string) => void;
}

interface DraftAddress {
  title: string;
  city: string;
  address: string;
  isDefault: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  user,
  authTokens,
  setUser,
  cartItems,
  setCurrentView,
  removeFromCart,
}) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<DraftAddress>({
    title: "",
    city: "",
    address: "",
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  const isAuthenticated = Boolean(user && authTokens?.access_token);
  const canSubmitOrder = isAuthenticated
    ? Boolean(selectedAddressId)
    : Boolean(guestName.trim() && guestPhone.trim() && guestAddress.trim());

  useEffect(() => {
    if (!user?.addresses?.length) {
      setSelectedAddressId(null);
      return;
    }

    const defaultAddress = user.addresses.find((addr) => addr.isDefault);
    setSelectedAddressId((defaultAddress ?? user.addresses[0]).id);
  }, [user]);

  const handleAddNewAddress = () => {
    if (!user) {
      setErrorMessage("Авторизуйтесь, чтобы добавить адрес.");
      return;
    }

    if (!newAddress.title.trim() || !newAddress.city.trim() || !newAddress.address.trim()) {
      setErrorMessage("Заполните все поля адреса.");
      return;
    }

    const addressWithId: UserAddress = {
      id: Date.now().toString(),
      title: newAddress.title.trim(),
      city: newAddress.city.trim(),
      address: newAddress.address.trim(),
      isDefault: newAddress.isDefault,
    };

    let nextAddresses: UserAddress[] = [...(user.addresses ?? []), addressWithId];

    if (!user.addresses?.length || newAddress.isDefault) {
      nextAddresses = nextAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressWithId.id,
      }));
    }

    const updatedUser: AppUser = {
      ...user,
      addresses: nextAddresses,
    };

    setUser(updatedUser);
    updateStoredUser(updatedUser);
    setSelectedAddressId(addressWithId.id);
    setNewAddress({ title: "", city: "", address: "", isDefault: false });
    setShowNewAddressForm(false);
    setErrorMessage(null);
  };

  const handleCompleteOrder = async () => {
    if (!cartItems.length) {
      return;
    }

    const orderItems = cartItems.map((item) => ({
      id: String(item.id),
      name: item.name,
      price: Math.round(item.price),
      quantity: item.quantity,
      brand: item.brand ?? null,
      image: item.image ?? null,
    }));

    const requestPayload: CreateOrderRequest = {
      items: orderItems,
      shipping_address: {
        id: null,
        title: "",
        city: null,
        address: "",
      },
    };

    if (isAuthenticated && user) {
      const shipping = user.addresses.find((addr) => addr.id === selectedAddressId);
      if (!shipping) {
        setErrorMessage("Выберите адрес доставки.");
        return;
      }
      requestPayload.shipping_address = {
        id: shipping.id,
        title: shipping.title,
        city: shipping.city,
        address: shipping.address,
      };
      requestPayload.customer_name = user.name || undefined;
      requestPayload.customer_phone = user.phone || undefined;
      requestPayload.customer_email = user.email || undefined;
    } else {
      const trimmedName = guestName.trim();
      const trimmedPhone = guestPhone.trim();
      const trimmedAddress = guestAddress.trim();

      if (!trimmedName || !trimmedPhone || !trimmedAddress) {
        setErrorMessage("Укажите имя, телефон и адрес для оформления заказа.");
        return;
      }

      requestPayload.shipping_address = {
        id: null,
        title: "Адрес доставки",
        city: null,
        address: trimmedAddress,
      };
      requestPayload.customer_name = trimmedName;
      requestPayload.customer_phone = trimmedPhone;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createOrder(requestPayload, authTokens?.access_token);
      cartItems.forEach((item) => removeFromCart(item.id));
      if (!isAuthenticated) {
        setGuestName("");
        setGuestPhone("");
        setGuestAddress("");
      }
      alert("Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.");
      setCurrentView("home");
    } catch (error) {
      console.error("Create order failed", error);
      setErrorMessage("Не удалось оформить заказ. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {isAuthenticated ? "Выберите адрес доставки" : "Оформление заказа без регистрации"}
      </h2>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {!isAuthenticated && (
        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600">
            Укажите контактные данные, чтобы мы могли связаться с вами и доставить заказ.
          </p>
          <input
            type="text"
            placeholder="Ваше имя"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Телефон"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            placeholder="Адрес доставки"
            value={guestAddress}
            onChange={(e) => setGuestAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {isAuthenticated && user?.addresses && user.addresses.length > 0 && (
        <div className="space-y-3 mb-6">
          {user.addresses.map((address) => (
            <div
              key={address.id}
              onClick={() => setSelectedAddressId(address.id)}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedAddressId === address.id
                  ? "border-blue-900 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedAddressId === address.id
                        ? "border-blue-900 bg-blue-900"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAddressId === address.id && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-semibold">{address.title}</span>
                      {address.isDefault && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          По умолчанию
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{address.city}</p>
                    <p className="text-gray-600 text-sm">{address.address}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && !showNewAddressForm && (
        <button
          onClick={() => setShowNewAddressForm(true)}
          className="flex items-center text-blue-900 hover:text-blue-700 mb-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить новый адрес
        </button>
      )}

      {isAuthenticated && showNewAddressForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">Новый адрес доставки</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Название (дом, работа, и т.д.)"
              value={newAddress.title}
              onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Город"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Адрес доставки"
              value={newAddress.address}
              onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                className="mr-2"
              />
              Сделать адресом по умолчанию
            </label>
            <div className="flex space-x-3">
              <button
                onClick={handleAddNewAddress}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Сохранить адрес
              </button>
              <button
                onClick={() => {
                  setShowNewAddressForm(false);
                  setNewAddress({ title: "", city: "", address: "", isDefault: false });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (!user?.addresses || user.addresses.length === 0) && !showNewAddressForm && (
        <p className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Добавьте адрес доставки, чтобы оформить заказ.
        </p>
      )}

      <div className="border-t pt-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-3">Ваш заказ:</h3>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold">Итого:</span>
          <span className="text-2xl font-bold text-blue-900">
            {total.toLocaleString()} ₽
          </span>
        </div>

        <button
          onClick={handleCompleteOrder}
          disabled={isSubmitting || !canSubmitOrder}
          className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Оформляем..." : "Оформить заказ"}
        </button>
      </div>
    </div>
  );
};
