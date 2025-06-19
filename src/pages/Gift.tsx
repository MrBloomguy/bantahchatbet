import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';

// Emojis for gifts - to be replaced later
const giftAssets = {
    'Hair': '💇‍♀️',
    'Boxing Gloves': '🥊',
    'Rose': '🌹',
    'Perfume': '🧴',
    'Beating Heart': '❤️‍🔥',
    'Money Gun': '🔫💵',
    'Your Concert': '🎤🎶',
    'Animal Band': '🐾🥁',
    'Hat and Mustache': '🎩🥸',
    'Treasure Box': '🎁✨',
    'Naughty Chicken': '🐔',
    'Happy Friday': '🎉🥳',
    'Diamond': '💎',
    'Pearl': '⚪',
    'Ruby': '🔴',
    'Emerald': '🟢',
    'Gold Bar': '🥇',
    'Silver Coin': '🥈',
    'Star': '⭐',
    'Crown': '👑',
    'Medal': '🏅',
    'Key': '🔑',
    'Present': '🎁',
    'Tik Tok': '🎵',
    'Fire': '🔥',
};

const gifts = [
    // Frequently Used (top row from picture3.avif)
    { id: 'hair', name: 'Hair', price: 299, img: giftAssets['Hair'], isFrequentlyUsed: true },
    { id: 'boxing-gloves', name: 'Boxing Gloves', price: 299, img: giftAssets['Boxing Gloves'], isFrequentlyUsed: true },
    { id: 'rose', name: 'Rose', price: 1, img: giftAssets['Rose'], isFrequentlyUsed: true },
    { id: 'perfume', name: 'Perfume', price: 20, img: giftAssets['Perfume'], isFrequentlyUsed: true },

    // More Gifts (subsequent rows from picture3.avif)
    { id: 'beating-heart', name: 'Beating Heart', price: 449, img: giftAssets['Beating Heart'] },
    { id: 'money-gun', name: 'Money Gun', price: 500, img: giftAssets['Money Gun'] },
    { id: 'your-concert', name: 'Your Concert', price: 4500, img: giftAssets['Your Concert'] },
    { id: 'animal-band', name: 'Animal Band', price: 2500, img: giftAssets['Animal Band'] },
    { id: 'hat-mustache', name: 'Hat & Mustache', price: 150, img: giftAssets['Hat and Mustache'] },
    { id: 'treasure-box', name: 'Treasure Box', price: 750, img: giftAssets['Treasure Box'] },
    { id: 'naughty-chicken', name: 'Naughty Chicken', price: 300, img: giftAssets['Naughty Chicken'] },
    { id: 'happy-friday', name: 'Happy Friday', price: 120, img: giftAssets['Happy Friday'] },
    // Adding some more diverse gifts from the previous lists to fill out the grid
    { id: 'diamond', name: 'Diamond', price: 700, img: giftAssets['Diamond'] },
    { id: 'pearl', name: 'Pearl', price: 350, img: giftAssets['Pearl'] },
    { id: 'ruby', name: 'Ruby', price: 800, img: giftAssets['Ruby'] },
    { id: 'emerald', name: 'Emerald', price: 900, img: giftAssets['Emerald'] },
    { id: 'gold-bar', name: 'Gold Bar', price: 1200, img: giftAssets['Gold Bar'] },
    { id: 'silver-coin', name: 'Silver Coin', price: 600, img: giftAssets['Silver Coin'] },
];

const GiftShop: React.FC = () => {
    const [selectedGift, setSelectedGift] = useState<null | typeof gifts[0]>(null);
    const [showModal, setShowModal] = useState(false);

    const handleGiftClick = (gift: typeof gifts[0]) => {
        setSelectedGift(gift);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedGift(null);
    };

    const handleSendClick = () => {
        if (selectedGift) {
            alert(`Sending ${selectedGift.name} for ${selectedGift.price} coins!`);
            closeModal();
        }
    };

    const handleBuyClick = () => {
        if (selectedGift) {
            alert(`Buying ${selectedGift.name} for ${selectedGift.price} coins!`);
            closeModal();
        }
    };

    const handleShareClick = () => {
        if (selectedGift) {
            alert(`Sharing ${selectedGift.name}!`);
            closeModal();
        }
    };

    const handleSellClick = () => {
        if (selectedGift) {
            alert(`Selling ${selectedGift.name}!`);
            closeModal();
        }
    };

    const frequentlyUsedGifts = gifts.filter(gift => gift.isFrequentlyUsed);
    const moreGifts = gifts.filter(gift => !gift.isFrequentlyUsed);

    return (
        // Overall page background: Reverted to light theme from your initial code
        <div className="min-h-screen bg-[#F6F7FB] text-gray-900 flex flex-col pb-[70px]">
            {/* PageHeader - untouched as per instructions */}
            <PageHeader title="Shop" showBackButton={true} />

            {/* Main content area, light theme */}
            <div className="flex-1 flex flex-col w-full overflow-y-auto px-4 py-3">
                {/* Top banner from picture3.avif, adapted to light theme */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm rounded-xl px-4 py-2 flex items-center justify-between mb-4 shadow-lg">
                    <span>Come and send these Gifts to see the wonderful ef</span>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </div>

                {/* Frequently Used Section - mimicking picture3.avif with light theme */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-base font-semibold text-gray-800">Frequently used</h2>
                        <button className="text-purple-600 text-sm font-medium">Edit</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {frequentlyUsedGifts.map(gift => (
                            <div
                                key={gift.id}
                                className="flex flex-col items-center bg-white rounded-xl p-2 pb-1 cursor-pointer hover:bg-gray-50 transition-colors relative shadow-md border border-gray-100"
                                onClick={() => handleGiftClick(gift)}
                            >
                                {/* Small icon for corner */}
                                {gift.id === 'money-gun' && (
                                    <div className="absolute top-1 left-1 bg-purple-500 rounded-full p-0.5 z-10">
                                        <span className="text-[10px] leading-none text-white">{giftAssets['Tik Tok']}</span>
                                    </div>
                                )}
                                <div className="w-16 h-16 flex items-center justify-center mb-1 overflow-hidden text-4xl">
                                    {gift.img}
                                </div>
                                <span className="text-[11px] font-medium text-gray-800 text-center truncate w-full px-1">
                                    {gift.name}
                                </span>
                                {/* COMPACT PRICE: Directly below name, no background */}
                                {gift.id !== 'hair' ? (
                                    <div className="flex items-center mt-0.5 justify-center">
                                        <svg className="w-3 h-3 mr-0.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
                                        </svg>
                                        <span className="text-xs font-bold text-gray-700">{gift.price}</span>
                                    </div>
                                ) : (
                                    // COMPACT BUTTON: Special styling for 'Hair' gift
                                    <button
                                        className="mt-1 w-full py-1 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-full text-xs font-semibold hover:from-pink-600 hover:to-red-700 transition-colors shadow-md"
                                        onClick={(e) => { e.stopPropagation(); handleSendClick(); }}
                                    >
                                        Send
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* More Gifts Section - similar compact card style */}
                <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-3 px-1">More Gifts</h2>
                    <div className="grid grid-cols-4 gap-3">
                        {moreGifts.map(gift => (
                            <div
                                key={gift.id}
                                className="flex flex-col items-center bg-white rounded-xl p-2 pb-1 cursor-pointer hover:bg-gray-50 transition-colors relative shadow-md border border-gray-100"
                                onClick={() => handleGiftClick(gift)}
                            >
                                {/* Example of a small icon in corner */}
                                {gift.id === 'beating-heart' && (
                                    <div className="absolute top-1 left-1 bg-red-500 rounded-full p-0.5 z-10">
                                        <span className="text-[10px] leading-none text-white">{giftAssets['Fire']}</span>
                                    </div>
                                )}
                                <div className="w-16 h-16 flex items-center justify-center mb-1 overflow-hidden text-4xl">
                                    {gift.img}
                                </div>
                                <span className="text-[11px] font-medium text-gray-800 text-center truncate w-full px-1">
                                    {gift.name}
                                </span>
                                {/* COMPACT PRICE: Directly below name, no background */}
                                <div className="flex items-center mt-0.5 justify-center">
                                    <svg className="w-3 h-3 mr-0.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="text-xs font-bold text-gray-700">{gift.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal - Light theme and compact */}
            {showModal && selectedGift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs relative animate-fadeIn border border-gray-200">
                        <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-light">&times;</button>
                        <div className="flex flex-col items-center pt-2">
                            <div className="w-24 h-24 mb-4 flex items-center justify-center overflow-hidden text-6xl">
                                {selectedGift.img}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedGift.name}</h3>
                            {/* Modal Price: Remains as a badge for clarity in modal, adapted to light theme */}
                            <div className="flex items-center mb-5 bg-purple-100 rounded-full px-4 py-2">
                                <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
                                </svg>
                                <span className="text-lg font-semibold text-purple-700">{selectedGift.price} Coins</span>
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-red-700 transition-colors shadow-lg"
                                    onClick={handleSendClick}
                                >
                                    Send Gift
                                </button>
                                <button
                                    className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg"
                                    onClick={handleShareClick}
                                >
                                    Share
                                </button>
                                <button
                                    className="w-full py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors shadow-lg"
                                    onClick={handleSellClick}
                                >
                                    Sell
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MobileFooterNav - untouched as per instructions */}
            <MobileFooterNav />
        </div>
    );
};

export default GiftShop;