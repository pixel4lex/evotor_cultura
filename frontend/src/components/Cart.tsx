import React from 'react';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import type { AppUser } from '../utils/user';

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  brand: string;
  quantity: number;
}

interface CartProps {
  setCurrentView: (view: string) => void;
  openCatalog: (groupId?: string | null) => void;
  cartItems: CartItem[];
  updateCartItem: (id: number | string, quantity: number) => void;
  removeFromCart: (id: number | string) => void;
  user: AppUser | null;
}

export const Cart: React.FC<CartProps> = ({
  setCurrentView,
  openCatalog,
  cartItems,
  updateCartItem,
  removeFromCart,
  user,
}) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }

    setCurrentView('checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => openCatalog()}
            className="flex items-center text-blue-900 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Продолжить покупки
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Корзина</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Корзина пуста</h2>
            <p className="text-gray-600 mb-6">Добавьте товары из каталога</p>
            <button
              onClick={() => openCatalog()}
              className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center p-6 border-b border-gray-200 last:border-b-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.brand}</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {item.price.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-semibold">Итого:</span>
                <span className="text-3xl font-bold text-blue-900">
                  {total.toLocaleString()} ₽
                </span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                >
                  Оформить заказ
                </button>
                {!user && (
                  <p className="text-sm text-gray-600 text-center">
                    Есть аккаунт?{' '}
                    <button
                      onClick={() => setCurrentView('auth')}
                      className="text-blue-900 hover:underline"
                    >
                      Войдите, чтобы оформить заказ
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
