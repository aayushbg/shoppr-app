import { Link } from "react-router";

const LandingPage = () => {
    return (
        <div className="w-screen min-h-screen text-white bg-gradient-to-r from-slate-900 to-slate-700 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 px-4 sm:px-8">
                <h1 className="text-white font-mono text-3xl mb-4 sm:mb-0">shoppr</h1>
                <div className="flex justify-center sm:justify-end space-x-4 w-full sm:w-auto font-[Inter]">
                    <Link to="/login" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Login</Link>
                    <Link to="/register" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Register</Link>
                </div>
            </div>
            <div className="my-16 sm:my-24 px-4 sm:px-8 text-center sm:text-left">
                <p className="font-bold font-[Inter] text-4xl sm:text-5xl lg:text-6xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-1">Smart insights.</p><br className="hidden sm:block" />
                <p className="font-bold font-[Inter] text-4xl sm:text-5xl lg:text-6xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-1">Smarter decisions.</p><br className="hidden sm:block" />
                <p className="font-bold font-[Inter] text-4xl sm:text-5xl lg:text-6xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-1">Bigger profits.</p>
                <p className="font-[Inter] text-base sm:text-lg font-medium text-gray-300 w-full md:w-8/12 lg:w-6/12 mt-8 sm:mt-12 mb-12 sm:mb-16 mx-auto sm:mx-0">Gain deep insights into your shop's performance with powerful analytics and an intuitive dashboard. Track sales trends, monitor profits, and understand customer behavior to make data-driven decisions.</p>
            </div>
            <div className="flex justify-center px-4">
                <img className="border-2 border-amber-50 rounded-xl w-11/12 md:w-10/12 lg:w-9/12 max-w-full h-auto shadow-2xl" src="https://i.postimg.cc/CYByx6Lf/image.png" alt="Dashboard Preview"></img>
            </div>
            <div className="mt-24 sm:mt-32 space-y-16 sm:space-y-20 px-4 sm:px-8">
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <p className="font-bold font-[Inter] text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-2 w-full md:w-5/12 text-center md:text-right">Next Generation of Shop Management</p>
                    <p className="font-[Inter] text-base sm:text-lg text-gray-300 w-full md:w-5/12 text-center md:text-left">Our platform helps you manage transactions, generate invoices, and optimize inventory effortlessly—all in one place. Stay ahead with smart recommendations tailored to your business growth.</p>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <p className="font-bold font-[Inter] text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-2 w-full md:w-5/12 text-center md:text-right">Smart Dashboard & Analytics</p>
                    <p className="font-[Inter] text-base sm:text-lg text-gray-300 w-full md:w-5/12 text-center md:text-left">Get real-time insights into your shop's performance. Track revenue, expenses, customer trends, and growth metrics—all in one intuitive dashboard.</p>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <p className="font-bold font-[Inter] text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-2 w-full md:w-5/12 text-center md:text-right">Effortless Billing & Transactions</p>
                    <p className="font-[Inter] text-base sm:text-lg text-gray-300 w-full md:w-5/12 text-center md:text-left">Generate invoices, track sales, and maintain a digital ledger with ease, reducing manual effort.</p>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <p className="font-bold font-[Inter] text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-2 w-full md:w-5/12 text-center md:text-right">Sales & Profit Trends</p>
                    <p className="font-[Inter] text-base sm:text-lg text-gray-300 w-full md:w-5/12 text-center md:text-left">Understand your shop's financial health with visual charts and reports that highlight profit trends and expense breakdowns.</p>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <p className="font-bold font-[Inter] text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-2 w-full md:w-5/12 text-center md:text-right">Inventory & Expense Tracking</p>
                    <p className="font-[Inter] text-base sm:text-lg text-gray-300 w-full md:w-5/12 text-center md:text-left">Monitor stock levels, prevent shortages, and manage expenses effectively to streamline operations.</p>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <p className="font-bold font-[Inter] text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-br from-white to-zinc-500 inline-block text-transparent bg-clip-text py-2 w-full md:w-5/12 text-center md:text-right">Real-Time Notifications & Alerts</p>
                    <p className="font-[Inter] text-base sm:text-lg text-gray-300 w-full md:w-5/12 text-center md:text-left">Get notified about low stock, high-selling products, or unusual financial activity, so you're always in control.</p>
                </div>
            </div>
            <div className="flex justify-center mt-16 sm:mt-20">
                <Link to="/register" className="text-white font-semibold bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 shadow-lg shadow-purple-500/50 dark:shadow-lg dark:shadow-purple-800/80 rounded-lg text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-3.5 text-center mb-2">Get Started with Shoppr</Link>
            </div>
            <div className="flex justify-center mt-16 sm:mt-20 pb-8">
                <div className="w-11/12 md:w-10/12 border-t border-gray-600 text-center sm:text-left">
                    <p className="my-5 text-sm text-gray-400">© 2025 Shoppr Technologies</p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
