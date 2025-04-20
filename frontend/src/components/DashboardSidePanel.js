import React, { useState, useEffect } from 'react';
import { HiHome, HiBars3, HiXMark, HiSun, HiMoon } from "react-icons/hi2";
import { MdOutlinePayment } from "react-icons/md";
import { FaCashRegister } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { VscGraph } from "react-icons/vsc";
import { FaUserCircle } from "react-icons/fa";
import { Link, useLocation } from "react-router";
import { useTheme } from '../context/ThemeContext';

const MOBILE_BREAKPOINT = 768;

const DashboardSidePanel = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    console.log("Current theme in Sidebar:", theme);
    const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(mobile);
            if (mobile) {
                setIsCollapsed(true);
            } else {
                // Keep collapsed state on desktop resize
            };
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActive = (path) => {
        return location.pathname === path;
    };

    const toggleSidebar = () => {
        // Only allow manual toggle on desktop
        if (!isMobile) {
            setIsCollapsed(!isCollapsed);
        }
    };

    const navItems = [
        { path: "/dashboard", icon: <HiHome className="text-xl flex-shrink-0" />, label: "Dashboard" },
        { path: "/transactions", icon: <MdOutlinePayment className="text-xl flex-shrink-0" />, label: "Transactions" },
        { path: "/billing", icon: <FaCashRegister className="text-xl flex-shrink-0" />, label: "Billing" },
        { path: "/inventory", icon: <FaShoppingCart className="text-xl flex-shrink-0" />, label: "Inventory" },
        { path: "/accounts", icon: <VscGraph className="text-xl flex-shrink-0" />, label: "Accounts" },
        { path: "/profile", icon: <FaUserCircle className="text-xl flex-shrink-0" />, label: "Profile" }
    ];

    return (
        <div 
            className={`bg-sky-400 dark:bg-gray-900 font-semibold h-full flex flex-col transition-all duration-300 ease-in-out ${ 
                isCollapsed ? 'w-20' : 'w-64' 
            }`}
        >
            <div className={`p-5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && <h1 className="font-mono text-3xl text-black dark:text-white whitespace-nowrap">shoppr</h1>}
                {!isMobile && (
                    <button 
                        onClick={toggleSidebar} 
                        className="text-black dark:text-gray-300 hover:text-slate-800 dark:hover:text-white p-1 rounded transition-colors"
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <HiBars3 size={24} /> : <HiXMark size={24} />}
                    </button>
                )}
            </div>

            <nav className="flex-grow mt-5 space-y-2 overflow-y-auto overflow-x-hidden px-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.label : ''}
                        className={`py-3 flex items-center rounded-md transition-colors duration-200 ${ 
                            isCollapsed ? 'px-4 justify-center' : 'px-6 justify-start'
                        } ${ 
                            isActive(item.path)
                                ? "bg-slate-800 dark:bg-indigo-600 text-white shadow-inner dark:shadow-dark-inner"
                                : "text-black dark:text-gray-300 hover:bg-slate-800/80 dark:hover:bg-gray-700/50 hover:text-white dark:hover:text-white"
                        }`}
                    >
                        {item.icon}
                        {!isCollapsed && <span className="ml-3 whitespace-nowrap">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-sky-300 dark:border-gray-700">
                 <button
                    onClick={toggleTheme}
                    title={isCollapsed ? (theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : ''}
                    className={`w-full py-2 flex items-center rounded-md transition-colors duration-200 ${ 
                        isCollapsed ? 'px-4 justify-center' : 'px-6 justify-start'
                    } text-black dark:text-gray-300 hover:bg-slate-800/80 dark:hover:bg-gray-700/50 hover:text-white dark:hover:text-white`}
                >
                    {theme === 'dark' ? <HiSun className="text-xl flex-shrink-0" /> : <HiMoon className="text-xl flex-shrink-0" />}
                    {!isCollapsed && <span className="ml-3 whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
            </div>
        </div>
    );
};

export default DashboardSidePanel;