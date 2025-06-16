import React from 'react';

const gifts = [
  { name: 'Rose', price: 10, img: '/assets/gift-rose.png' },
  { name: 'Heart', price: 25, img: '/assets/gift-heart.png' },
  { name: 'Diamond', price: 100, img: '/assets/gift-diamond.png' },
  { name: 'Rocket', price: 250, img: '/assets/gift-rocket.png' },
  { name: 'Castle', price: 1000, img: '/assets/gift-castle.png' },
];

const Gift: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center">
      <div className="bg-white rounded-3xl shadow-md p-8 max-w-md w-full border border-[#f0f1fa]">
        <h1 className="text-2xl font-bold mb-4 text-center">Gift Store</h1>
        <p className="text-gray-600 text-center mb-6">Buy, sell, and share gifts with your friends!</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {gifts.map(gift => (
            <div key={gift.name} className="flex flex-col items-center bg-[#f9f9ff] rounded-xl p-3 shadow hover:shadow-lg transition">
              <img src={gift.img} alt={gift.name} className="w-14 h-14 mb-2" />
              <span className="font-semibold text-sm mb-1">{gift.name}</span>
              <span className="text-xs text-purple-600 font-bold">{gift.price} Coins</span>
              <button className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium hover:bg-purple-700 transition">Buy</button>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-gray-400">More gifts coming soon!</div>
      </div>
    </div>
  );
};

export default Gift;
