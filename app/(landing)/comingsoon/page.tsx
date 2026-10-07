import Link from 'next/link';

const ComingSoon = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Coming Soon</h1>
            <p className="text-lg mb-8">We are working hard to bring you this feature. Stay tuned!</p>
            <Link href="/" className='mt-6 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition duration-300'>
                Back to Home
            </Link>
        </div>
    );
}

export default ComingSoon;
