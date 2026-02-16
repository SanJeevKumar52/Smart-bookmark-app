"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {

  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/login");
    } else {
      setUser(data.user);
    }

  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-4">
        Dashboard
      </h1>

      {user && (
        <div className="mb-4">

          <p>
            Logged in as: <strong>{user.email}</strong>
          </p>

        </div>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

    </div>
  );
}
