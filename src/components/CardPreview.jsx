import { useState, useEffect } from 'react';

// Nouveau composant Modal
const CardModal = ({ isOpen, onClose, mousePosition, rotation, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="transform scale-150"
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

const CardPreview = () => {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isTouch, setIsTouch] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Gestion du mouvement de la souris
    const handleMouseMove = (e) => {
        if (!isTouch) {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const rotateX = -((e.clientY - centerY) / 10);
            const rotateY = (e.clientX - centerX) / 10;

            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            setMousePosition({ x, y });
            setRotation({ x: rotateX, y: rotateY });
        }
    };

    // Gestion des événements tactiles
    const handleTouchMove = (e) => {
        e.preventDefault();
        const card = e.currentTarget;
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const rotateX = -((touch.clientY - centerY) / 10);
        const rotateY = (touch.clientX - centerX) / 10;

        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;

        setMousePosition({ x, y });
        setRotation({ x: rotateX, y: rotateY });
    };

    // Réinitialisation de la rotation et de l'effet brillant
    const handleLeave = () => {
        setRotation({ x: 0, y: 0 });
        setMousePosition({ x: 50, y: 50 });
    };

    // Détection du type d'appareil
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouch(isTouchDevice);
        setMousePosition({ x: 50, y: 50 });
    }, []);

    // Contenu de la carte
    const CardContent = () => (
        <div
            className="relative w-64 h-96 rounded-lg transition-transform duration-200 ease-out cursor-pointer"
            style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transformStyle: 'preserve-3d'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleLeave}
            onClick={() => !isModalOpen && setIsModalOpen(true)}
        >
            <div
                className="relative w-full h-full rounded-lg border-8 border-purple-300 bg-white shadow-xl overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(125deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)'
                }}
            >
                <div
                    className="absolute w-full h-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 95%)`,
                        mixBlendMode: 'overlay',
                        zIndex: 2
                    }}
                />

                <div
                    className="absolute w-full h-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 5%)`,
                        mixBlendMode: 'color-dodge',
                        zIndex: 2
                    }}
                />

                <div className="flex items-center justify-center w-full h-full">
                    <img
                        src="https://placehold.co/400x600/png"
                        alt="Card placeholder"
                        className="w-full h-full"
                    />
                </div>
                <div className="textzone-custom absolute bottom-0 left-0 right-0 p-4 backdrop-blur-3xl bg-violet-300 bg-opacity-20">
                    <h2 className="text-lg font-semibold text-purple-900">Titre de la carte</h2>
                    <p className="text-sm text-purple-700">Description de la carte</p>
                    <p className="text-sm text-purple-700">Catégorie</p>
                    <div className="footer-card flex items-center justify-between mt-4">
                        <span className="text-sm text-purple-600">12/2023</span>
                        <span className="text-sm text-purple-600">123</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <CardContent />

            <CardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mousePosition={mousePosition}
                rotation={rotation}
            >
                <CardContent />
            </CardModal>
        </div>
    );
};

export default CardPreview;