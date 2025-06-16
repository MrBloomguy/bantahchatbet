import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';

const gifts = [
	{ name: 'Rose', price: 10, img: '/assets/gift-rose.png' },
	{ name: 'Heart', price: 25, img: '/assets/gift-heart.png' },
	{ name: 'Diamond', price: 100, img: '/assets/gift-diamond.png' },
	{ name: 'Rocket', price: 250, img: '/assets/gift-rocket.png' },
	{ name: 'Castle', price: 1000, img: '/assets/gift-castle.png' },
];

const Gift: React.FC = () => {
	const [selectedGift, setSelectedGift] = useState<null | typeof gifts[0]>(null);
	const [showModal, setShowModal] = useState(false);

	const handleBuyClick = (gift: typeof gifts[0]) => {
		setSelectedGift(gift);
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setSelectedGift(null);
	};

	return (
		<div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
			<PageHeader title="Gift Store" showBackButton={true} />
			<div className="flex-1 flex flex-col items-center w-full">
				<div className="w-full max-w-xl mx-auto px-2 sm:px-4 py-4">
					<div className="relative bg-white rounded-3xl px-4 pt-5 pb-4 mb-4 border border-[#f0f1fa] shadow-sm">
						<h2 className="text-xl font-bold mb-4 text-center">
							Buy, sell, and share gifts with your friends!
						</h2>
						<div className="grid grid-cols-3 gap-4 mb-6">
							{gifts.map(gift => (
								<div
									key={gift.name}
									className="flex flex-col items-center bg-[#f9f9ff] rounded-xl p-3 shadow hover:shadow-lg transition"
								>
									<img
										src={gift.img}
										alt={gift.name}
										className="w-14 h-14 mb-2"
									/>
									<span className="font-semibold text-sm mb-1">
										{gift.name}
									</span>
									<span className="text-xs text-purple-600 font-bold">
										{gift.price} Coins
									</span>
									<button className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium hover:bg-purple-700 transition" onClick={() => handleBuyClick(gift)}>
										Buy
									</button>
								</div>
							))}
						</div>
						<div className="text-center text-xs text-gray-400">
							More gifts coming soon!
						</div>
					</div>
				</div>
			</div>
			{/* Modal */}
			{showModal && selectedGift && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xs relative animate-fadeIn">
						<button onClick={closeModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
						<div className="flex flex-col items-center">
							<img src={selectedGift.img} alt={selectedGift.name} className="w-16 h-16 mb-2" />
							<h3 className="text-lg font-bold mb-1">{selectedGift.name}</h3>
							<span className="text-purple-600 font-semibold mb-4">{selectedGift.price} Coins</span>
							<div className="flex flex-col gap-2 w-full">
								<button className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">Buy</button>
								<button className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition">Share</button>
								<button className="w-full py-2 bg-yellow-400 text-white rounded-lg font-medium hover:bg-yellow-500 transition">Sell</button>
							</div>
						</div>
					</div>
				</div>
			)}
			<MobileFooterNav />
		</div>
	);
};

export default Gift;
