"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {

    const router = useRouter();

    const [user, setUser] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {

        checkUser();

        // Create realtime subscription FIRST
        const channel = supabase
            .channel("bookmarks-channel")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bookmarks",
                },
                (payload) => {

                    if (payload.eventType === "INSERT") {
                        setBookmarks((prev) => [payload.new, ...prev]);
                    }

                    if (payload.eventType === "DELETE") {
                        setBookmarks((prev) =>
                            prev.filter((b) => b.id !== payload.old.id)
                        );
                    }

                }
            )
            .subscribe();

        // Then fetch initial data
        fetchBookmarks();

        return () => {
            supabase.removeChannel(channel);
        };

    }, []);


    // Check logged in user
    const checkUser = async () => {

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
            router.push("/login");
        } else {
            setUser(data.user);
        }

    };

    // Fetch bookmarks
    const fetchBookmarks = async () => {

        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) {
            setBookmarks(data);
        }

    };

    // Add bookmark
    const addBookmark = async () => {

        if (!title || !url) return;

        const { data } = await supabase.auth.getUser();

        await supabase.from("bookmarks").insert([
            {
                title,
                url,
                user_id: data.user.id,
            },
        ]);

        setTitle("");
        setUrl("");

        fetchBookmarks();
    };

    // Delete bookmark
    const deleteBookmark = async (id) => {

        await supabase
            .from("bookmarks")
            .delete()
            .eq("id", id);

        fetchBookmarks();
    };

    // Logout
    const handleLogout = async () => {

        await supabase.auth.signOut();

        router.push("/login");
    };

    return (
        <div className="p-10 max-w-xl mx-auto">

            <h1 className="text-2xl font-bold mb-4">
                Smart Bookmark Dashboard
            </h1>

            {user && (
                <p className="mb-4">
                    Logged in as: {user.email}
                </p>
            )}

            {/* Add Bookmark Form */}
            <div className="mb-6">

                <input
                    type="text"
                    placeholder="Bookmark Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border p-2 mr-2 w-full mb-2"
                />

                <input
                    type="text"
                    placeholder="Bookmark URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="border p-2 mr-2 w-full mb-2"
                />

                <button
                    onClick={addBookmark}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Add Bookmark
                </button>

            </div>

            {/* Bookmark List */}
            <div>

                {bookmarks.length === 0 && (
                    <p>No bookmarks yet.</p>
                )}

                {bookmarks.map((bookmark) => (

                    <div
                        key={bookmark.id}
                        className="border p-3 mb-2 flex justify-between items-center"
                    >

                        <a
                            href={bookmark.url}
                            target="_blank"
                            className="text-blue-600"
                        >
                            {bookmark.title}
                        </a>

                        <button
                            onClick={() => deleteBookmark(bookmark.id)}
                            className="text-red-500"
                        >
                            Delete
                        </button>

                    </div>

                ))}

            </div>

            <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded mt-6"
            >
                Logout
            </button>

        </div>
    );
}
