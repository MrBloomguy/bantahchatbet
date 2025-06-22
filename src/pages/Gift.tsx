import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';
import { useWallet } from '../contexts/WalletContext';
import { User, Send, ShoppingCart } from 'lucide-react';

// Emojis for coins (formerly gifts)
const coinAssets = {
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

const coins = [
    { id: 'hair', name: 'Hair', price: 299, img: coinAssets['Hair'], isFrequentlyUsed: true },
    { id: 'boxing-gloves', name: 'Boxing Gloves', price: 299, img: coinAssets['Boxing Gloves'], isFrequentlyUsed: true },
    { id: 'rose', name: 'Rose', price: 1, img: coinAssets['Rose'], isFrequentlyUsed: true },
    { id: 'perfume', name: 'Perfume', price: 20, img: coinAssets['Perfume'], isFrequentlyUsed: true },
    { id: 'beating-heart', name: 'Beating Heart', price: 449, img: coinAssets['Beating Heart'] },
    { id: 'money-gun', name: 'Money Gun', price: 500, img: coinAssets['Money Gun'] },
    { id: 'your-concert', name: 'Your Concert', price: 4500, img: coinAssets['Your Concert'] },
    { id: 'animal-band', name: 'Animal Band', price: 2500, img: coinAssets['Animal Band'] },
    { id: 'hat-mustache', name: 'Hat & Mustache', price: 150, img: coinAssets['Hat and Mustache'] },
    { id: 'treasure-box', name: 'Treasure Box', price: 750, img: coinAssets['Treasure Box'] },
    { id: 'naughty-chicken', name: 'Naughty Chicken', price: 300, img: coinAssets['Naughty Chicken'] },
    { id: 'happy-friday', name: 'Happy Friday', price: 120, img: coinAssets['Happy Friday'] },
    { id: 'diamond', name: 'Diamond', price: 700, img: coinAssets['Diamond'] },
    { id: 'pearl', name: 'Pearl', price: 350, img: coinAssets['Pearl'] },
    { id: 'ruby', name: 'Ruby', price: 800, img: coinAssets['Ruby'] },
    { id: 'emerald', name: 'Emerald', price: 900, img: coinAssets['Emerald'] },
    { id: 'gold-bar', name: 'Gold Bar', price: 1200, img: coinAssets['Gold Bar'] },
    { id: 'silver-coin', name: 'Silver Coin', price: 600, img: coinAssets['Silver Coin'] },
];

const CoinShop: React.FC = () => {
    const [selectedCoin, setSelectedCoin] = useState<null | typeof coins[0]>(null);
    const [showModal, setShowModal] = useState(false);
    const { wallet, refreshWallet } = useWallet();
    const [actionLoading, setActionLoading] = useState(false);
    const [recipient, setRecipient] = useState('');

    const handleCoinClick = (coin: typeof coins[0]) => {
        setSelectedCoin(coin);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCoin(null);
    };

    // Helper: check if user has enough coins
    const canAfford = (price: number) => (wallet?.real_balance ?? 0) >= price;

    // Buy coin (deduct from wallet)
    const handleBuyClick = async () => {
        if (selectedCoin && wallet) {
            if (!canAfford(selectedCoin.price)) {
                alert('Insufficient wallet balance!');
                return;
            }
            setActionLoading(true);
            // TODO: Replace with real API call
            alert(`Buying ${selectedCoin.name} for ${selectedCoin.price} coins!`);
            // Simulate wallet deduction
            // await supabase.rpc('buy_coin', { user_id: wallet.user_id, coin_id: selectedCoin.id, amount: selectedCoin.price })
            await refreshWallet();
            setActionLoading(false);
            closeModal();
        }
    };

    // Send coin (deduct from wallet)
    const handleSendClick = async () => {
        if (selectedCoin && wallet) {
            if (!recipient) {
                alert('Please enter a recipient username or ID!');
                return;
            }
            if (!canAfford(selectedCoin.price)) {
                alert('Insufficient wallet balance!');
                return;
            }
            setActionLoading(true);
            // TODO: Replace with real API call
            alert(`Sending ${selectedCoin.name} for ${selectedCoin.price} coins to ${recipient}!`);
            // await supabase.rpc('send_coin', { user_id: wallet.user_id, coin_id: selectedCoin.id, amount: selectedCoin.price, to_user_id: recipient })
            await refreshWallet();
            setActionLoading(false);
            closeModal();
            setRecipient('');
        }
    };

    const handleShareClick = () => {
        if (selectedCoin) {
            alert(`Sharing ${selectedCoin.name}!`);
            closeModal();
        }
    };

    const handleSellClick = () => {
        if (selectedCoin) {
            alert(`Selling ${selectedCoin.name}!`);
            closeModal();
        }
    };

    const frequentlyUsedCoins = coins.filter(coin => coin.isFrequentlyUsed);
    const moreCoins = coins.filter(coin => !coin.isFrequentlyUsed);

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-900 flex flex-col pb-[70px]">
            <PageHeader title="Coin Shop" showBackButton={true} />
            {/* Wallet Balance Card */}
            <div className="w-full flex justify-center items-center py-4">
                <div className="flex items-center gap-3 bg-white/90 rounded-2xl px-6 py-3 shadow-lg border border-yellow-200">
                    <svg className="w-7 h-7 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#fff">₵</text></svg>
                    <span className="text-lg font-bold text-yellow-700">{wallet ? wallet.real_balance.toLocaleString() : '...'} Coins</span>
                </div>
            </div>
            <div className="flex-1 flex flex-col w-full overflow-y-auto px-4 py-3">
                {/* Banner */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-base rounded-2xl px-5 py-3 flex items-center justify-between mb-6 shadow-xl">
                    <span className="font-semibold">Buy and send Coins to friends or use them for fun!</span>
                    <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                {/* Frequently Used Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-lg font-bold text-yellow-700 flex items-center gap-2"><Send className="w-5 h-5 text-yellow-500" /> Frequently Used</h2>
                        <button className="text-yellow-600 text-sm font-medium">Edit</button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {frequentlyUsedCoins.map(coin => (
                            <div
                                key={coin.id}
                                className="flex flex-col items-center bg-white rounded-2xl p-3 pb-2 cursor-pointer hover:bg-yellow-50 transition-colors relative shadow border border-yellow-100"
                                onClick={() => handleCoinClick(coin)}
                            >
                                {coin.id === 'money-gun' && (
                                    <div className="absolute top-1 left-1 bg-yellow-500 rounded-full p-0.5 z-10">
                                        <span className="text-[10px] leading-none text-white">{coinAssets['Tik Tok']}</span>
                                    </div>
                                )}
                                <div className="w-16 h-16 flex items-center justify-center mb-1 overflow-hidden text-4xl">
                                    {coin.img}
                                </div>
                                <span className="text-[12px] font-semibold text-gray-800 text-center truncate w-full px-1">
                                    {coin.name}
                                </span>
                                {coin.id !== 'hair' ? (
                                    <div className="flex items-center mt-1 justify-center">
                                        <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#fff">₵</text></svg>
                                        <span className="text-sm font-bold text-yellow-700">{coin.price}</span>
                                    </div>
                                ) : (
                                    <button
                                        className="mt-1 w-full py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full text-xs font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-colors shadow-md"
                                        onClick={(e) => { e.stopPropagation(); handleSendClick(); }}
                                    >
                                        Send
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* More Coins Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-yellow-700 mb-3 px-1 flex items-center gap-2"><User className="w-5 h-5 text-yellow-500" /> More Coins</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {moreCoins.map(coin => (
                            <div
                                key={coin.id}
                                className="flex flex-col items-center bg-white rounded-2xl p-3 pb-2 cursor-pointer hover:bg-yellow-50 transition-colors relative shadow border border-yellow-100"
                                onClick={() => handleCoinClick(coin)}
                            >
                                {coin.id === 'beating-heart' && (
                                    <div className="absolute top-1 left-1 bg-yellow-500 rounded-full p-0.5 z-10">
                                        <span className="text-[10px] leading-none text-white">{coinAssets['Fire']}</span>
                                    </div>
                                )}
                                <div className="w-16 h-16 flex items-center justify-center mb-1 overflow-hidden text-4xl">
                                    {coin.img}
                                </div>
                                <span className="text-[12px] font-semibold text-gray-800 text-center truncate w-full px-1">
                                    {coin.name}
                                </span>
                                <div className="flex items-center mt-1 justify-center">
                                    <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#fff">₵</text></svg>
                                    <span className="text-sm font-bold text-yellow-700">{coin.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Modal */}
            {showModal && selectedCoin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-xs relative animate-fadeIn border border-yellow-200">
                        <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-light">&times;</button>
                        <div className="flex flex-col items-center pt-2">
                            <div className="w-24 h-24 mb-4 flex items-center justify-center overflow-hidden text-6xl">
                                {selectedCoin.img}
                            </div>
                            <h3 className="text-2xl font-bold text-yellow-700 mb-1">{selectedCoin.name}</h3>
                            <div className="flex items-center mb-5 bg-yellow-100 rounded-full px-5 py-2">
                                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#fff">₵</text></svg>
                                <span className="text-xl font-semibold text-yellow-700">{selectedCoin.price} Coins</span>
                            </div>
                            {/* Recipient input for sending coins */}
                            <input
                                type="text"
                                placeholder="Recipient username or ID"
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                className="w-full mb-3 px-3 py-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                            />
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-colors shadow-lg disabled:opacity-60"
                                    onClick={handleSendClick}
                                    disabled={actionLoading}
                                >
                                    Send Coin
                                </button>
                                <button
                                    className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-60"
                                    onClick={handleBuyClick}
                                    disabled={actionLoading}
                                >
                                    Buy Coin
                                </button>
                                <button
                                    className="w-full py-3 bg-yellow-200 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors shadow-lg"
                                    onClick={handleSellClick}
                                >
                                    Sell
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <MobileFooterNav />
        </div>
    );
};

export default CoinShop;