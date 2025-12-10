import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Save, Trash2 } from 'lucide-react';
import type { TokenBundle } from '../api/auth';
import {
  deleteOrder,
  fetchAllOrders,
  updateOrder,
  type OrderRecord,
  type OrderStatus,
} from '../api/orders';
import type { AppUser } from '../utils/user';

interface AdminProps {
  authTokens: TokenBundle | null;
  user: AppUser | null;
  setCurrentView: (view: string) => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  'На рассмотрении',
  'Ждет оплаты',
  'Одобрен',
  'Отклонен',
];


export const Admin: React.FC<AdminProps> = ({ authTokens, user, setCurrentView }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Partial<OrderRecord>>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  const token = authTokens?.access_token ?? null;

  const hasAccess = useMemo(() => Boolean(token), [token]);
  const adminDisplay = useMemo(() => user?.name || user?.email || null, [user]);

  useEffect(() => {
    if (!hasAccess) {
      setError('Для просмотра заказов войдите под администратором.');
      return;
    }

    void loadOrders();
  }, [hasAccess]);

  const loadOrders = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAllOrders(token);
      setOrders(response);
      setDrafts({});
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setError('Не удалось загрузить заказы. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleStatusChange = (orderId: number, status: OrderStatus) => {
  //   setDrafts((prev) => ({
  //     ...prev,
  //     [orderId]: {
  //       ...(prev[orderId] ?? {}),
  //       status,
  //     },
  //   }));
  // };


  const handleStatusChange = (orderId: number, status: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);

    if (status === 'Одобрен' && order && order.payment_status !== 'Оплачен') {
      const confirmed = window.confirm(
        'Этот заказ еще не оплачен. Вы уверены, что хотите установить статус "Одобрен"?',
      );
      if (!confirmed) {
        return;
      }
    }

    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? {}),
        status,
      },
    }));
  };

  // Helper added
  const handleTrackingChange = (orderId: number, trackingCode: string) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? {}),
        tracking_code: trackingCode,
      },
    }));
  };


  const handleSave = async (orderId: number) => {
    if (!token) {
      return;
    }

    const payload = drafts[orderId];
    if (!payload) {
      return;
    }

    // собираем только те поля, которые реально изменились
    const updatePayload: any = {};

    if (payload.status !== undefined) {
      updatePayload.status = payload.status as OrderStatus;
    }

    if (payload.tracking_code !== undefined) {
      updatePayload.tracking_code = payload.tracking_code as string;
    }

    // если ничего не изменилось — просто выходим
    if (Object.keys(updatePayload).length === 0) {
      return;
    }

    setUpdatingOrderId(orderId);
    setError(null);

    try {
      const updated = await updateOrder(token, orderId, updatePayload);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
      setDrafts((prev) => {
        const { [orderId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to update order', err);
      setError('Не удалось обновить заказ.');
    } finally {
      setUpdatingOrderId(null);
    }
  };


  const handleDelete = async (orderId: number) => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(`Удалить заказ #${orderId}? Отменить действие будет невозможно.`);
    if (!confirmed) {
      return;
    }

    setDeletingOrderId(orderId);
    setError(null);

    try {
      await deleteOrder(token, orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setDrafts((prev) => {
        const { [orderId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete order', err);
      setError('Не удалось удалить заказ. Попробуйте позже.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Администрирование заказов</h1>
            <p className="text-gray-600">Просматривайте и обновляйте статусы заказов.</p>
            {adminDisplay && (
              <p className="text-sm text-gray-500 mt-1">Вы вошли как: {adminDisplay}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentView('home')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              На главную
            </button>
            <button
              onClick={loadOrders}
              disabled={!hasAccess || isLoading}
              className="flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Обновить
            </button>
          </div>
        </div>

        {!hasAccess && (
          <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800 mb-6">
            Войдите под администратором, чтобы увидеть историю заказов.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            Загрузка заказов...
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              // const draft = drafts[order.id];
              // const draftStatus = draft?.status;
              // const displayedStatus = draftStatus ?? order.status;
              // const isDirty = draftStatus !== undefined && draftStatus !== order.status;```

              const draft = drafts[order.id] ?? {};
              const draftStatus = draft.status as OrderStatus | undefined;
              const draftTracking = typeof draft.tracking_code === 'string' ? draft.tracking_code : undefined;

              const displayedStatus = draftStatus ?? order.status;
              const displayedTracking = draftTracking ?? (order.tracking_code ?? '');

              const isDirty =
                (draftStatus !== undefined && draftStatus !== order.status) ||
                (draftTracking !== undefined && draftTracking !== (order.tracking_code ?? ''));


              return (
                <div key={order.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Заказ #{order.id}</h2>
                      <p className="text-sm text-gray-500">
                        Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Статус
                        </label>
                        <div className="flex items-center space-x-2">
                          <select
                            value={displayedStatus}
                            onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSave(order.id)}
                            disabled={!isDirty || updatingOrderId === order.id || deletingOrderId === order.id}
                            className="flex items-center px-3 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400"
                          >
                            {updatingOrderId === order.id ? (
                              'Сохранение...'
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Сохранить
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            disabled={deletingOrderId === order.id}
                            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                          >
                            {deletingOrderId === order.id ? (
                              'Удаление...'
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Клиент
                      </h3>
                      <p className="text-gray-900 font-medium">{order.user.name ?? '—'}</p>
                      <p className="text-sm text-gray-600">{order.user.email ?? '—'}</p>
                      <p className="text-sm text-gray-600">{order.user.phone ?? '—'}</p>
                    </div>

                    <div className="md:col-span-1">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Доставка
                      </h3>
                      {order.shipping_address ? (
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">
                            {order.shipping_address.title || 'Адрес доставки'}
                          </p>
                          {order.shipping_address.city && (
                            <p>{order.shipping_address.city}</p>
                          )}
                          <p>{order.shipping_address.address}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Адрес не указан</p>
                      )}
                    </div>
                    {/* added */}
                    <div className="md:col-span-1">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Итог
                      </h3>
                      <p className="text-2xl font-bold text-blue-900">
                        {order.total_cost.toLocaleString()} {order.currency}
                      </p>
                      <p className="text-sm text-gray-500">
                        Товаров: {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                      </p>

                      <p className="mt-2 text-sm">
                        Оплата:{' '}
                        <span
                          className={
                            order.payment_status === 'Оплачен'
                              ? 'text-green-700 font-semibold'
                              : 'text-red-600 font-semibold'
                          }
                        >
                          {order.payment_status}
                        </span>
                      </p>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Трек-номер СДЭК
                        </label>
                        <input
                          type="text"
                          value={displayedTracking}
                          onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Например, 1234567890"
                        />
                      </div>
                    </div>
                    {/* added */}

                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Состав заказа
                    </h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={`${order.id}-${item.id}`}
                          className="flex justify-between text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2"
                        >
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span>{(item.price * item.quantity).toLocaleString()} {order.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && hasAccess && !isLoading && !error && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
                Заказы ещё не оформлялись.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
