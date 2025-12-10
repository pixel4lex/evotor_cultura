import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, X } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  participants: number;
  coverImage: string;
  images: string[];
  description: string;
}

interface GalleryProps {
  setCurrentView: (view: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ setCurrentView }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const events: Event[] = [
    {
      id: 1,
      title: 'BMX Street Contest 2024',
      date: '15 марта 2024',
      location: 'Москва, Парк Горького',
      participants: 45,
      coverImage: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=600',
      images: [
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      description: 'Крупнейший BMX контест года с участием лучших райдеров России'
    },
    {
      id: 2,
      title: 'Scooter Jam Moscow',
      date: '22 апреля 2024',
      location: 'Москва, Лужники',
      participants: 38,
      coverImage: 'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=600',
      images: [
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      description: 'Соревнования по трюковым самокатам в сердце столицы'
    },
    {
      id: 3,
      title: 'MTB Enduro Challenge',
      date: '10 мая 2024',
      location: 'Подмосковье, Лесной парк',
      participants: 62,
      coverImage: 'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=600',
      images: [
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      description: 'Эндуро гонки по пересеченной местности для настоящих экстремалов'
    },
    {
      id: 4,
      title: 'Street Workout Fest',
      date: '18 июня 2024',
      location: 'СПб, Новая Голландия',
      participants: 55,
      coverImage: 'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=600',
      images: [
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      description: 'Фестиваль уличных тренировок и экстремальных видов спорта'
    },
    {
      id: 5,
      title: 'Surron Electric Race',
      date: '25 июля 2024',
      location: 'Казань, Мотопарк',
      participants: 28,
      coverImage: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=600',
      images: [
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      description: 'Первые в России гонки на электрических мотоциклах Surron'
    },
    {
      id: 6,
      title: 'Cultura Shop Team Ride',
      date: '15 августа 2024',
      location: 'Москва, Сокольники',
      participants: 73,
      coverImage: 'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=600',
      images: [
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      description: 'Командная покатушка от Cultura Shop с розыгрышем призов'
    }
  ];

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setSelectedEvent(null)}
              className="flex items-center text-blue-900 hover:text-blue-700 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Назад к галерее
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h1>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2" />
                {selectedEvent.date}
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                {selectedEvent.location}
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                {selectedEvent.participants} участников
              </div>
            </div>
            <p className="text-gray-700 text-lg">{selectedEvent.description}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedEvent.images.map((image, index) => (
              <div
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
              >
                <img
                  src={image}
                  alt={`${selectedEvent.title} - фото ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity"></div>
              </div>
            ))}
          </div>

          {/* Image Modal */}
          {selectedImageIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
              <div className="relative max-w-4xl max-h-full">
                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                  <X className="h-8 w-8" />
                </button>
                <img
                  src={selectedEvent.images[selectedImageIndex]}
                  alt={`${selectedEvent.title} - фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  <button
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    className="bg-white bg-opacity-20 text-white px-4 py-2 rounded hover:bg-opacity-30 transition-colors"
                    disabled={selectedImageIndex === 0}
                  >
                    ← Предыдущая
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(Math.min(selectedEvent.images.length - 1, selectedImageIndex + 1))}
                    className="bg-white bg-opacity-20 text-white px-4 py-2 rounded hover:bg-opacity-30 transition-colors"
                    disabled={selectedImageIndex === selectedEvent.images.length - 1}
                  >
                    Следующая →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Галерея мероприятий</h1>
        </div>

        <div className="mb-8 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Фотографии с наших мероприятий и соревнований
          </p>
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-lg inline-block">
            🎉 Присоединяйся к нашим мероприятиям!
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:scale-105 overflow-hidden"
            >
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.participants} участников</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-blue-900 font-medium">
                    {event.images.length} фотографий
                  </span>
                  <span className="text-blue-900 font-medium">Смотреть →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};