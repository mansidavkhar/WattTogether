
import { useEffect, useState } from "react";
import CampaignCard from "../components/CampaignCard";

export default function MyInvestment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const ids = JSON.parse(localStorage.getItem("my_investments") || "[]");

    if (!Array.isArray(ids) || ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchOne = async (id) => {
      const res = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/campaigns/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${t}`,
          "x-auth-token": t,
        },
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "Failed to fetch campaign");
      return data.campaign;
    };

    (async () => {
      try {
        const results = await Promise.allSettled(ids.map(fetchOne));
        const campaigns = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value);
        setItems(campaigns);
      } catch (err) {
        setError(err?.message || "Failed to load investments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8 bg-white min-h-screen">
      {loading && <div className="text-center text-gray-600 py-10">Loading your investments...</div>}
      {!loading && items.length === 0 && !error && (
        <div className="text-center text-gray-600 py-10">No investments found yet.</div>
      )}
      {error && (
        <div className="text-center text-red-600 py-10">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 place-items-center">
        {items.map((c) => (
          <CampaignCard key={c._id} campaign={c} />
        ))}
      </div>
    </div>
  );
}