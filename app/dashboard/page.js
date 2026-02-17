"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {

    const router = useRouter();
    const channelRef = useRef(null);

    const [user, setUser] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {

        let mounted = true;

        const init = async () => {

            // get session safely
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push("/login");
                return;
            }

            if (!mounted) return;

            const currentUser = session.user;
            setUser(currentUser);

            // initial fetch
            const { data, error } = await supabase
                .from("bookmarks")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", { ascending: false });

            if (!error && mounted) {
                setBookmarks(data || []);
            }

            // cleanup old channel if exists
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }

            // realtime subscription
            const channel = supabase
                .channel(`bookmarks-${currentUser.id}`)

                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "bookmarks",
                        filter: `user_id=eq.${currentUser.id}`,
                    },
                    (payload) => {

                        setBookmarks(prev => {

                            // prevent duplicate
                            if (prev.find(b => b.id === payload.new.id)) {
                                return prev;
                            }

                            return [payload.new, ...prev];
                        });

                    }
                )

                .on(
                    "postgres_changes",
                    {
                        event: "DELETE",
                        schema: "public",
                        table: "bookmarks",
                        filter: `user_id=eq.${currentUser.id}`,
                    },
                    (payload) => {

                        setBookmarks(prev =>
                            prev.filter(b => b.id !== payload.old.id)
                        );

                    }
                )

                .subscribe();

            channelRef.current = channel;

        };

        init();

        // listen auth change (fix multi tab issue)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {

                if (!session) {
                    setUser(null);
                    setBookmarks([]);
                    router.push("/login");
                } else {
                    setUser(session.user);
                }

            }
        );

        return () => {

            mounted = false;

            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }

            authListener.subscription.unsubscribe();

        };

    }, [router]);


    // ADD BOOKMARK
    const addBookmark = async () => {

        if (!title.trim() || !url.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from("bookmarks")
            .insert({
                title,
                url,
                user_id: user.id,
            });

        if (!error) {
            setTitle("");
            setUrl("");
        }

        // DO NOT call fetchBookmarks()
        // realtime handles it

    };


    // DELETE BOOKMARK
    const deleteBookmark = async (id) => {

        await supabase
            .from("bookmarks")
            .delete()
            .eq("id", id);

        // DO NOT call fetchBookmarks()
        // realtime handles it

    };


    const handleLogout = async () => {

        await supabase.auth.signOut();

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

            <div className="mb-6">

                <input
                    type="text"
                    placeholder="Bookmark Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border p-2 w-full mb-2"
                />

                <input
                    type="text"
                    placeholder="Bookmark URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="border p-2 w-full mb-2"
                />

                <button
                    onClick={addBookmark}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Add Bookmark
                </button>

            </div>

            <div>

                {bookmarks.length === 0 && (
                    <p>No bookmarks yet.</p>
                )}

                {bookmarks.map((bookmark) => (

                    <div
                        key={bookmark.id}
                        className="border p-3 mb-2 flex justify-between"
                    >

                        <a
                            href={bookmark.url}
                            target="_blank"
                            className="text-blue-500"
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
