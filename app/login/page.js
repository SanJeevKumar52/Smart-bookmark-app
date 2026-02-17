"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
       redirectTo: "https://smart-bookmark-app-rho-seven.vercel.app/dashboard",
      },
    });

    if (error) {
      console.error("Login error:", error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">

      <div className="border p-8 rounded-lg shadow-lg text-center">

        <h1 className="text-2xl font-bold mb-4">
          Smart Bookmark App
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Continue with Google
        </button>

      </div>

    </div>
  );
}
