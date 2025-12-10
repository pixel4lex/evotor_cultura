import React, { useState } from 'react';
import { ArrowLeft, Gift, ShoppingCart, Star } from 'lucide-react';

interface Certificate {
  id: number;
  name: string;
  amount: number;
  gradient: string;
  description: string;
  features: string[];
}

interface CertificatesProps {
  setCurrentView: (view: string) => void;
  addToCart: (item: any) => void;
}

export const Certificates: React.FC<CertificatesProps> = ({ setCurrentView, addToCart }) => {
  const [customAmount, setCustomAmount] = useState('');

  const certificates: Certificate[] = [
    {
      id: 1,
      name: 'Базовый',
      amount: 5000,
      gradient: 'from-gray-400 to-gray-600',
      description: 'Отличный старт для новичков',
      features: ['Скидка 5% на следующую покупку', 'Бесплатная доставка', 'Консультация специалиста']
    },
    {
      id: 2,
      name: 'Серебряный',
      amount: 10000,
      gradient: 'from-gray-300 to-gray-500',
      description: 'Для тех, кто серьезно увлечен',
      features: ['Скидка 7% на следующую покупку', 'Приоритетная доставка', 'Эксклюзивные предложения', 'Персональный менеджер']
    },
    {
      id: 3,
      name: 'Золотой',
      amount: 25000,
      gradient: 'from-yellow-400 to-orange-500',
      description: 'Премиум выбор для профессионалов',
      features: ['Скидка 10% на следующую покупку', 'Экспресс доставка', 'VIP поддержка', 'Доступ к закрытым распродажам', 'Бесплатное обслуживание']
    },
    {
      id: 4,
      name: 'Платиновый',
      amount: 50000,
      gradient: 'from-purple-500 to-pink-500',
      description: 'Максимальный уровень привилегий',
      features: ['Скидка 15% на следующую покупку', 'Курьерская доставка в день заказа', 'Персональный консультант', 'Эксклюзивные товары', 'Приглашения на закрытые мероприятия', 'Годовое обслуживание']
    }
  ];

  const handleAddCertificate = (certificate: Certificate) => {
    const certItem = {
      id: `cert-${certificate.id}`,
      name: `Подарочный сертификат "${certificate.name}"`,
      price: certificate.amount,
      image: 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=600',
      brand: 'Cultura Shop',
      quantity: 1,
      type: 'certificate'
    };
    addToCart(certItem);
  };

  const handleCustomCertificate = () => {
    const amount = parseInt(customAmount);
    if (amount >= 1000 && amount <= 100000) {
      const certItem = {
        id: `cert-custom-${Date.now()}`,
        name: `Подарочный сертификат на ${amount.toLocaleString()} ₽`,
        price: amount,
        image: 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=600',
        brand: 'Cultura Shop',
        quantity: 1,
        type: 'certificate'
      };
      addToCart(certItem);
      setCustomAmount('');
    } else {
      alert('Сумма должна быть от 1,000 до 100,000 рублей');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center text-blue-900 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            На главную
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Подарочные сертификаты</h1>
        </div>

        <div className="mb-8 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Подарите радость экстремального спорта с нашими сертификатами
          </p>
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-lg inline-block">
            🎁 Идеальный подарок для райдера
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all flex flex-col"
            >
              <div className={`h-32 bg-gradient-to-r ${cert.gradient} flex items-center justify-center relative`}>
                <Gift className="h-12 w-12 text-white opacity-20 absolute top-4 right-4" />
                <div className="text-center text-white">
                  <h3 className="text-xl font-bold">{cert.name}</h3>
                  <p className="text-2xl font-bold">{cert.amount.toLocaleString()} ₽</p>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-gray-600 mb-4">{cert.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {cert.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleAddCertificate(cert)}
                  className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Добавить в корзину
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Certificate */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Создать сертификат на любую сумму
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Выберите сумму от 1,000 до 100,000 рублей
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="number"
                min="1000"
                max="100000"
                step="500"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Введите сумму"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              onClick={handleCustomCertificate}
              disabled={!customAmount || parseInt(customAmount) < 1000 || parseInt(customAmount) > 100000}
              className="bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Создать сертификат
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Сертификат будет отправлен на email после оплаты
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Преимущества наших сертификатов</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Универсальность</h3>
              <p className="text-blue-100">Можно использовать для покупки любых товаров</p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Дополнительные бонусы</h3>
              <p className="text-blue-100">Скидки и привилегии в зависимости от номинала</p>
            </div>
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Удобство</h3>
              <p className="text-blue-100">Мгновенная доставка на email</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};