"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">אירעה שגיאה</h2>
        <p className="text-gray-500 text-sm mb-4">{error.message}</p>
        {error.digest && <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
