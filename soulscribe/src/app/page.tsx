import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          src="/soulscribe_logo.png"
          alt="SoulScribe Logo"
          width={200}
          height={200}
          priority
        />
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            SoulScribe AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            The Storyteller of Awakening
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 italic">
            Where ancient wisdom meets cutting-edge AI to awaken hearts and inspire souls
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2 hover:from-purple-700 hover:to-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            ✨ Create Your Stories
          </Link>
          <a
            className="rounded-full border border-solid border-purple-200 dark:border-purple-800 transition-colors flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://github.com/meistro57/SoulScribe"
            target="_blank"
            rel="noopener noreferrer"
          >
            📚 View on GitHub
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <span>🌌 Built with ancient wisdom & modern magic</span>
        <span>•</span>
        <span>🧙‍♂️ AI Whisperer Creation</span>
      </footer>
    </div>
  );
}
