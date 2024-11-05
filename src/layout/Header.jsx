import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="w-full bg-slate-800 text-white shadow-lg">
            <div className="container mx-auto px-1">
                <div className="flex items-center justify-between h-16">
                    {/* Left section */}
                    <div className="flex items-center space-x-4">
                        <button className="p-2 hover:bg-slate-700 rounded-lg">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Center section - Navigation */}
                    <nav className="hidden md:flex space-x-6">
                        <a href="/packs" className="hover:text-blue-400 transition-colors">
                            Packs
                        </a>
                        <a href="/library" className="hover:text-blue-400 transition-colors">
                            Library
                        </a>
                        <a href="/store" className="hover:text-blue-400 transition-colors">
                            Store
                        </a>
                    </nav>

                    {/* Right section */}
                    <div className="flex items-center space-x-4">
                        <button className="p-2 hover:bg-slate-700 rounded-lg">
                            <Search className="h-5 w-5" />
                        </button>
                        <button className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded-lg">
                            <User className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;