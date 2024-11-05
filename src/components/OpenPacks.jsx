import React, {useEffect, useRef, useState} from 'react';
import { Sparkles, Package, FastForward } from 'lucide-react';
import data from '../data/mockup_pack.json';
import PropTypes from 'prop-types';

const defaultPackData = data;

const OpenPacks = ({ packData = defaultPackData }) => {
    const [isOpening, setIsOpening] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [revealedCards, setRevealedCards] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const packRef = useRef(null);

    const pack = packData || defaultPackData;

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (packRef.current) {
                const packRect = packRef.current.getBoundingClientRect();
                const packCenterX = packRect.left + packRect.width / 2;
                const packCenterY = packRect.top + packRect.height / 2;

                // Calculate distance from center of the pack
                const deltaX = e.clientX - packCenterX;
                const deltaY = e.clientY - packCenterY;

                // Convert to rotation angles (-20 to 20 degrees)
                const x = (deltaX / packRect.width) * 5;
                const y = (deltaY / packRect.height) * -5;

                setRotation({ x, y });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const startOpening = () => {
        setIsOpening(true);
        revealNextCard();
    };

    const revealNextCard = () => {
        if (currentCardIndex < pack.cards.length) {
            setRevealedCards(prev => [...prev, pack.cards[currentCardIndex]]);
            setCurrentCardIndex(prev => prev + 1);
        } else {
            setIsComplete(true);
        }
    };

    const quickOpen = () => {
        setRevealedCards(pack.cards);
        setCurrentCardIndex(pack.cards.length);
        setIsComplete(true);
    };

    if (!pack.cards.length) {
        return (
            <div className="flex flex-col items-center max-w-2xl mx-auto p-4">
                <div className="w-full bg-slate-800 rounded-lg p-4 mb-6 text-white">
                    <h2 className="text-xl font-bold mb-2">No Pack Available</h2>
                    <p className="text-slate-300">Please select a pack to open</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center max-w-2xl mx-auto p-4">
            <div className="w-full bg-slate-800 rounded-lg p-4 mb-6 text-white">
                <h2 className="text-xl font-bold mb-2">{pack.collectionName}</h2>
                <p className="text-slate-300">Contains {pack.totalCards} cards</p>
            </div>

            {!isOpening ? (
                <div
                    ref={packRef}
                    className="relative w-64 h-96 bg-slate-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 hover:backdrop-blur-3xl transition-all duration-200 ease-out"
                    style={{
                        transform: `perspective(1000px) rotateY(${rotation.x}deg) rotateX(${rotation.y}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                    onClick={startOpening}
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Package className="w-16 h-16 mb-4 text-white" />
                        <span className="text-white text-lg font-medium">Click to Open</span>
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {revealedCards.map((card) => (
                            <div
                                key={card.id}
                                className="aspect-[2.5/3.5] bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg relative overflow-hidden"
                            >
                                <Sparkles
                                    className="absolute top-2 right-2 text-yellow-400"
                                    style={{ opacity: card.rarity === 'rare' ? 1 : 0 }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    Card {card.id}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isComplete && (
                        <div className="flex justify-center mt-6 space-x-4">
                            <button
                                onClick={revealNextCard}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Next Card
                            </button>
                            <button
                                onClick={quickOpen}
                                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
                            >
                                <FastForward className="w-4 h-4 mr-2" />
                                Reveal All
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

OpenPacks.propTypes = {
    packData: PropTypes.object
};

export default OpenPacks;